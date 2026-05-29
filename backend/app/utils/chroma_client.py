import chromadb
from dotenv import load_dotenv
import os

load_dotenv()

chroma_client = chromadb.PersistentClient(
    path=os.getenv("CHROMA_PERSIST_PATH", "./chroma_store")
)

def get_cv_collection(user_id: str):
    return chroma_client.get_or_create_collection(
        name=f"cv_{user_id}",
        metadata={"hnsw:space": "cosine"}
    )