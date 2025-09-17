# app/papers/services.py
"""
Utilities to query arXiv and return sanitized paper metadata.
This module intentionally only returns metadata (title, authors,
abstract snippet, published date, links). Full PDF/text is NOT fetched here —
that will happen later when the user clicks "open" or "chat with paper".
"""

from typing import List, Dict, Optional
import arxiv
from datetime import datetime


def _authors_to_list(authors) -> List[str]:
    """
    arxiv package returns author objects or strings depending on version.
    Normalize to list[str].
    """
    out = []
    for a in authors:
        if hasattr(a, "name"):
            out.append(a.name)
        else:
            out.append(str(a))
    return out


def _result_to_metadata(result) -> Dict[str, Optional[str]]:
    """
    Convert an arxiv.Result to a plain-dict metadata record.
    Keep fields minimal and stable for the frontend.
    """
    published = None
    try:
        if hasattr(result, "published") and isinstance(result.published, datetime):
            published = result.published.date().isoformat()
        else:
            published = str(getattr(result, "published", None))
    except Exception:
        published = None

    pdf_url = None
    try:
        pdf_url = getattr(result, "pdf_url", None)
        if not pdf_url:
            entry = getattr(result, "entry_id", None) or getattr(result, "id", None)
            if entry:
                pdf_url = str(entry).replace("/abs/", "/pdf/")
    except Exception:
        pdf_url = None

    abs_url = getattr(result, "entry_id", None) or getattr(result, "id", None) or None

    return {
        "title": getattr(result, "title", "") or "",
        "authors": _authors_to_list(getattr(result, "authors", []) or []),
        "abstract": getattr(result, "summary", "") or "",
        "published": published,
        "link": str(abs_url) if abs_url else None,
        "pdf_url": str(pdf_url) if pdf_url else None,
        "arxiv_id": getattr(result, "get_short_id", lambda: None)() if hasattr(result, "get_short_id") else None,
    }


def build_query_from_profile(
    interests: Optional[List[str]],
    degree: Optional[str],
    year: Optional[int],
    search_in_title_and_abstract: bool = False
) -> str:
    """
    Build a simple arXiv query string from user's profile.
    If search_in_title_and_abstract=True, restrict to ti: and abs: fields.
    """
    terms = []
    if interests:
        for it in interests:
            it = it.strip()
            if it:
                if search_in_title_and_abstract:
                    terms.append(f'(ti:"{it}" OR abs:"{it}")')
                else:
                    terms.append(f'"{it}"')
    if degree:
        degree = degree.strip()
        if degree:
            if search_in_title_and_abstract:
                terms.append(f'(ti:"{degree}" OR abs:"{degree}")')
            else:
                terms.append(f'"{degree}"')
    if year:
        terms.append(str(year))

    if not terms:
        return "machine learning OR deep learning OR artificial intelligence"

    return " OR ".join(terms)


def fetch_papers_for_profile(
    interests: Optional[List[str]],
    degree: Optional[str],
    year: Optional[int],
    max_results: int = 10,
    search_in_title_and_abstract: bool = False
) -> List[Dict]:
    """
    Query arXiv using profile-derived keywords and return a list of metadata dicts.
    """
    query = build_query_from_profile(interests, degree, year, search_in_title_and_abstract)
    try:
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate
        )
    except Exception:
        search = arxiv.Search(query=query, max_results=max_results)

    results = []
    try:
        for r in search.results():
            results.append(_result_to_metadata(r))
    except Exception as e:
        print("arXiv fetch error:", e)
    return results


def search_papers_by_query(
    query: str,
    max_results: int = 10,
    search_in_title_and_abstract: bool = False
) -> List[Dict]:
    """
    Search arXiv based on a plain-text query.
    If search_in_title_and_abstract=True, restrict query to title and abstract fields.
    """
    if not query or not query.strip():
        return []

    query = query.strip()
    if search_in_title_and_abstract:
        # restrict search to title and abstract
        query = f'(ti:"{query}" OR abs:"{query}")'

    try:
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate
        )
    except Exception:
        search = arxiv.Search(query=query, max_results=max_results)

    out = []
    try:
        for r in search.results():
            out.append(_result_to_metadata(r))
    except Exception as e:
        print("arXiv search error:", e)
    return out
