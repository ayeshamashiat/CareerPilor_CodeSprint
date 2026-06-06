from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.utils.mongo_client import users_collection
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user.password)
    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed,
        "created_at": datetime.utcnow()
    }
    result = await users_collection.insert_one(new_user)
    user_id = str(result.inserted_id)

    token = create_access_token({"sub": user_id})
    return TokenResponse(
        access_token=token,
        user_id=user_id,
        name=user.name,
        email=user.email
    )

@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(db_user["_id"])
    token = create_access_token({"sub": user_id})
    return TokenResponse(
        access_token=token,
        user_id=user_id,
        name=db_user["name"],
        email=db_user["email"]
    )

@router.get("/me")
async def get_me(user_id: str = Depends(get_current_user)):
    db_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": str(db_user["_id"]),
        "name": db_user["name"],
        "email": db_user["email"],
        "created_at": db_user["created_at"]
    }

from pydantic import BaseModel as PydanticBaseModel

class PasswordChangeRequest(PydanticBaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    user_id: str = Depends(get_current_user)
):
    db_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not db_user:
        raise HTTPException(404, "User not found")
    
    if not verify_password(request.current_password, db_user["password"]):
        raise HTTPException(400, "Current password is incorrect")
    
    new_hashed = hash_password(request.new_password)
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": new_hashed}}
    )
    return {"message": "Password updated successfully"}