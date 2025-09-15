from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.papers import models, services
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/papers", tags=["papers"])

class PaperResponse(BaseModel):
    id: int | None = None
    title: str
    authors: str
    abstract: str | None = None
    link: str
    published: str

    class Config:
        orm_mode = True

# --- Get local papers ---
@router.get("/", response_model=List[PaperResponse])
def get_papers(db: Session = Depends(get_db)):
    return db.query(models.Paper).all()

# --- Fetch live from arXiv ---
@router.get("/fetch", response_model=List[PaperResponse])
def fetch_papers(q: str, db: Session = Depends(get_db)):
    papers = services.fetch_from_arxiv(q)
    if not papers:
        raise HTTPException(status_code=404, detail="No papers found")

    # Optionally save first results in DB
    saved_papers = []
    for p in papers:
        paper = models.Paper(
            title=p["title"],
            authors=p["authors"],
            abstract=p["abstract"],
            link=p["link"]
        )
        db.add(paper)
        saved_papers.append(paper)

    db.commit()
    return saved_papers

# --- Get single paper by ID ---
@router.get("/{paper_id}", response_model=PaperResponse)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(models.Paper).filter(models.Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper
