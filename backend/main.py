from fastapi import FastAPI
from app.routers.search import router
import uvicorn

app = FastAPI(title="Safety Compliance AI")
# FastAPI 인스턴스에 router 붙이기
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run("main:app", host='127.0.0.1', port=8000, reload=True)