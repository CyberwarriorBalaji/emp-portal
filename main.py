from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from database import connect_db, disconnect_db
from routes import auth, users
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    # Ensure upload dirs exist
    for sub in ("profiles", "certificates"):
        os.makedirs(f"uploads/{sub}", exist_ok=True)
    yield
    await disconnect_db()


app = FastAPI(
    title="EmpPortal API",
    description="Employee Management Portal — FastAPI + MongoDB",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (uploaded media) ─────────────────────────────────────────────
os.makedirs("uploads/profiles", exist_ok=True)
os.makedirs("uploads/certificates", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "EmpPortal API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
