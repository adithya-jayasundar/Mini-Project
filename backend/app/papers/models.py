from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db import Base
from datetime import datetime

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    authors = Column(Text, nullable=False)
    abstract = Column(Text, nullable=True)
    link = Column(String(500), nullable=False)
    published = Column(DateTime, default=datetime.utcnow)
    source = Column(String(50), default="arxiv")  # arxiv / local / other
