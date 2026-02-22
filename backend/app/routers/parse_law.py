import re
from typing import List, Dict

# '장'을 구분
CHAPTER_RE = re.compile(r"(?m)^\s*(제(\d+)장)\s*([^\n]*)")
# '조(의)'를 구분
ARTICLE_RE = re.compile(
    r"(?m)^(제(\d+)조(?:의(\d+))?)(?!\s*제)(\([^)]+\))?")

# pdf의 메타 데이터를 일정한 규칙으로 정리
def normalize(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()

def split_to_articles(full_text):
    full_text = normalize(full_text)
    # 장 탐색
    chapters = []
    for m in CHAPTER_RE.finditer(full_text):
        chapters.append({
            # 절대적 인덱스 위치
            "start": m.start(),
            "end": m.end(),
            "chapter_no": int(m.group(2)),
            "chapter_title": (m.group(3) or "").strip() or None,
        })

    if not chapters:
        chapters = [{
            "start": 0, "end": 0,
            "chapter_no": None, "chapter_title": None,
        }]

    results = []

    for i, ch in enumerate(chapters):
        seg_start = ch["end"]
        seg_end = chapters[i+1]["start"] if i+1 < len(chapters) else len(full_text)
        seg = full_text[seg_start:seg_end].strip()
        if not seg:
            continue
        # 장 아래의 조 탐색
        matches = list(ARTICLE_RE.finditer(seg))
        for j, am in enumerate(matches):
            a_start = am.start()
            a_end = matches[j+1].start() if j+1 < len(matches) else len(seg)

            main_article_no = int(am.group(2))
            sub_article_no = int(am.group(3)) if am.group(3) else 0
            article_title = (am.group(4) or "").strip()
            article_block = seg[a_start:a_end].strip()
            if article_title:
                results.append({
                    "chapter_no": ch["chapter_no"],
                    "chapter_title": ch["chapter_title"],
                    "main_article_no": main_article_no,
                    'sub_article_no': sub_article_no,
                    "article_title": article_title.strip("()") if article_title else None,
                    "text": article_block,
                })

    return results