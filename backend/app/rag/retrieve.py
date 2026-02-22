from sqlalchemy import select
from app.db.session import SessionLocal
from app.db.tables import LawChunk, LawArticle, LawDocument
from app.routers.embedder import get_embedder

# Top-5 결과 반환
def search_chunks(query, top_k=5, doc_id=None):
    # 사용자 쿼리를 벡터화
    query_vec = get_embedder().embed_query(query)
    with SessionLocal() as db:
        statement = (
            select(
                LawChunk,
                LawArticle,
                LawDocument,
                # 코사인 유사도 측정
                LawChunk.embedding.cosine_distance(query_vec).label("distance"),
            )
            .join(LawArticle, LawChunk.article_id == LawArticle.id)
            .join(LawDocument, LawArticle.doc_id == LawDocument.id)
            .where(LawChunk.embedding.isnot(None))
        )
        statement = statement.order_by('distance').limit(top_k)
        # db.add, flush: 저장, db.execute: 조회
        rows = db.execute(statement).all()

    results = []

    for chunk, article, doc, distance in rows:
        results.append(
            {
                "doc_id": doc.id,
                "doc_title": doc.title,
                'chapter_no': article.chapter_no,
                "chapter_title": article.chapter_title,
                "clause_path": chunk.clause_path,
                "content": chunk.content,
                "token_count": chunk.token_count,
                "score": float(1 - distance),  # cosine distance → similarity 변환
            }
        )

    return results