# filepath: c:\Users\presyze\ASU\Apps\Local-Image-Finder\backend\app\utils\database.py
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Import the ChromaDB client singleton and wrapper classes
from app.database.chroma_client import (
    get_chroma_client, ChromaCollectionWrapper, 
    serialize_datetime, deserialize_datetime,
    DB_DIR, CHROMA_DIR
)

# Dictionary to cache collection instances
_collections = {}

async def get_chroma_collection(collection_name: str):
    """Get or create a ChromaDB collection"""
    if collection_name in _collections:
        return _collections[collection_name]
    
    try:
        client = get_chroma_client()
        collection = client.get_or_create_collection(collection_name)
        _collections[collection_name] = collection
        return collection
    except Exception as e:
        logger.error(f"Error getting collection {collection_name}: {str(e)}")
        raise

async def reset_chroma_collection(collection_name: str):
    """Reset a ChromaDB collection"""
    client = get_chroma_client()
    try:
        client.delete_collection(collection_name)
        logger.info(f"Deleted ChromaDB collection: {collection_name}")
    except Exception as e:
        logger.warning(f"Error deleting collection {collection_name}: {str(e)}")
    
    # Remove from cache if present
    if collection_name in _collections:
        del _collections[collection_name]
    
    # Create new collection
    collection = client.get_or_create_collection(collection_name)
    _collections[collection_name] = collection
    return collection

async def get_profile_collection():
    """Get or create profiles collection in ChromaDB"""
    return await get_chroma_collection("profiles")

async def get_settings_collection(profile_id: str = None):
    """Get or create settings collection in ChromaDB"""
    if profile_id:
        return await get_chroma_collection(f"{profile_id}_settings")
    else:
        return await get_chroma_collection("settings")

async def get_sessions_collection(profile_id: str):
    """Get or create sessions collection in ChromaDB"""
    return await get_chroma_collection(f"{profile_id}_sessions")

async def get_albums_collection(profile_id: str):
    """Get or create albums collection in ChromaDB"""
    return await get_chroma_collection(f"{profile_id}_albums")

async def get_images_collection(profile_id: str):
    """Get or create images collection in ChromaDB"""
    return await get_chroma_collection(f"{profile_id}_images")

async def initialize_database():
    """Initialize all database collections"""
    try:
        # Initialize basic collections
        await get_chroma_collection("profiles")
        await get_chroma_collection("settings")
        
        logger.info("ChromaDB collections initialized")
    except Exception as e:
        logger.error(f"Error initializing ChromaDB collections: {str(e)}")
        raise
