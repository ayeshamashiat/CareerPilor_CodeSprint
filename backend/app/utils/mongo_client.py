from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
db = client["careerpilot"]

users_collection = db["users"]
cv_metadata_collection = db["cv_metadata"]
sessions_collection = db["sessions"]
tailored_cvs_collection = db["tailored_cvs"]