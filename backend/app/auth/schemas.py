# app/auth/schemas.py

from pydantic import BaseModel, EmailStr
from typing import List, Optional

# --- Existing schemas ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: Optional[int] = None
    degree: Optional[str] = None
    year: Optional[int] = None
    interests: Optional[List[str]] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    age: Optional[int] = None
    degree: Optional[str] = None
    year: Optional[int] = None
    interests: Optional[List[str]] = None

    class Config:
        from_attributes = True  # allows SQLAlchemy model → Pydantic conversion


# --- New schema for login ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- Schema for profile updates ---
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    degree: Optional[str] = None
    year: Optional[int] = None
    interests: Optional[List[str]] = None
