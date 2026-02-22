import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings

def get_embedder():
    load_dotenv()
    model = os.getenv("OPENAI_EMBEDDING", "text-embedding-3-small")
    api_key = os.getenv("OPENAI_API_KEY")
    # client 생성 후 embedding 가능하게 만들어주는 wrapper 클래 -> Langchain vectorstore 형식에 맞는 list 반환
    return OpenAIEmbeddings(model=model, api_key=api_key)