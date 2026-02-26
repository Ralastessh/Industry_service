# backend/app/routers/answer.py
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os

from app.rag.retrieve import search_chunks

# OpenAI Responses API (최신 SDK)
from openai import OpenAI

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DEFAULT_TOP_K = 5
DEFAULT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4.1-mini")  # 너 원하는 걸로 바꿔

class AnswerRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(DEFAULT_TOP_K, ge=1, le=20)
    doc_id: Optional[int] = None

class AnswerResponse(BaseModel):
    query: str
    answer: str
    citations: List[Dict[str, Any]]  # 근거 목록(Top-k)
    used_chunks: List[Dict[str, Any]]  # 실제 prompt에 넣은 chunk들 (디버깅/검증용)

def build_context(chunks: List[Dict[str, Any]]) -> str:
    """
    LLM에 넣을 '근거 묶음'을 깔끔한 포맷으로 만든다.
    """
    lines = []
    for i, c in enumerate(chunks, start=1):
        header = f"[C{i}] {c['doc_title']} / {c['chapter_title']} / {c['clause_path']} (score={c['score']:.3f})"
        body = c["content"].strip()
        lines.append(header + "\n" + body)
    return "\n\n---\n\n".join(lines)

@router.post("/answer", response_model=AnswerResponse)
def answer(req: AnswerRequest):
    # 1) 근거 검색
    chunks = search_chunks(req.query, top_k=req.top_k, doc_id=req.doc_id)

    # 근거가 아예 없으면: "모르겠다" 처리 (LLM 불필요)
    if not chunks:
        return AnswerResponse(
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
        "답변에는 반드시 근거 조항을 [C1], [C2]처럼 인용 표시하라.\n"
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

    # SDK 버전에 따라 output_text 접근이 다를 수 있어서 안전하게:
    answer_text = getattr(resp, "output_text", None)
    if not answer_text:
        # fallback: output 배열에서 텍스트 합치기
        try:
            answer_text = "".join(
                chunk.get("text", "")
                for item in resp.output
                for chunk in getattr(item, "content", [])
                if isinstance(chunk, dict)
            )
        except Exception:
            answer_text = str(resp)

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

    return AnswerResponse(
        query=req.query,
        answer=answer_text.strip(),
        citations=citations,
        used_chunks=chunks,  # content까지 포함(원문 펼치기용)
    )