from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

_RAW_USERS = {
    "admin": {"username": "admin", "password": "admin123", "role": "admin"},
    "user":  {"username": "user",  "password": "user123",  "role": "user"},
}

_HASHED_CACHE: dict[str, bytes] = {}


def _get_hashed(username: str) -> bytes:
    if username not in _HASHED_CACHE:
        plain = _RAW_USERS[username]["password"].encode()
        _HASHED_CACHE[username] = bcrypt.hashpw(plain, bcrypt.gensalt())
    return _HASHED_CACHE[username]

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class User(BaseModel):
    username: str
    role: str

def verify_password(plain: str, username: str) -> bool:
    try:
        hashed = _get_hashed(username)
        return bcrypt.checkpw(plain.encode(), hashed)
    except Exception:
        return False


def authenticate_user(username: str, password: str) -> Optional[dict]:
    user = _RAW_USERS.get(username)
    if not user:
        return None
    if not verify_password(password, username):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah kadaluarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = _RAW_USERS.get(token_data.username)
    if user is None:
        raise credentials_exception
    return User(username=user["username"], role=user["role"])
