from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Determine the project root (where reviverpet.db should live)
# This finds the parent directory of the 'backend' folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.getenv("DATA_DIR", BASE_DIR)
db_path = os.path.join(DATA_DIR, "reviverpet.db")

# Database URL for SQLite (Portable)
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

# Create engine (check_same_thread=False is needed for SQLite)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
