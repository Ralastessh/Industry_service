import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv, find_dotenv

# 운영체제의 환경변수가 아닌 .env 내의 환경변수 로드(.env를 사용하려면 필수)
_env_path = find_dotenv(filename=".env", usecwd=True)
if _env_path:
    load_dotenv(_env_path)
# 환경변수 값 가져오기
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Create a .env file at the repo root (or export DATABASE_URL) "
        "before running ingest."
    )
# Engine: DB에서 SQL의 실행을 도움 + 세션 관리
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)