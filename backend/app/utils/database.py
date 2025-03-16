import os
import chromadb
import motor.motor_asyncio
from typing import Dict, Any
import logging
from chromadb.config import Settings

logger = logging.getLogger(__name__)

# Constants for database paths and configuration
DB_DIR = os.path.join(os.path.expanduser("~"), ".local-image-finder")
CHROMA_DIR = os.path.join(DB_DIR, "chromadb")
MONGO_CONNECTION_STRING = "mongodb://localhost:27017"
DB_NAME = "local_image_finder"

# Ensure directories exist
os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)

# Initialize clients lazily
_chroma_client = None
_mongo_client = None
_db = None

# Initialize collections lazily
_collections = {}

def get_chroma_client():
    """Get or create ChromaDB client"""
    global _chroma_client
    if _chroma_client is None:
        try:
            _chroma_client = chromadb.PersistentClient(
                path=CHROMA_DIR,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            logger.info("ChromaDB client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB client: {str(e)}")
            raise
    return _chroma_client

async def get_chroma_collection(collection_name: str):
    """Get or create a ChromaDB collection"""
    client = get_chroma_client()
    
    try:
        # Try to get existing collection
        return client.get_collection(name=collection_name)
    except Exception:
        # Create if it doesn't exist
        return client.create_collection(name=collection_name)

async def reset_chroma_collection(collection_name: str):
    """Reset a ChromaDB collection"""
    client = get_chroma_client()
    try:
        client.delete_collection(name=collection_name)
        logger.info(f"Deleted ChromaDB collection: {collection_name}")
    except Exception as e:
        logger.warning(f"Error deleting collection {collection_name}: {str(e)}")
    
    return client.create_collection(name=collection_name)

def get_mongo_client():
    """Get or create MongoDB client"""
    global _mongo_client
    if _mongo_client is None:
        try:
            _mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_CONNECTION_STRING)
            logger.info("MongoDB client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB client: {str(e)}")
            raise
    return _mongo_client

def get_database():
    """Get or create database"""
    global _db
    if _db is None:
        client = get_mongo_client()
        _db = client[DB_NAME]
        logger.info(f"Connected to database: {DB_NAME}")
    return _db

async def get_profile_collection():
    """Get or create profiles collection"""
    global _collections
    if "profiles" not in _collections:
        db = get_database()
        _collections["profiles"] = db.profiles
    return _collections["profiles"]

async def get_settings_collection():
    """Get or create settings collection"""
    global _collections
    if "settings" not in _collections:
        db = get_database()
        _collections["settings"] = db.settings
    return _collections["settings"]

async def get_sessions_collection():
    """Get or create sessions collection"""
    global _collections
    if "sessions" not in _collections:
        db = get_database()
        _collections["sessions"] = db.sessions
    return _collections["sessions"]

async def get_albums_collection():
    """Get or create albums collection"""
    global _collections
    if "albums" not in _collections:
        db = get_database()
        _collections["albums"] = db.albums
    return _collections["albums"]

async def initialize_database():
    """Initialize all database connections and create indexes"""
    # Initialize collections
    profiles_collection = await get_profile_collection()
    settings_collection = await get_settings_collection()
    sessions_collection = await get_sessions_collection()
    albums_collection = await get_albums_collection()
    
    # Create indexes
    try:
        await profiles_collection.create_index("id", unique=True)
        await profiles_collection.create_index("is_default")
        
        await settings_collection.create_index("profile_id", unique=True)
        
        await sessions_collection.create_index("profile_id")
        await sessions_collection.create_index("id")
        await sessions_collection.create_index([("profile_id", 1), ("id", 1)], unique=True)
        await sessions_collection.create_index("updated_at")
        
        await albums_collection.create_index("profile_id")
        await albums_collection.create_index("id")
        await albums_collection.create_index([("profile_id", 1), ("id", 1)], unique=True)
        await albums_collection.create_index("type")
        await albums_collection.create_index("updated_at")
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Error creating database indexes: {str(e)}")

    # Initialize ChromaDB collections
    try:
        await get_chroma_collection("images")
        logger.info("ChromaDB collections initialized")
    except Exception as e:
        logger.error(f"Error initializing ChromaDB collections: {str(e)}")
