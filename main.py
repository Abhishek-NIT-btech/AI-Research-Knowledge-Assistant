from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

from app.database.database import Base, engine
from app.database import models

from app.api.documents import router as document_router

# Create all database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for document processing, semantic search, RAG, and document classification.",
    version=settings.VERSION
)

# Allow React frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(document_router)


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy",
        "server": "Running"
    }