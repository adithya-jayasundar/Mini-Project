from fastapi import FastAPI
from app.db import Base, engine
from app.auth import routes as auth_routes
from app.papers import routes as paper_routes

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Register routers
app.include_router(auth_routes.router)
app.include_router(paper_routes.router)
