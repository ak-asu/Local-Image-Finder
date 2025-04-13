import os
import logging
from typing import List, Dict, Any, Optional
from app.utils.database import get_chroma_collection
import chromadb

logger = logging.getLogger(__name__)

class ImageRepository:
    """Repository for managing image data and search in ChromaDB"""
    
    def __init__(self, profile_id: str):
        self.profile_id = profile_id
        self.collection_name = f"{profile_id}_images"
        self.collection = None
    
    async def initialize(self):
        """Initialize the collection"""
        if not self.collection:
            self.collection = await get_chroma_collection(self.collection_name)
        return self.collection
    
    def search_by_embedding(self, embedding: List[float], limit: int = 20) -> List[Dict[str, Any]]:
        """Search for images by embedding vector similarity"""
        try:
            if not self.collection:
                raise ValueError("Collection not initialized. Call initialize() first.")
                
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=limit,
                include=["metadatas", "distances"]
            )
            
            search_results = []
            if results and "ids" in results and results["ids"]:
                for i, result_id in enumerate(results["ids"][0]):
                    metadata = results["metadatas"][0][i]
                    distance = results["distances"][0][i] if "distances" in results else 1.0
                    
                    # Convert distance to similarity score
                    similarity_score = 1.0 - min(distance, 1.0)
                    
                    result = {
                        "id": result_id,
                        "metadata": metadata,
                        "similarity_score": similarity_score,
                        "path": metadata.get("filepath", ""),
                        "exists": os.path.exists(metadata.get("filepath", ""))
                    }
                    search_results.append(result)
            
            # Sort by similarity score
            search_results.sort(key=lambda x: x["similarity_score"], reverse=True)
            return search_results
            
        except Exception as e:
            logger.error(f"Error searching by embedding: {str(e)}")
            return []
    
    async def add_image(self, image_id: str, metadata: Dict[str, Any], embedding: List[float]) -> bool:
        """Add or update an image in the collection"""
        try:
            if not self.collection:
                await self.initialize()
                
            self.collection.upsert(
                ids=[image_id],
                embeddings=[embedding],
                metadatas=[metadata]
            )
            return True
        except Exception as e:
            logger.error(f"Error adding image: {str(e)}")
            return False
    
    async def get_image(self, image_id: str) -> Optional[Dict[str, Any]]:
        """Get image by ID"""
        try:
            if not self.collection:
                await self.initialize()
                
            results = self.collection.get(
                ids=[image_id],
                include=["metadatas"]
            )
            
            if results and "metadatas" in results and results["metadatas"]:
                metadata = results["metadatas"][0]
                return {
                    "id": image_id,
                    "metadata": metadata,
                    "path": metadata.get("filepath", ""),
                    "exists": os.path.exists(metadata.get("filepath", ""))
                }
            return None
        except Exception as e:
            logger.error(f"Error getting image: {str(e)}")
            return None
