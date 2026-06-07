import os
from dotenv import load_dotenv

load_dotenv()

_chroma_client = None

def get_chromadb_client():
    global _chroma_client
    if _chroma_client is None:
        import chromadb
        _chroma_client = chromadb.PersistentClient(
            path=os.getenv("CHROMA_PERSIST_PATH", "./chroma_store")
        )
    return _chroma_client

def get_cv_collection(user_id: str):
    client = get_chromadb_client()
    return client.get_or_create_collection(
        name=f"cv_{user_id}",
        metadata={"hnsw:space": "cosine"}
    )