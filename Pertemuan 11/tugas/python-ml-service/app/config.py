import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Iris ML Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "300")) 

    MODEL_PATH: str = os.getenv("MODEL_PATH", "model/iris_model.joblib")
    SCALER_PATH: str = os.getenv("SCALER_PATH", "model/scaler.joblib")
    METADATA_PATH: str = os.getenv("METADATA_PATH", "model/metadata.joblib")

    class Config:
        env_file = ".env"


settings = Settings()
