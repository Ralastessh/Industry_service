from fastapi import APIRouter
from pydantic import BaseModel
from app.rag.retrieve import search_chunks
import uvicorn


router = APIRouter(prefix="/search", tags=["search"])

class SearchRequest(BaseModel):
    query: str
    k: int = 5

@router.post('/')
# SearchRequest 형태로 입력을 받도록 설정(pydantic)
def search(req: SearchRequest):
    results = search_chunks(req.query, top_k=req.k)
    return {"query": req.query, "count": len(results), "results": results}