# app/main.py
from fastapi import FastAPI
from app.auth import routes as auth_routes
from app.feed import routes as feed_routes

app = FastAPI()

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(feed_routes.router)

@app.get("/")
def root():
    return {"message": "API is running!"}
