import os
import shutil
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.database.models import Document
from app.schemas.document import DocumentResponse

from app.document_processing.pdf_processor import extract_text_from_pdf
from app.document_processing.text_chunker import chunk_pages

from app.vector_store.chroma_db import (
    store_chunks,
    delete_document_chunks,
    reprocess_document_chunks,
)

from app.vector_store.search import search_chunks
from app.rag.openai_client import generate_answer

router = APIRouter()


# ==========================================
# Upload Document
# ==========================================
@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):

    upload_directory = "data/uploads"
    os.makedirs(upload_directory, exist_ok=True)

    file_path = os.path.join(upload_directory, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text
    full_text, total_pages, pages = extract_text_from_pdf(file_path)

    # Chunk pages
    chunks = chunk_pages(pages)

    db: Session = SessionLocal()

    document = Document(
        filename=file.filename,
        status="PROCESSING",
        total_pages=total_pages,
        total_chunks=len(chunks),
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # Store embeddings
    store_chunks(
        document.id,
        document.filename,
        chunks
    )

    document.status = "PROCESSED"

    db.commit()
    db.refresh(document)

    db.close()

    return {
        "id": document.id,
        "filename": document.filename,
        "upload_time": document.upload_time,
        "total_pages": document.total_pages,
        "total_chunks": document.total_chunks,
        "status": document.status,
        "message": "Document processed successfully."
    }


# ==========================================
# List Documents
# ==========================================
@router.get("/documents", response_model=List[DocumentResponse])
def get_documents():

    db: Session = SessionLocal()

    documents = db.query(Document).all()

    db.close()

    return documents


# ==========================================
# Delete Document
# ==========================================
@router.delete("/documents/{document_id}")
def delete_document(document_id: int):

    db: Session = SessionLocal()

    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if document is None:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    file_path = os.path.join(
        "data/uploads",
        document.filename
    )

    if os.path.exists(file_path):
        os.remove(file_path)

    delete_document_chunks(document_id)

    db.delete(document)
    db.commit()

    db.close()

    return {
        "message": "Document deleted successfully.",
        "document_id": document_id
    }


# ==========================================
# Reprocess Document
# ==========================================
@router.post("/documents/{document_id}/reprocess")
def reprocess_document(document_id: int):

    db: Session = SessionLocal()

    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if document is None:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    file_path = os.path.join(
        "data/uploads",
        document.filename
    )

    if not os.path.exists(file_path):
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Uploaded PDF not found."
        )

    document.status = "PROCESSING"
    db.commit()

    # Extract again
    full_text, total_pages, pages = extract_text_from_pdf(file_path)

    # Chunk pages
    chunks = chunk_pages(pages)

    # Replace embeddings
    reprocess_document_chunks(
        document.id,
        document.filename,
        chunks
    )

    document.total_pages = total_pages
    document.total_chunks = len(chunks)
    document.status = "PROCESSED"

    db.commit()
    db.refresh(document)

    db.close()

    return {
        "message": "Document reprocessed successfully.",
        "document_id": document.id,
        "filename": document.filename,
        "total_pages": document.total_pages,
        "total_chunks": document.total_chunks,
        "status": document.status
    }


# ==========================================
# Semantic Search
# ==========================================
@router.get("/search")
def search(query: str):

    results = search_chunks(query)

    return {
        "query": query,
        "results": results
    }


# ==========================================
# Ask Questions (RAG)
# ==========================================
@router.get("/ask")
def ask_question(question: str):

    chunks = search_chunks(question)

    if not chunks:
        return {
            "question": question,
            "answer": "No relevant information found in the uploaded documents.",
            "context": []
        }

    context = "\n\n".join(
        chunk["text"] for chunk in chunks
    )

    answer = generate_answer(question, context)

    return {
        "question": question,
        "answer": answer,
        "context": chunks
    }