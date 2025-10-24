# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import routes as auth_routes
from app.feed import routes as feed_routes
from app.chat import routes as chat_routes

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(feed_routes.router)
app.include_router(chat_routes.router, prefix="/chat", tags=["Chat"])

@app.get("/")
def root():
    return {"message": "API is running!"}
