import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv, find_dotenv

# Load env vars from the nearest .env (searches upward from CWD)
# This is important because scripts may `cd backend` before running.
_env_path = find_dotenv(filename=".env", usecwd=True)
if _env_path:
    load_dotenv(_env_path)

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Create a .env file at the repo root (or export DATABASE_URL) "
        "before running ingest."
    )

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)