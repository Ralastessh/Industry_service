from fastapi import FastAPI
from .db.init_db import init_db

app = FastAPI(title="Safety Compliance AI")

@app.on_event("startup")
def startup():
    init_db()

@app.get("/health")
def health():
    return {"ok": True}