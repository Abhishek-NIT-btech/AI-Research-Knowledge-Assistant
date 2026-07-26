from fastapi import FastAPI
from app.config import settings

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for document processing, semantic search, RAG, and document classification.",
    version=settings.VERSION
)


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