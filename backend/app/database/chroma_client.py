import chromadb
from chromadb.config import Settings
import os
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Define constants for database paths and configuration
DB_DIR = os.path.join(os.path.expanduser("~"), ".local-image-finder")
CHROMA_DIR = os.path.join(DB_DIR, "chromadb")

# Ensure directories exist
os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)

class ChromaDBClient:
    _instance = None
    _client = None

    @classmethod
    def get_instance(cls):
        """Singleton pattern to ensure only one ChromaDB client instance exists"""
        if cls._instance is None:
            cls._instance = ChromaDBClient()
        return cls._instance

    def __init__(self):
        """Initialize ChromaDB client with persistent storage"""
        try:
            # Set the persistent directory for ChromaDB            
            # Ensure the directory exists
            os.makedirs(CHROMA_DIR, exist_ok=True)
            
            # Create the client with persistent storage
            self._client = chromadb.PersistentClient(
                path=CHROMA_DIR,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            logger.info(f"ChromaDB client initialized with persistent storage at {CHROMA_DIR}")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB client: {str(e)}")
            raise

    def get_client(self):
        """Get the ChromaDB client instance"""
        return self._client

    def get_or_create_collection(self, collection_name: str, embedding_dimension: int = 1536):
        """Get an existing collection or create a new one if it doesn't exist"""
        try:
            # Try to get an existing collection
            try:
                collection = self._client.get_collection(collection_name)
                logger.info(f"Retrieved existing collection: {collection_name}")
                return ChromaCollectionWrapper(collection)
            except Exception:
                # Collection doesn't exist, create a new one
                collection = self._client.create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine"}  # Using cosine similarity by default
                )
                logger.info(f"Created new collection: {collection_name}")
                return ChromaCollectionWrapper(collection)
        except Exception as e:
            logger.error(f"Error getting or creating collection {collection_name}: {str(e)}")
            raise

    def list_collections(self):
        """List all available collections"""
        try:
            return self._client.list_collections()
        except Exception as e:
            logger.error(f"Error listing collections: {str(e)}")
            raise
    
    def delete_collection(self, collection_name: str) -> bool:
        """Delete a collection by name"""
        try:
            self._client.delete_collection(collection_name)
            logger.info(f"Deleted collection: {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting collection {collection_name}: {str(e)}")
            return False

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
    """Get the ChromaDB client instance"""
    return ChromaDBClient.get_instance()


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
