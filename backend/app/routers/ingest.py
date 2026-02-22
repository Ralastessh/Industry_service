import os
from ..db.session import SessionLocal
from ..db.tables import LawDocument, LawArticle, LawChunk
from ..db.init_db import init_db
from .loaders import load_pdf_text
from .parse_law import normalize, split_to_articles
from .chunking import chunk_article
from .embedder import get_embedder

def ingest_pdf(pdf_path: str, title: str):
    init_db()

    raw = load_pdf_text(pdf_path)
    full_text = normalize(raw)
    articles = split_to_articles(full_text)

    # 디버깅
    from collections import Counter
    cnt = Counter([(a["main_article_no"], a["sub_article_no"]) for a in articles])
    dups = [(k, v) for k,v in cnt.items() if v > 1]
    print("DUP ARTICLE_NOS:", dups[:20])
    print("count(2, 0) =", cnt.get((2, 0)))

    embedder = get_embedder()

    with SessionLocal() as db:
        doc = LawDocument(title=title, source_pdf=os.path.basename(pdf_path))
        # add: 변경사항 가져오기
        db.add(doc)
        # DB에 SQL 수행(롤백 가능) != db.commit()
        # flush를 하면 PK인 LawDocument id 속성이 자동으로 채워짐(doc.id)
        db.flush()

        for a in articles:
            art = LawArticle(
                # doc.id는 위에서 LawDocument와 LawArticle에 모두 존재 => FK
                doc_id=doc.id,
                section=None,  # 필요하면 "총칙/부칙" 파싱 로직 추가
                chapter_no=a["chapter_no"],
                chapter_title=a["chapter_title"],
                main_article_no=a["main_article_no"],
                sub_article_no=a["sub_article_no"],
                article_title=a["article_title"],
                text=a["text"],
            )
            db.add(art)
            # flush를 하면 PK인 LawArticle id 속성이 자동으로 채워짐(art.id)
            db.flush()

            chunk_tuples = chunk_article(art.text, art.main_article_no, art.sub_article_no)
            chunk_texts = [ct[0] for ct in chunk_tuples]
            vectors = embedder.embed_documents(chunk_texts)

            for idx, ((chunk_text, clause_path, tok_cnt), vec) in enumerate(zip(chunk_tuples, vectors)):
                db.add(LawChunk(
                    # art.id는 위에서 LawArticle과 LawChunk 모두 존재 => FK
                    article_id=art.id,
                    chunk_index=idx,
                    clause_path=clause_path,
                    content=chunk_text,
                    token_count=tok_cnt,
                    embedding=vec,
                ))

        db.commit()

if __name__ == "__main__":
    ingest_pdf("../data/laws/산업안전보건법.pdf", "산업안전보건법")