import os
import re
import tiktoken
from typing import List, Tuple
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 문서 형식: 장 -> 조 -> (①) -> (1.)
CIRCLE_NUMS = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳"
# 장 밑의 하위 항목인 동그라미 탐색
CIRCLE_RE = re.compile(f"[{CIRCLE_NUMS}]")
# 장 밑의 하위 항목인 '1. ' 탐색
HO_RE = re.compile(r"\n\s*(\d+)\.\s") 

def get_encoding():
    try:
        return tiktoken.encoding_for_model("gpt-4o-mini")
    except Exception:
        return tiktoken.get_encoding("o200k_base")

def count_tokens(text):
    enc = get_encoding()
    return len(enc.encode(text))

def guess_clause_path(chunk_text, main_article_no, sub_article_no):
    # chunk_text: article(조)
    path = [f"제{main_article_no}조의{sub_article_no}"] if sub_article_no else [f"제{main_article_no}조"]
    m = CIRCLE_RE.search(chunk_text)
    if m:
        path.append(m.group(0))
    m2 = HO_RE.search(chunk_text)
    if m2:
        path.append(f"{m2.group(1)}.")
    # RAG 시 참고할 수 있는 path 지정
    return "/".join(path)

def chunk_article(article_text, main_article_no, sub_article_no):
    # 법률 관련 문서는 아래 기준으로 chunking을 수행하는 것이 적합하다고 알려져 있음
    chunk_tokens = int(os.getenv("CHUNK_TOKENS", "2400"))
    overlap_ratio = float(os.getenv("CHUNK_OVERLAP_RATIO", "0.27"))
    overlap_tokens = max(1, int(chunk_tokens * overlap_ratio))
    # token 수를 자동으로 측정하면서 문자 기반으로 분할함
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        encoding_name='o200k_base',
        chunk_size=chunk_tokens,
        chunk_overlap=overlap_tokens,
    )
    chunks = [c.strip() for c in splitter.split_text(article_text) if c.strip()]
    out = []
    for c in chunks:
        out.append((c, guess_clause_path(c, main_article_no, sub_article_no), count_tokens(c)))
    return out