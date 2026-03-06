from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
import hashlib
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
import uuid
from database import get_db
from models import User

SECRET_KEY    = os.environ["JWT_SECRET"]
ALGORITHM     = "HS256"
EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", 10080))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# SHA256 pre-hash: always 64 hex chars = 32 bytes. Bypasses bcrypt 72-byte limit entirely.
def _prehash(password) -> bytes:
    if password is None:
        pw = b""
    elif isinstance(password, bytes):
        pw = password
    else:
        pw = str(password).encode("utf-8", errors="replace")
    return hashlib.sha256(pw).hexdigest().encode("ascii")

def hash_password(password: str) -> str:
    pw = _prehash(password)
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    pw = _prehash(plain)
    hashed_b = hashed.encode("utf-8")
    # Try new format: bcrypt(sha256(plain))
    if bcrypt.checkpw(pw, hashed_b):
        return True
    # Legacy: bcrypt(plain) for users created before SHA256 pre-hash
    legacy = plain.encode("utf-8", errors="replace")[:72] if plain else b""
    return bcrypt.checkpw(legacy, hashed_b)

def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire},
        SECRET_KEY, algorithm=ALGORITHM
    )

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY,
                             algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    try:
        uid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        raise credentials_exception
    result = await db.execute(
        select(User).where(User.id == uid)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user
