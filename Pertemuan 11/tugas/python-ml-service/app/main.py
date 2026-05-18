"""
FastAPI ML Service. Iris Flower Classification
Dataset: Iris Flower Dataset (UCI Machine Learning Repository)
Model: Random Forest Classifier
"""

import json
import hashlib
from contextlib import asynccontextmanager
from typing import List, Optional

import joblib
import numpy as np
import redis
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.auth import (
    Token,
    User,
    authenticate_user,
    create_access_token,
    get_current_user,
)
from app.config import settings
from fastapi.security import OAuth2PasswordRequestForm

model = None
scaler = None
metadata = None
redis_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, scaler, metadata, redis_client

    # Load model
    try:
        model = joblib.load(settings.MODEL_PATH)
        scaler = joblib.load(settings.SCALER_PATH)
        metadata = joblib.load(settings.METADATA_PATH)
        print(f"Model loaded: {metadata['model_type']} | Accuracy: {metadata['accuracy']:.4f}")
    except FileNotFoundError:
        print("Model files not found. Run train_model.py first.")

    # Connect Redis
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        redis_client.ping()
        print(f"Redis connected: {settings.REDIS_URL}")
    except Exception as e:
        redis_client = None
        print(f"Redis not available: {e}. Caching disabled.")

    yield

    # Cleanup
    if redis_client:
        redis_client.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Iris Flower Classification ML Service

Service ini menyediakan prediksi klasifikasi bunga Iris menggunakan **Random Forest Classifier**
yang dilatih dengan dataset Iris dari UCI Machine Learning Repository.

### Dataset
- **Nama**: Iris Flower Dataset
- **Sumber**: UCI Machine Learning Repository
- **Fitur**: sepal length, sepal width, petal length, petal width (dalam cm)
- **Kelas**: Iris-setosa, Iris-versicolor, Iris-virginica

### Autentikasi
Gunakan endpoint `/auth/token` untuk mendapatkan JWT token.
- **admin** / admin123
- **user** / user123
    """,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    sepal_length: float = Field(..., gt=0, example=5.1, description="Sepal length in cm")
    sepal_width: float = Field(..., gt=0, example=3.5, description="Sepal width in cm")
    petal_length: float = Field(..., gt=0, example=1.4, description="Petal length in cm")
    petal_width: float = Field(..., gt=0, example=0.2, description="Petal width in cm")


class PredictResponse(BaseModel):
    prediction: int
    predicted_class: str
    confidence: float
    probabilities: dict
    cached: bool = False


class BatchPredictRequest(BaseModel):
    data: List[PredictRequest]


class BatchPredictResponse(BaseModel):
    results: List[PredictResponse]
    total: int


def _make_cache_key(features: list) -> str:
    raw = json.dumps(features, sort_keys=True)
    return f"predict:{hashlib.md5(raw.encode()).hexdigest()}"


def _predict_single(req: PredictRequest) -> PredictResponse:
    """Core prediction logic (no caching)."""
    if model is None or scaler is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model belum dimuat. Jalankan train_model.py terlebih dahulu.",
        )

    features = [[req.sepal_length, req.sepal_width, req.petal_length, req.petal_width]]
    scaled = scaler.transform(features)
    prediction = int(model.predict(scaled)[0])
    proba = model.predict_proba(scaled)[0]
    confidence = float(np.max(proba))
    class_names = metadata["target_names"]

    return PredictResponse(
        prediction=prediction,
        predicted_class=class_names[prediction],
        confidence=round(confidence, 4),
        probabilities={name: round(float(p), 4) for name, p in zip(class_names, proba)},
        cached=False,
    )


@app.get("/health", tags=["System"])
async def health_check():
    """Cek status service, model, dan Redis."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "model_loaded": model is not None,
        "redis_connected": redis_client is not None,
        "model_info": {
            "type": metadata["model_type"] if metadata else None,
            "accuracy": metadata["accuracy"] if metadata else None,
            "dataset": metadata["dataset"] if metadata else None,
        } if metadata else None,
    }


@app.get("/model-info", tags=["System"])
async def model_info(current_user: User = Depends(get_current_user)):
    """Informasi detail tentang model yang digunakan (butuh autentikasi)."""
    if metadata is None:
        raise HTTPException(status_code=503, detail="Model belum dimuat.")
    return metadata


@app.post("/auth/token", response_model=Token, tags=["Auth"])
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login dan dapatkan JWT access token."""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(data={"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict(
    req: PredictRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Prediksi jenis bunga Iris berdasarkan 4 fitur.

    - **sepal_length**: panjang sepal (cm)
    - **sepal_width**: lebar sepal (cm)
    - **petal_length**: panjang petal (cm)
    - **petal_width**: lebar petal (cm)
    """
    features = [req.sepal_length, req.sepal_width, req.petal_length, req.petal_width]
    cache_key = _make_cache_key(features)

    # Check cache
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            result = PredictResponse(**json.loads(cached))
            result.cached = True
            return result

    result = _predict_single(req)

    # Store in cache
    if redis_client:
        redis_client.setex(cache_key, settings.CACHE_TTL, result.model_dump_json())

    return result


@app.post("/batch-predict", response_model=BatchPredictResponse, tags=["Prediction"])
async def batch_predict(
    req: BatchPredictRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Prediksi batch untuk multiple data sekaligus (maks 100 item).
    """
    if len(req.data) > 100:
        raise HTTPException(status_code=400, detail="Maksimal 100 item per batch.")

    results = []
    for item in req.data:
        features = [item.sepal_length, item.sepal_width, item.petal_length, item.petal_width]
        cache_key = _make_cache_key(features)

        if redis_client:
            cached = redis_client.get(cache_key)
            if cached:
                r = PredictResponse(**json.loads(cached))
                r.cached = True
                results.append(r)
                continue

        r = _predict_single(item)
        if redis_client:
            redis_client.setex(cache_key, settings.CACHE_TTL, r.model_dump_json())
        results.append(r)

    return BatchPredictResponse(results=results, total=len(results))
