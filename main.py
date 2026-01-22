
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import backend.app.db.models as models, backend.app.db.init_db as init_db, backend.app.services.rag_service as rag_service
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="ISO 45001 Compliance AI Backend")

# CORS 설정: 프론트엔드와 통신 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 초기화 (실제 운영 시에는 Alembic 권장)
models.Base.metadata.create_all(bind=init_db.engine)

class ScenarioRequest(BaseModel):
    work_type: str
    workforce: str
    equipment: str
    environment: str
    optional_text: Optional[str] = None

class DocumentIngest(BaseModel):
    doc_title: str
    clause_path: str
    text_content: str
    source_url: Optional[str] = None

@app.post("/scenario/analyze")
async def analyze_scenario(request: ScenarioRequest, db: Session = Depends(init_db.get_db)):
    """
    RAG 파이프라인을 가동하여 시나리오 분석 및 체크리스트 생성
    """
    try:
        result = await rag_service.process_analysis(db, request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/ingest")
async def ingest_legal_document(doc: DocumentIngest, db: Session = Depends(init_db.get_db)):
    """
    법률 데이터를 벡터화하여 pgvector에 저장
    """
    return await rag_service.ingest_document(db, doc)

@app.get("/health")
def health_check():
    return {"status": "healthy"}
