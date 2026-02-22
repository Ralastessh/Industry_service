from app.rag.retrieve import search_chunks

results = search_chunks("안전보건관리책임자의 역할은?")
for r in results:
    print(f"경로: {r['clause_path']},\n 내용: {r['content']},\n 토큰 수: {r['token_count']},\n 점수: {r['score']}")
    print("-" * 50)
    print()