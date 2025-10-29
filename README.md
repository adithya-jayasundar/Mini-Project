# Research Paper Explorer

A modern, full-stack web application for discovering, exploring, and interacting with academic research papers through an intelligent chat interface powered by RAG (Retrieval-Augmented Generation).

## Features

- **Smart Paper Discovery**: Personalized feed based on user interests and search capabilities
- **Intelligent Chat Interface**: Ask questions about papers using RAG with FAISS vector search
- **Real-time Paper Indexing**: Background indexing with status tracking and caching
- **Clean, Responsive UI**: Modern design with pagination, multi-select interests, and smooth animations
- **Secure Authentication**: JWT-based auth with HTTP-only cookies
- **Multi-interest Profiles**: Tag-based user interests for better recommendations

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

## Architecture

### Backend (FastAPI)
- RESTful API with FastAPI
- PostgreSQL database with SQLAlchemy ORM
- RAG pipeline: PyMuPDF → LangChain → FAISS → Ollama/OpenAI
- Background indexing with status tracking
- LRU cache for vector stores (in-memory, size: 4)
- Per-paper index persistence with SHA-256 URL hashing

### Frontend (React + Vite)
- Modern React with hooks
- Vite for fast development and builds
- Responsive design with CSS Grid/Flexbox
- Real-time status polling for index builds
- Multi-select interest tags with chip UI

## Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: 18 or higher with npm
- **PostgreSQL**: Latest stable version
- **Ollama** (optional): For local LLM inference
- **Git**: For version control

## Installation

### 1. Clone the Repository

```powershell
git clone https://github.com/adithya-jayasundar/Mini-Project.git
cd Mini-Project
```

### 2. Backend Setup

#### Create Virtual Environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
```

#### Install Dependencies

```powershell
pip install -r requirements.txt
```

#### Additional Dependencies (if needed)

```powershell
pip install faiss-cpu pymupdf langchain langchain-ollama
```

### 3. Frontend Setup

```powershell
cd ..\frontend
npm install
```

## Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/research_papers

# JWT Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=43200

# LLM Configuration (choose one)
# Option 1: Ollama (local)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral

# Option 2: OpenAI
# OPENAI_API_KEY=your-openai-api-key

# CORS Origins (adjust for production)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173
```

### Frontend Configuration

The frontend API base URL is configured in `frontend/src/utils/api.js`. Update if needed:

```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';
```

### Database Setup

Create the PostgreSQL database:

```sql
CREATE DATABASE research_papers;
```

Tables will be created automatically on first run via SQLAlchemy.

## Running the Application

### Start Backend Server

```powershell
cd backend
.\venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000`

### Start Frontend Development Server

```powershell
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Documentation

### Authentication Endpoints

#### Register
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe",
  "affiliation": "University",
  "interests": ["Machine Learning", "AI"]
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

#### Get Profile
```http
GET /auth/profile
Cookie: access_token=<jwt_token>
```

#### Update Profile
```http
PUT /auth/profile
Cookie: access_token=<jwt_token>
Content-Type: application/json

{
  "name": "John Doe",
  "affiliation": "MIT",
  "interests": ["Deep Learning", "NLP"]
}
```

### Feed Endpoints

#### Get Personalized Feed
```http
GET /feed/?max_results=120
Cookie: access_token=<jwt_token>
```

#### Search Papers
```http
GET /feed/search?q=machine+learning&max_results=120
Cookie: access_token=<jwt_token>
```

### Chat/RAG Endpoints

#### Build Index (Background)
```http
POST /chat/index
Cookie: access_token=<jwt_token>
Content-Type: application/json

{
  "url": "https://arxiv.org/pdf/2301.12345",
  "chunk_size": 3000,
  "chunk_overlap": 300,
  "rebuild_index": false
}
```

Returns `202 Accepted` - index builds in background

#### Check Index Status
```http
GET /chat/index/status?url=https://arxiv.org/pdf/2301.12345
Cookie: access_token=<jwt_token>
```

Response:
```json
{
  "status": "ready|building|error|missing",
  "detail": "Status message",
  "index_path": "/path/to/index"
}
```

#### Query Paper (Fast)
```http
POST /chat/query
Cookie: access_token=<jwt_token>
Content-Type: application/json

{
  "url": "https://arxiv.org/pdf/2301.12345",
  "question": "What is the main contribution?",
  "k": 6
}
```

Response:
```json
{
  "answer": "The paper's main contribution is..."
}
```

## Project Structure

```
Mini-Project/
├── backend/
│   ├── app/
│   │   ├── auth/              # Authentication logic
│   │   │   ├── models.py
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── utils.py
│   │   ├── chat/              # RAG & chat logic
│   │   │   ├── embeddings.py
│   │   │   ├── llm_services.py
│   │   │   ├── rag_arxiv.py   # Core RAG pipeline
│   │   │   ├── routes.py      # Chat endpoints
│   │   │   └── vector_store.py
│   │   ├── feed/              # Paper feed & recommendations
│   │   │   ├── recommender.py
│   │   │   └── routes.py
│   │   ├── papers/            # Paper management
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── services.py
│   │   ├── utils/
│   │   │   ├── logger.py
│   │   │   └── pdf_parser.py
│   │   ├── config.py          # App configuration
│   │   ├── db.py              # Database setup
│   │   └── main.py            # FastAPI app entry
│   ├── .env                   # Environment variables
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWithPaper.jsx
│   │   │   ├── Feed.jsx
│   │   │   ├── LoginRegister.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── SettingsModal.jsx
│   │   ├── utils/
│   │   │   └── api.js         # API client
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Technologies Used

### Backend
- **FastAPI**: Modern, fast web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Relational database
- **PyMuPDF (fitz)**: PDF text extraction
- **LangChain**: LLM framework
- **FAISS**: Vector similarity search
- **Ollama/OpenAI**: LLM providers
- **JWT**: Authentication tokens
- **Pydantic**: Data validation

### Frontend
- **React 18**: UI library
- **Vite**: Build tool and dev server
- **CSS3**: Styling with CSS Grid/Flexbox
- **Fetch API**: HTTP client

## Security Considerations

- **JWT tokens** stored in HTTP-only cookies (prevents XSS)
- **CORS** configured for specific origins
- **Password hashing** with bcrypt
- **FAISS deserialization**: Only for trusted local indices
- **Environment variables**: Secrets stored in `.env` (not committed)

## Production Deployment Checklist

- [ ] Change `JWT_SECRET_KEY` to a strong random string
- [ ] Set `DATABASE_URL` to production database
- [ ] Update `ALLOWED_ORIGINS` for production domains
- [ ] Enable HTTPS/TLS
- [ ] Set up job queue (Redis + RQ/Celery) for indexing at scale
- [ ] Add rate limiting on API endpoints
- [ ] Implement index TTL cleanup
- [ ] Set up logging and monitoring
- [ ] Configure CDN for frontend assets
- [ ] Set up database backups
- [ ] Add user quotas for indexing

## Troubleshooting

### FAISS Import Error
```powershell
pip install faiss-cpu
```

### PyMuPDF Import Error
```powershell
pip install pymupdf
```

### CORS Errors
Ensure backend `main.py` includes frontend URL in CORS origins:
```python
allow_origins=["http://localhost:5173"]
```

### Long Indexing Times
First-time indexing downloads and processes PDFs. Subsequent queries use cached indices and are fast (< 1s).

### Database Connection Error
Verify PostgreSQL is running and `DATABASE_URL` is correct in `.env`.

## Performance Notes

- **Index Build**: 30-60 seconds for typical papers (one-time)
- **Query Latency**: < 1 second after index ready
- **LRU Cache**: Holds 4 most recent vector stores in memory
- **Pagination**: Frontend fetches 120 papers (10 pages × 12/page)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Authors

- **Adithya Jayasundar** - [GitHub](https://github.com/adithya-jayasundar)

## Acknowledgments

- arXiv for providing open access to research papers
- FastAPI and React communities for excellent documentation
- LangChain for LLM orchestration tools
- FAISS team for vector search capabilities

---

**Note**: This is an educational project. For production use, implement additional security measures, monitoring, and scalability improvements.
