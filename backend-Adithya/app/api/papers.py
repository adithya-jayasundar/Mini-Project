from fastapi import APIRouter

router = APIRouter()

@router.get("/search")
def search_papers(query: str):
    # TODO: connect arxiv_service + embeddings
    return {"query": query, "results": ["Dummy Paper 1", "Dummy Paper 2"]}
