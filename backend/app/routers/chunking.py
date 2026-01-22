import os
import re
import tiktoken
from typing import List, Tuple
from langchain_text_splitters import TokenTextSplitter

CIRCLE_NUMS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"
CIRCLE_RE = re.compile(f"[{CIRCLE_NUMS}]")
HO_RE = re.compile(r"\n\s*(\d+)\.\s")  # "1. " 형태

def get_encoding():
    enc_name = os.getenv("TOKEN_ENCODING", "o200k_base")
    try:
        return tiktoken.get_encoding(enc_name)
    except Exception:
        return tiktoken.get_encoding("cl100k_base")

def count_tokens(text: str) -> int:
    enc = get_encoding()
    return len(enc.encode(text))

def guess_clause_path(chunk_text: str, article_no: int) -> str:
    # 최소한 "제n조"는 고정, chunk 내부에서 ①/1. 힌트가 있으면 붙임
    path = [f"제{article_no}조"]

    m = CIRCLE_RE.search(chunk_text)
    if m:
        path.append(m.group(0))

    m2 = HO_RE.search(chunk_text)
    if m2:
        path.append(f"{m2.group(1)}.")

    return "/".join(path)

def chunk_article(article_text: str, article_no: int) -> List[Tuple[str, str, int]]:
    chunk_tokens = int(os.getenv("CHUNK_TOKENS", "1200"))
    overlap_ratio = float(os.getenv("CHUNK_OVERLAP_RATIO", "0.27"))
    overlap_tokens = max(1, int(chunk_tokens * overlap_ratio))

    splitter = TokenTextSplitter(
        encoding_name=os.getenv("TOKEN_ENCODING", "o200k_base"),
        chunk_size=chunk_tokens,
        chunk_overlap=overlap_tokens,
    )

    chunks = [c.strip() for c in splitter.split_text(article_text) if c.strip()]

    out: List[Tuple[str, str, int]] = []
    for c in chunks:
        out.append((c, guess_clause_path(c, article_no), count_tokens(c)))
    return out