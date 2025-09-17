# app/auth/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.auth import models, schemas, utils

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 2. Hash the password
    hashed_password = utils.hash_password(user.password)

    # 3. Create new user instance
    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        age=user.age,
        degree=user.degree,
        year=user.year,
        interests=user.interests,
    )

    # 4. Save to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

# app/auth/routes.py (add below your /signup route)

from fastapi import Response

@router.post("/login")
def login(user: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not utils.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Create JWT token
    access_token = utils.create_access_token({"sub": db_user.email})
    
    # Set HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,      # User cannot access via JS
        max_age=60*60*24,   # Optional: 1 day
        secure=False,       # Set True if using HTTPS
        samesite="lax"
    )
    
    return {"message": "Login successful"}
