from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- Database URL ---
# For local dev, use SQLite. For prod, replace with PostgreSQL URL
# Example Postgres: "postgresql://user:password@localhost:5432/mydb"
DATABASE_URL = "sqlite:///./app.db"

# --- SQLAlchemy engine ---
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# --- SessionLocal ---
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Base class for models ---
Base = declarative_base()

# --- Dependency for FastAPI ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
