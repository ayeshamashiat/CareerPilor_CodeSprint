import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import os

load_dotenv()

_configured = False

def init_cloudinary():
    global _configured
    if not _configured:
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET")
        )
        _configured = True


def upload_cv(file_bytes: bytes, filename: str, user_id: str) -> str:
    init_cloudinary()
    result = cloudinary.uploader.upload(
        file_bytes,
        resource_type="raw",
        public_id=f"cvs/{user_id}/{filename}",
        overwrite=True
    )
    return result["secure_url"]