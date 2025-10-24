import os
import time
import argparse
import hashlib
from pathlib import Path
import requests
import fitz  # PyMuPDF
from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from collections import OrderedDict


# -------------------------------
# Utility: simple timer
# -------------------------------
def _now():
    return time.perf_counter()


# -------------------------------
# Step 1: Download arXiv paper PDF (with caching)
# -------------------------------
def download_arxiv_pdf(arxiv_url, save_path="paper.pdf", timeout=20):
    # If caller passed None (as some callers do) or left default, use a deterministic
    # per-URL cache path to avoid collisions when processing multiple papers.
    if save_path is None or save_path == "paper.pdf":
        url_hash = hashlib.sha256(arxiv_url.encode("utf-8")).hexdigest()[:12]
        cache_dir = Path(".paper_cache")
        cache_dir.mkdir(parents=True, exist_ok=True)
        save_path = cache_dir / f"{url_hash}.pdf"
    else:
        save_path = Path(save_path)

    if save_path.exists():
        print(f"[+] Using cached PDF: {save_path}")
        return str(save_path)

    if not arxiv_url.endswith(".pdf"):
        arxiv_url = arxiv_url.replace("abs", "pdf") + ".pdf"

    print(f"[>] Downloading PDF from {arxiv_url} ...")
    r = requests.get(arxiv_url, stream=True, timeout=timeout)
    r.raise_for_status()
    with open(save_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    print(f"[+] PDF downloaded: {save_path}")
    return str(save_path)


# -------------------------------
# Step 2: Extract text from PDF (PyMuPDF — faster than pdfminer)
# -------------------------------
def extract_text_from_pdf(pdf_path):
    start = _now()
    doc = fitz.open(pdf_path)
    parts = []
    for page in doc:
        # 'text' format is usually fine; you can experiment with 'blocks' if needed
        parts.append(page.get_text())
    doc.close()
    text = "\n".join(parts)
    print(f"[+] Extracted {len(text)} characters from PDF in {(_now()-start):.2f}s")
    return text


# -------------------------------
# Step 3: Split into chunks (configurable)
# -------------------------------
def split_into_chunks(text, chunk_size=3000, chunk_overlap=300):
    start = _now()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    chunks = splitter.split_text(text)
    print(f"[+] Split into {len(chunks)} chunks (chunk_size={chunk_size}, overlap={chunk_overlap}) in {(_now()-start):.2f}s")
    return chunks


# -------------------------------
# Helper: deterministic index directory per URL
# -------------------------------
def index_dir_for_url(arxiv_url, base_dir="faiss_index"):
    url_hash = hashlib.sha256(arxiv_url.encode("utf-8")).hexdigest()[:12]
    idx = Path(base_dir) / url_hash
    return idx


# Simple in-memory LRU cache for loaded DBs to avoid reloading from disk repeatedly
_DB_CACHE: "OrderedDict[str, tuple]" = OrderedDict()
_DB_CACHE_MAX = 4


def _get_cached_db(key: str):
    val = _DB_CACHE.get(key)
    if val is None:
        return None
    # move to end = most recently used
    _DB_CACHE.move_to_end(key)
    return val


def _cache_db(key: str, db, embeddings):
    if key in _DB_CACHE:
        _DB_CACHE.move_to_end(key)
        return
    _DB_CACHE[key] = (db, embeddings)
    # evict oldest if over limit
    while len(_DB_CACHE) > _DB_CACHE_MAX:
        _DB_CACHE.popitem(last=False)


# -------------------------------
# Step 4: Create / load vector DB (FAISS) with caching
# -------------------------------
def create_vector_db(chunks, index_path="faiss_index", embeddings_model="mistral", rebuild=False, source_url: str | None = None):
    """
    Create or load a FAISS vector DB. If `source_url` is provided, a deterministic
    per-URL index directory will be used so indices are persistent and reusable.
    """
    start = _now()

    # Resolve index path: if source_url provided, use a per-URL subdirectory
    if source_url:
        index_path = index_dir_for_url(source_url, base_dir=index_path)
    index_path = Path(index_path)

    # Ensure embeddings model string
    if not embeddings_model:
        embeddings_model = "mistral"
    embeddings = OllamaEmbeddings(model=embeddings_model)

    # Try to load existing index when present
    if index_path.exists() and not rebuild:
        try:
            print(f"[>] Loading existing FAISS index from {index_path}")
            # FAISS persistence uses pickle under the hood. We only enable
            # dangerous deserialization for local, trusted index directories
            # that our process created. Do NOT enable this when loading
            # untrusted data from unknown sources.
            db = FAISS.load_local(str(index_path), embeddings, allow_dangerous_deserialization=True)
            print(f"[+] Loaded FAISS index in {(_now()-start):.2f}s")
            return db, embeddings
        except Exception as e:
            print(f"[!] Failed to load existing index: {e}. Rebuilding...")

    # Ensure directory exists for saving
    index_path.mkdir(parents=True, exist_ok=True)

    print("[>] Building FAISS index (this may take a while)...")
    db = FAISS.from_texts(chunks, embedding=embeddings)
    try:
        db.save_local(str(index_path))
        print(f"[+] Saved FAISS index to {index_path}")
    except Exception as e:
        print(f"[!] Warning: could not save FAISS index: {e}")

    print(f"[+] Vector DB created in {(_now()-start):.2f}s")
    # cache the loaded DB in memory for faster subsequent queries
    try:
        _cache_db(str(index_path), db, embeddings)
    except Exception:
        pass
    return db, embeddings


# -------------------------------
# Step 5: Query with RAG + fallback — reuse LLM
# -------------------------------
def rag_query(db, query, llm=None, k=8):
    if llm is None:
        llm = Ollama(model="mistral")

    docs = db.similarity_search(query, k=k)

    if not docs:
        print("[!] No relevant chunks found, falling back to LLM knowledge")
        return llm.invoke(query)

    context = "\n\n".join([d.page_content for d in docs])
    prompt = f"Answer the question based only on the context below:\n\n{context}\n\nQuestion: {query}"
    return llm.invoke(prompt)


def parse_args():
    p = argparse.ArgumentParser(description="RAG over an arXiv PDF (caching + faster extraction)")
    p.add_argument("url", nargs="?", default="https://arxiv.org/abs/1706.03762", help="arXiv abstract URL or direct PDF URL")
    p.add_argument("--pdf", default="paper.pdf", help="local PDF path to save/use")
    p.add_argument("--index", default="faiss_index", help="directory for FAISS index")
    p.add_argument("--rebuild-index", action="store_true", help="force rebuild of FAISS index")
    p.add_argument("--chunk-size", type=int, default=3000)
    p.add_argument("--chunk-overlap", type=int, default=300)
    p.add_argument("--question", default="What is an encoder?", help="Question to ask the paper")
    return p.parse_args()


def load_vector_db_for_url(source_url, index_base_dir="faiss_index", embeddings_model="mistral"):
    """
    Load a persisted FAISS index for a given source URL. Returns (db, embeddings) or raises.
    """
    index_path = index_dir_for_url(source_url, base_dir=index_base_dir)
    key = str(index_path)
    cached = _get_cached_db(key)
    if cached is not None:
        return cached

    embeddings = OllamaEmbeddings(model=embeddings_model)
    # When loading a saved FAISS index we enable deserialization for
    # local indexes that we created. This should only be used for
    # trusted local data. See security notes in code comments above.
    db = FAISS.load_local(str(index_path), embeddings, allow_dangerous_deserialization=True)
    try:
        _cache_db(key, db, embeddings)
    except Exception:
        pass
    return db, embeddings


if __name__ == "__main__":
    args = parse_args()

    t0 = _now()
    pdf_path = download_arxiv_pdf(args.url, save_path=args.pdf)

    text = extract_text_from_pdf(pdf_path)

    if "encoder" not in text.lower():
        print("[!] Warning: 'encoder' not found in extracted text — OCR/formatting may have removed content")

    chunks = split_into_chunks(text, chunk_size=args.chunk_size, chunk_overlap=args.chunk_overlap)

    db, embeddings = create_vector_db(chunks, index_path=args.index, embeddings_model="mistral", rebuild=args.rebuild_index)

    # reuse a single LLM instance
    llm = Ollama(model="mistral")

    answer = rag_query(db, args.question, llm=llm, k=8)

    print("\n=== Answer ===\n")
    print(answer)
    print(f"\n[INFO] Total elapsed: {(_now()-t0):.2f}s")
