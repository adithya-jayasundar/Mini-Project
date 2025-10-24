from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncio
import traceback
import hashlib

from app.chat import rag_arxiv
from pathlib import Path

router = APIRouter(tags=["chat"])


class RAGRequest(BaseModel):
	url: str  # arXiv abstract URL or direct PDF URL
	question: str
	chunk_size: int = 3000
	chunk_overlap: int = 300
	rebuild_index: bool = False
	k: int = 8


class RAGResponse(BaseModel):
	answer: str
	debug: dict | None = None


class IndexRequest(BaseModel):
	url: str
	chunk_size: int = 3000
	chunk_overlap: int = 300
	rebuild_index: bool = False


class IndexResponse(BaseModel):
	status: str
	index_path: str | None = None


class QueryRequest(BaseModel):
	url: str
	question: str
	k: int = 8


class QueryResponse(BaseModel):
	answer: str
	debug: dict | None = None


@router.post("/rag", response_model=RAGResponse)
async def rag_over_arxiv(payload: RAGRequest):
	"""
	Run RAG over an arXiv paper (or direct PDF URL).
	This runs the heavy work in a thread to avoid blocking the event loop.
	"""
	try:
		def run_pipeline():
			t0 = rag_arxiv._now()

			# create deterministic names per-paper to avoid index/pdf collisions
			url_hash = hashlib.sha256(payload.url.encode("utf-8")).hexdigest()[:12]

			# download PDF into a per-URL cache (omit save_path so helper uses cache logic)
			pdf_path = rag_arxiv.download_arxiv_pdf(payload.url)

			# per-paper FAISS index will be stored under faiss_index/<url-hash>
			text = rag_arxiv.extract_text_from_pdf(pdf_path)
			chunks = rag_arxiv.split_into_chunks(
				text, chunk_size=payload.chunk_size, chunk_overlap=payload.chunk_overlap
			)
			db, embeddings = rag_arxiv.create_vector_db(
				chunks, index_path="faiss_index", rebuild=payload.rebuild_index, source_url=payload.url
			)
			answer = rag_arxiv.rag_query(db, payload.question, llm=None, k=payload.k)
			elapsed = rag_arxiv._now() - t0
			return {
				"answer": str(answer),
				"debug": {
					"pdf_path": str(pdf_path),
					"num_chars": len(text),
					"num_chunks": len(chunks),
					"elapsed_seconds": elapsed,
				},
			}

		result = await asyncio.to_thread(run_pipeline)
		return RAGResponse(answer=result["answer"], debug=result["debug"])
	except Exception as e:
		traceback_str = traceback.format_exc()
		raise HTTPException(status_code=500, detail=f"RAG pipeline failed: {e}\n{traceback_str}")


@router.post("/index", response_model=IndexResponse, status_code=202)
async def build_index(payload: IndexRequest):
	"""Start building (or rebuilding) the FAISS index for a paper in the background.
	Call this when the user opens "Chat with paper" so the index will be ready for fast queries.
	"""
	try:
		index_dir = rag_arxiv.index_dir_for_url(payload.url, base_dir="faiss_index")
		# ensure index dir exists and mark building
		index_dir.mkdir(parents=True, exist_ok=True)
		building_marker = index_dir / "BUILDING"
		ready_marker = index_dir / "READY"
		error_marker = index_dir / "ERROR"

		# remove old markers
		for p in (ready_marker, error_marker):
			if p.exists():
				try:
					p.unlink()
				except Exception:
					pass

		# write BUILDING marker
		try:
			building_marker.write_text("building")
		except Exception:
			pass

		def run_build():
			try:
				pdf_path = rag_arxiv.download_arxiv_pdf(payload.url)
				text = rag_arxiv.extract_text_from_pdf(pdf_path)
				chunks = rag_arxiv.split_into_chunks(text, chunk_size=payload.chunk_size, chunk_overlap=payload.chunk_overlap)
				db, embeddings = rag_arxiv.create_vector_db(chunks, index_path="faiss_index", rebuild=payload.rebuild_index, source_url=payload.url)
				# on success, write READY marker
				try:
					ready_marker.write_text("ready")
				except Exception:
					pass
				# remove BUILDING
				try:
					if building_marker.exists():
						building_marker.unlink()
				except Exception:
					pass
				return str(index_dir)
			except Exception as e:
				# write error marker with traceback
				try:
					error_marker.write_text(traceback.format_exc())
				except Exception:
					pass
				try:
					if building_marker.exists():
						building_marker.unlink()
				except Exception:
					pass
				raise

		# schedule build in background with a timeout (don't block API)
		BUILD_TIMEOUT = 300
		asyncio.create_task(asyncio.wait_for(asyncio.to_thread(run_build), timeout=BUILD_TIMEOUT))
		return IndexResponse(status="started", index_path=str(index_dir))
	except Exception as e:
		traceback_str = traceback.format_exc()
		raise HTTPException(status_code=500, detail=f"Index build failed: {e}\n{traceback_str}")


@router.get("/index/status")
async def index_status(url: str):
	"""Check index status for a given paper URL. Returns one of: building, ready, error, missing."""
	try:
		index_dir = rag_arxiv.index_dir_for_url(url, base_dir="faiss_index")
		building_marker = index_dir / "BUILDING"
		ready_marker = index_dir / "READY"
		error_marker = index_dir / "ERROR"

		if error_marker.exists():
			return {"status": "error", "detail": error_marker.read_text()}
		if ready_marker.exists():
			return {"status": "ready", "index_path": str(index_dir)}
		if building_marker.exists():
			return {"status": "building"}
		if index_dir.exists():
			# directory exists but no markers; consider it ready if files present
			return {"status": "ready", "index_path": str(index_dir)}
		return {"status": "missing"}
	except Exception as e:
		traceback_str = traceback.format_exc()
		raise HTTPException(status_code=500, detail=f"Index status check failed: {e}\n{traceback_str}")


@router.post("/query", response_model=QueryResponse)
async def query_index(payload: QueryRequest):
	"""Query an existing FAISS index for a paper. If index is missing, return 404 and instruct client to /index first."""
	try:
		idx_dir = rag_arxiv.index_dir_for_url(payload.url, base_dir="faiss_index")
		if not idx_dir.exists():
			raise HTTPException(status_code=404, detail="Index not found. Call /chat/index to build it first.")

		# load DB (fast) and query
		db, embeddings = rag_arxiv.load_vector_db_for_url(payload.url, index_base_dir="faiss_index")
		answer = rag_arxiv.rag_query(db, payload.question, llm=None, k=payload.k)
		return QueryResponse(answer=str(answer), debug={"index_path": str(idx_dir)})
	except HTTPException:
		raise
	except Exception as e:
		traceback_str = traceback.format_exc()
		raise HTTPException(status_code=500, detail=f"Query failed: {e}\n{traceback_str}")

