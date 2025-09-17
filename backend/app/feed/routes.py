# app/feed/routes.py
from typing import List
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.auth.models import User
from app.auth.utils import get_current_user
from app.papers.services import fetch_papers_for_profile, search_papers_by_query

router = APIRouter(prefix="/feed", tags=["feed"])

# ------------------------
# Schema for paper metadata
# ------------------------
class PaperMeta(BaseModel):
    title: str
    authors: List[str]
    abstract: str
    published: str | None = None
    link: str | None = None
    pdf_url: str | None = None
    arxiv_id: str | None = None

    class Config:
        schema_extra = {
            "example": {
                "title": "Attention Is All You Need",
                "authors": ["Ashish Vaswani", "Noam Shazeer"],
                "abstract": "We propose the Transformer...",
                "published": "2017-06-12",
                "link": "https://arxiv.org/abs/1706.03762",
                "pdf_url": "https://arxiv.org/pdf/1706.03762.pdf",
                "arxiv_id": "1706.03762"
            }
        }

# ------------------------
# Personalized feed endpoint
# ------------------------
@router.get("/", response_model=List[PaperMeta])
def get_personalized_feed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    max_results: int = 10
):
    """
    Fetch a personalized list of papers from arXiv based on the current_user profile.
    We now explicitly search for user interests only in the TITLE and ABSTRACT.
    """
    interests = current_user.interests or []
    degree = current_user.degree
    year = current_user.year

    papers = fetch_papers_for_profile(
        interests=interests,
        degree=degree,
        year=year,
        max_results=max_results,
        search_in_title_and_abstract=True  # <--- new flag
    )
    return papers

# ------------------------
# Search endpoint
# ------------------------
@router.get("/search", response_model=List[PaperMeta])
def search_feed(
    q: str = Query(..., description="Search query (keywords)"),
    current_user: User = Depends(get_current_user),
    max_results: int = 10
):
    """
    Search arXiv based on a user-provided query.
    We now force search to check only title+abstract fields.
    """
    papers = search_papers_by_query(
        q,
        max_results=max_results,
        search_in_title_and_abstract=True  # <--- new flag
    )
    return papers
