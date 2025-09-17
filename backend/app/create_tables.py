from app.db import Base, engine
from app.auth import models  # Import User model

# Create tables in the database
Base.metadata.create_all(bind=engine)

print("Users table created successfully!")
