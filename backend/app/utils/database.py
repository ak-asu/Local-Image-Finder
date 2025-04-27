import os
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import json

logger = logging.getLogger(__name__)

# Constants for database paths and configuration
DB_DIR = os.path.join(os.path.expanduser("~"), ".local-image-finder")
CHROMA_DIR = os.path.join(DB_DIR, "chromadb")

# Ensure directories exist
os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)

# Initialize client lazily
_chroma_client = None
_collections = {}

class ChromaCollectionWrapper:
    """Wrapper class for ChromaDB collection with helper methods for CRUD operations"""
    
    def __init__(self, collection):
        self.collection = collection
    
    def get(self, ids=None, include=None, limit=None):
        """Direct pass-through to the underlying collection's get method"""
        return self.collection.get(ids=ids, include=include, limit=limit)

    def query(self, query_embeddings=None, n_results=None, include=None):
        """Direct pass-through to the underlying collection's query method"""
        return self.collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results,
            include=include
        )
        
    def add(self, ids, embeddings, metadatas=None, documents=None):
        """Direct pass-through to the underlying collection's add method"""
        return self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        
    def update(self, ids, embeddings=None, metadatas=None, documents=None):
        """Direct pass-through to the underlying collection's update method"""
        return self.collection.update(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        
    def upsert(self, ids, embeddings, metadatas=None, documents=None):
        """Direct pass-through to the underlying collection's upsert method"""
        return self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        
    def delete(self, ids):
        """Direct pass-through to the underlying collection's delete method"""
        return self.collection.delete(ids=ids)
    
    def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find a single document by query"""
        # ChromaDB doesn't have direct query by metadata fields, so we get all and filter
        results = self.collection.get(include=["metadatas"])
        
        if results and "metadatas" in results and results["metadatas"]:
            for i, metadata in enumerate(results["metadatas"]):
                # Check if all query criteria match
                if all(metadata.get(k) == v for k, v in query.items()):
                    result = {
                        "id": results["ids"][i],
                        **metadata
                    }
                    return result
        return None
    
    def find(self, query: Dict[str, Any] = None, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Find documents by query with pagination"""
        results = self.collection.get(include=["metadatas", "ids"], limit=limit + skip)
        
        documents = []
        if results and "metadatas" in results and results["metadatas"]:
            for i, metadata in enumerate(results["metadatas"]):
                if i < skip:
                    continue
                    
                if query is None or all(metadata.get(k) == v for k, v in query.items()):
                    documents.append({
                        "id": results["ids"][i],
                        **metadata
                    })
                
                if len(documents) >= limit:
                    break
        
        return documents
    
    def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        """Update a single document"""
        doc = self.find_one(query)
        if not doc:
            return False
            
        doc_id = doc["id"]
        metadata = {**doc}
        
        # Apply updates
        for key, value in update.items():
            if key.startswith("$set"):
                # Handle $set operator
                for set_key, set_val in value.items():
                    metadata[set_key] = set_val
            else:
                # Direct field update
                metadata[key] = value
        
        # Remove id as it's not part of metadata
        if "id" in metadata:
            del metadata["id"]
            
        # Get original embedding
        original = self.collection.get(ids=[doc_id], include=["embeddings"])
        embedding = original["embeddings"][0] if original and "embeddings" in original else [0.0] * 10
            
        # Upsert with updated metadata
        self.collection.upsert(
            ids=[doc_id],
            metadatas=[metadata],
            embeddings=[embedding]
        )
        
        return True
    
    def delete_one(self, query: Dict[str, Any]) -> bool:
        """Delete a single document"""
        doc = self.find_one(query)
        if not doc:
            return False
            
        self.collection.delete(ids=[doc["id"]])
        return True

def get_chroma_client():
    """Get or create ChromaDB client"""
    global _chroma_client
    if (_chroma_client is None):
        try:
            # Import here to provide helpful error for missing dependencies
            try:
                import chromadb
                from chromadb.config import Settings
            except ImportError as e:
                if "dateutil" in str(e):
                    raise ImportError(
                        "Missing dependency: python-dateutil. Please run: pip install python-dateutil"
                    ) from e
                elif "chromadb" in str(e):
                    raise ImportError(
                        "Missing dependency: chromadb. Please run: pip install chromadb"
                    ) from e
                else:
                    raise
            
            _chroma_client = chromadb.PersistentClient(
                path=CHROMA_DIR,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            logger.info("ChromaDB client initialized")
        except ImportError as e:
            logger.error(f"Dependency error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB client: {str(e)}")
            raise
    return _chroma_client

async def get_chroma_collection(collection_name: str):
    """Get or create a ChromaDB collection"""
    try:
        client = get_chroma_client()
        
        try:
            # Try to get existing collection
            collection = client.get_collection(name=collection_name)
            return ChromaCollectionWrapper(collection)
        except Exception:
            # Create if it doesn't exist
            collection = client.create_collection(name=collection_name)
            return ChromaCollectionWrapper(collection)
    except ImportError as e:
        logger.error(f"Cannot get collection due to missing dependency: {str(e)}")
        raise

async def reset_chroma_collection(collection_name: str):
    """Reset a ChromaDB collection"""
    client = get_chroma_client()
    try:
        client.delete_collection(name=collection_name)
        logger.info(f"Deleted ChromaDB collection: {collection_name}")
    except Exception as e:
        logger.warning(f"Error deleting collection {collection_name}: {str(e)}")
    
    collection = client.create_collection(name=collection_name)
    return ChromaCollectionWrapper(collection)

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
        # Check for required dependencies first
        try:
            import chromadb
            import dateutil
        except ImportError as e:
            if "dateutil" in str(e):
                logger.error("Missing dependency: python-dateutil. Please run: pip install python-dateutil")
            elif "chromadb" in str(e):
                logger.error("Missing dependency: chromadb. Please run: pip install chromadb")
            else:
                logger.error(f"Missing dependency: {str(e)}")
            raise

        # Initialize basic collections
        await get_chroma_collection("profiles")
        await get_chroma_collection("settings")
        
        # Create default profile if needed
        # This will be handled by the profile service
        
        logger.info("ChromaDB collections initialized")
    except Exception as e:
        logger.error(f"Error initializing ChromaDB collections: {str(e)}")
        raise

def serialize_datetime(obj):
    """Helper function to serialize datetime objects to ISO format for ChromaDB"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def deserialize_datetime(data: Dict[str, Any]) -> Dict[str, Any]:
    """Helper function to deserialize ISO datetime strings back to datetime objects"""
    datetime_fields = [
        'created_at', 'updated_at', 'last_accessed', 
        'last_indexed', 'timestamp', 'added_at',
        'creation_date', 'modified_date'
    ]
    
    for field in datetime_fields:
        if field in data and isinstance(data[field], str):
            try:
                data[field] = datetime.fromisoformat(data[field])
            except (ValueError, TypeError):
                pass
    
    return data
