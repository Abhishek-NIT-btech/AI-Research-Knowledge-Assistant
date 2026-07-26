from sentence_transformers import SentenceTransformer
from app.vector_store.chroma_db import collection

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def search_chunks(query: str, top_k: int = 3):
    """
    Search similar chunks and return
    text + metadata.
    """

    query_embedding = embedding_model.encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )

    documents = results.get("documents", [])
    metadatas = results.get("metadatas", [])

    if not documents or len(documents) == 0:
        return []

    response = []

    for doc, metadata in zip(documents[0], metadatas[0]):

        response.append(
            {
                "text": doc,
                "filename": metadata.get("filename"),
                "page": metadata.get("page"),
                "document_id": metadata.get("document_id"),
                "chunk_index": metadata.get("chunk_index")
            }
        )

    return response