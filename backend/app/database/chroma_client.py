import chromadb
from chromadb.config import Settings
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

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
            persist_directory = os.environ.get("CHROMADB_PERSIST_DIR", "./chroma_db")
            
            # Ensure the directory exists
            os.makedirs(persist_directory, exist_ok=True)
            
            # Create the client with persistent storage
            self._client = chromadb.Client(Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory=persist_directory
            ))
            logger.info(f"ChromaDB client initialized with persistent storage at {persist_directory}")
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
                return collection
            except Exception:
                # Collection doesn't exist, create a new one
                collection = self._client.create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine"}  # Using cosine similarity by default
                )
                logger.info(f"Created new collection: {collection_name}")
                return collection
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
