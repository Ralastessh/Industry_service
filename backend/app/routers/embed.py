import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings

def get_embedder() -> GoogleGenerativeAIEmbeddings:
    model = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")
    api_key = os.getenv("GEMINI_API_KEY")
    # Gemini는 GOOGLE_API_KEY를 환경변수로 읽음
    return GoogleGenerativeAIEmbeddings(model=model, google_api_key=api_key)