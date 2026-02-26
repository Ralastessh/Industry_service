from fastapi import FastAPI, APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.rag.retrieve import search_chunks
from openai import OpenAI
import uvicorn
import os

DEFAULT_MODEL = os.getenv('OPENAI_CHAT_MODEL')
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

app = FastAPI(title="Safety Compliance AI - RAG API")
# URL 주소 끝에 /search가 되어야 함 => router 주소
router = APIRouter(prefix="/search", tags=["search"])
# 고정된 Top-K 값
TOP_K = 5

# 사용자의 질문
class Request(BaseModel):
    query: str = Field(..., min_length=1)
# LLM 답변 + 근거 목록
class Response(BaseModel):
    query: str
    answer: str
    citations: List[Dict[str, Any]]  # 근거 목록(Top-k)
    used_chunks: List[Dict[str, Any]]  # 실제 prompt에 넣은 chunk들 (디버깅/검증용)

def build_context(chunks):
    lines = []
    for i, c in enumerate(chunks):
        header = f"[Chunk{i + 1}] {c['doc_title']} / {c['chapter_no']}, {c['chapter_title']} / {c['clause_path']} (score={c['score']:.3f})"
        body = c["content"].strip()
        lines.append(header + "\n" + body)
    return "\n\n---\n\n".join(lines)

# search/answer/ 주소
# Request 형태로 답변을 받도록 설정(pydantic)
@router.post("/answer", response_model=Response)
# Request 형태로 입력을 받도록 설정(pydantic)
def answer(req: Request):
    # 1) 근거 검색
    chunks = search_chunks(req.query, top_k=TOP_K)

    # 근거가 아예 없으면: "모르겠다" 처리 (LLM 불필요)
    if not chunks:
        return Response(
            query=req.query,
            answer="제공된 법령 DB에서 관련 근거를 찾지 못했습니다. 다른 키워드로 다시 질문해 주세요.",
            citations=[],
            used_chunks=[],
        )

    # 2) 프롬프트 조립
    context = build_context(chunks)

    system = (
        "너는 산업안전보건/중대재해 관련 법령 준수 지원 AI다.\n"
        "아래 '근거(Context)'에 포함된 내용만 사용해서 답하라.\n"
        "근거에 없는 내용은 추측하지 말고 '근거 부족'이라고 말하라.\n"
        "답변에는 반드시 근거 조항을 [C0], [C1]처럼 인용 표시하라.\n"
        "형식:\n"
        "1) 결론(1~3문장)\n"
        "2) 근거 요약(불릿) - 각 불릿 끝에 [C?] 표시\n"
        "3) 실무 적용 체크리스트(불릿) - 각 항목 끝에 [C?] 표시\n"
    )

    user = (
        f"질문: {req.query}\n\n"
        f"Context(근거):\n{context}\n\n"
        "위 근거만으로 답변 작성."
    )

    # 3) LLM 호출 (Responses API)
    resp = client.responses.create(
        model=DEFAULT_MODEL,
        input=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )

    # 4) citations 반환 (프론트에서 Top-5 리스트로 보여줄 용도)
    citations = []
    for i, c in enumerate(chunks, start=1):
        citations.append({
            "cid": f"C{i}",
            "doc_id": c["doc_id"],
            "doc_title": c["doc_title"],
            "chapter_no": c["chapter_no"],
            "chapter_title": c["chapter_title"],
            "clause_path": c["clause_path"],
            "score": c["score"],
            "token_count": c["token_count"],
        })

    return Response(
        query=req.query,
        answer=resp.output_text.strip(),
        citations=citations,
        used_chunks=chunks,  # content까지 포함(원문 펼치기용)
    )

app.include_router(router)

if __name__ == "__main__":
    uvicorn.run("app.rag.generate:app", host='127.0.0.1', port=8001)