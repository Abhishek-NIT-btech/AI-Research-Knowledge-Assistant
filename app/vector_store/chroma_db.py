import chromadb
from sentence_transformers import SentenceTransformer

# Load embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Persistent ChromaDB client
client = chromadb.PersistentClient(path="data/vector_db")

# Collection
collection = client.get_or_create_collection(
    name="research_documents"
)


def store_chunks(document_id: int, filename: str, chunks: list):
    """
    Store chunks with page number and filename metadata.
    """

    for index, chunk in enumerate(chunks):

        embedding = embedding_model.encode(chunk["text"]).tolist()

        collection.add(
            ids=[f"{document_id}_{index}"],
            embeddings=[embedding],
            documents=[chunk["text"]],
            metadatas=[
                {
                    "document_id": document_id,
                    "filename": filename,
                    "page": chunk["page"],
                    "chunk_index": index
                }
            ]
        )


def delete_document_chunks(document_id: int):
    """
    Delete all chunks belonging to a document.
    """

    collection.delete(
        where={
            "document_id": document_id
        }
    )


def reprocess_document_chunks(
    document_id: int,
    filename: str,
    chunks: list
):
    """
    Replace old embeddings with newly processed chunks.
    """

    delete_document_chunks(document_id)

    store_chunks(
        document_id,
        filename,
        chunks
    )