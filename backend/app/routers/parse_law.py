import re
from typing import List, Dict

CHAPTER_RE = re.compile(r"(제\s*(\d+)\s*장)\s*([^\n]*)")
ARTICLE_RE = re.compile(r"(제\s*(\d+)\s*조)\s*(\([^)]+\))?")

def normalize(text: str) -> str:
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def split_to_articles(full_text: str) -> List[Dict]:
    full_text = normalize(full_text)

    chapters = []
    for m in CHAPTER_RE.finditer(full_text):
        chapters.append({
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

    results: List[Dict] = []

    for i, ch in enumerate(chapters):
        seg_start = ch["end"]
        seg_end = chapters[i+1]["start"] if i+1 < len(chapters) else len(full_text)
        seg = full_text[seg_start:seg_end].strip()
        if not seg:
            continue

        matches = list(ARTICLE_RE.finditer(seg))
        for j, am in enumerate(matches):
            a_start = am.start()
            a_end = matches[j+1].start() if j+1 < len(matches) else len(seg)

            article_no = int(am.group(2))
            article_title = (am.group(3) or "").strip()
            article_block = seg[a_start:a_end].strip()

            results.append({
                "chapter_no": ch["chapter_no"],
                "chapter_title": ch["chapter_title"],
                "article_no": article_no,
                "article_title": article_title.strip("()") if article_title else None,
                "text": article_block,
            })

    return results