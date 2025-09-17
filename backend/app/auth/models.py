from sqlalchemy import Column, Integer, String, ARRAY
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    age = Column(Integer, nullable=True)
    degree = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    interests = Column(ARRAY(String), nullable=True)
