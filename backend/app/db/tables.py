from sqlalchemy import String, Text, Integer, ForeignKey, UniqueConstraint
#pythonic ORM을 사용하여 CRUD 수행
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

EMBED_DIM = 1536  # text-embedding-3-small 차원

# Base 부모 클래스 선언
class Base(DeclarativeBase):
    pass

class LawDocument(Base):
    __tablename__ = 'law_documents'
    # Mapped: 속성임을 명시
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    source_pdf: Mapped[str] = mapped_column(String(500))
    articles: Mapped[list["LawArticle"]] = relationship(back_populates="doc", cascade="all, delete-orphan")

class LawArticle(Base):
    __tablename__ = "law_articles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # 외래키
    doc_id: Mapped[int] = mapped_column(ForeignKey("law_documents.id"))
    doc: Mapped["LawDocument"] = relationship(back_populates="articles")
    # "총칙"/"부칙" 등(필요시)
    section: Mapped[str | None] = mapped_column(String(50), nullable=True)  
    chapter_no: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chapter_title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    main_article_no: Mapped[int] = mapped_column(Integer)
    sub_article_no: Mapped[int] = mapped_column(Integer)
    article_title: Mapped[str | None] = mapped_column(String(255), nullable=True)

    text: Mapped[str] = mapped_column(Text)
    chunks: Mapped[list["LawChunk"]] = relationship(back_populates="article", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("doc_id", "main_article_no", "sub_article_no", name="uq_doc_article"),
    )

class LawChunk(Base):
    __tablename__ = "law_chunks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    article_id: Mapped[int] = mapped_column(ForeignKey("law_articles.id"))
    article: Mapped["LawArticle"] = relationship(back_populates="chunks")

    chunk_index: Mapped[int] = mapped_column(Integer)

    # RAG citation용: "제10조/①/2." 같은 경로
    clause_path: Mapped[str] = mapped_column(String(128))

    content: Mapped[str] = mapped_column(Text)
    token_count: Mapped[int] = mapped_column(Integer)

    embedding: Mapped[list[float] | None] = mapped_column(Vector(EMBED_DIM), nullable=True)

    __table_args__ = (
        UniqueConstraint("article_id", "chunk_index", name="uq_article_chunk"),
    )