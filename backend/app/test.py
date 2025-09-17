# app/test_db.py
from app.db import engine

try:
    conn = engine.connect()
    print("PostgreSQL connected successfully!")
    conn.close()
except Exception as e:
    print("Error connecting to DB:", e)
