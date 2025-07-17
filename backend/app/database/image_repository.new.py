# filepath: c:\Users\presyze\ASU\Apps\Local-Image-Finder\backend\app\database\image_repository.py
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.utils.database import get_chroma_collection
from app.models.image_model import Image, ImageMetadata, ImageSearchResult
from app.database.chroma_client import serialize_datetime

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
    
    async def search_by_embedding(self, embedding: List[float], limit: int = 20, similarity_threshold: float = 0.7) -> List[ImageSearchResult]:
        """Search for images by embedding vector similarity"""
        try:
            if not self.collection:
                await self.initialize()
                
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
                    
                    # Skip results below threshold
                    if similarity_score < similarity_threshold:
                        continue
                    
                    # Create ImageMetadata from metadata dict
                    image_metadata = ImageMetadata(
                        filename=metadata.get("filename", ""),
                        filepath=metadata.get("filepath", ""),
                        filesize=metadata.get("filesize", 0),
                        width=metadata.get("width"),
                        height=metadata.get("height"),
                        creation_date=metadata.get("creation_date"),
                        modified_date=metadata.get("modified_date"),
                        exif=metadata.get("exif", {})
                    )
                    
                    # Create Image object
                    image = Image(
                        id=result_id,
                        metadata=image_metadata,
                        embedding_id=result_id,
                        last_indexed=datetime.fromisoformat(metadata.get("last_indexed")) if "last_indexed" in metadata else datetime.now()
                    )
                    
                    # Create ImageSearchResult with image and score
                    file_exists = os.path.exists(image_metadata.filepath)
                    result = ImageSearchResult(
                        image=image,
                        similarity_score=similarity_score,
                        exists=file_exists
                    )
                    
                    search_results.append(result)
            
            return search_results
        except Exception as e:
            logger.error(f"Error searching images by embedding: {str(e)}")
            raise
    
    async def add_image(self, image: Image, embedding: List[float]) -> bool:
        """Add an image with its embedding to the repository"""
        try:
            if not self.collection:
                await self.initialize()
                
            # Convert Image to metadata dict
            metadata = {
                "filename": image.metadata.filename,
                "filepath": image.metadata.filepath,
                "filesize": image.metadata.filesize,
                "width": image.metadata.width,
                "height": image.metadata.height,
                "creation_date": image.metadata.creation_date,
                "modified_date": image.metadata.modified_date,
                "exif": image.metadata.exif,
                "last_indexed": image.last_indexed.isoformat()
            }
            
            # Add to ChromaDB
            self.collection.upsert(
                ids=[image.id],
                embeddings=[embedding],
                metadatas=[metadata]
            )
            
            return True
        except Exception as e:
            logger.error(f"Error adding image to repository: {str(e)}")
            return False
    
    async def get_image_by_id(self, image_id: str) -> Optional[Image]:
        """Get an image by its ID"""
        try:
            if not self.collection:
                await self.initialize()
                
            # Get from ChromaDB
            result = self.collection.find_one({"id": image_id})
            
            if result:
                # Create ImageMetadata
                metadata = ImageMetadata(
                    filename=result.get("filename", ""),
                    filepath=result.get("filepath", ""),
                    filesize=result.get("filesize", 0),
                    width=result.get("width"),
                    height=result.get("height"),
                    creation_date=result.get("creation_date"),
                    modified_date=result.get("modified_date"),
                    exif=result.get("exif", {})
                )
                
                # Create Image
                image = Image(
                    id=image_id,
                    metadata=metadata,
                    embedding_id=image_id,
                    last_indexed=datetime.fromisoformat(result.get("last_indexed")) if "last_indexed" in result else datetime.now()
                )
                
                return image
            
            return None
        except Exception as e:
            logger.error(f"Error getting image by ID: {str(e)}")
            return None
    
    async def get_image_by_path(self, filepath: str) -> Optional[Image]:
        """Get an image by its file path"""
        try:
            if not self.collection:
                await self.initialize()
                
            # Get from ChromaDB
            result = self.collection.find_one({"filepath": filepath})
            
            if result:
                # Create ImageMetadata
                metadata = ImageMetadata(
                    filename=result.get("filename", ""),
                    filepath=result.get("filepath", ""),
                    filesize=result.get("filesize", 0),
                    width=result.get("width"),
                    height=result.get("height"),
                    creation_date=result.get("creation_date"),
                    modified_date=result.get("modified_date"),
                    exif=result.get("exif", {})
                )
                
                # Create Image
                image = Image(
                    id=result.get("id"),
                    metadata=metadata,
                    embedding_id=result.get("id"),
                    last_indexed=datetime.fromisoformat(result.get("last_indexed")) if "last_indexed" in result else datetime.now()
                )
                
                return image
            
            return None
        except Exception as e:
            logger.error(f"Error getting image by path: {str(e)}")
            return None
    
    async def delete_image(self, image_id: str) -> bool:
        """Delete an image from the repository"""
        try:
            if not self.collection:
                await self.initialize()
                
            # Delete from ChromaDB
            return self.collection.delete_one({"id": image_id})
        except Exception as e:
            logger.error(f"Error deleting image: {str(e)}")
            return False
    
    async def count_images(self) -> int:
        """Count the number of images in the repository"""
        try:
            if not self.collection:
                await self.initialize()
                
            # Get all and count
            results = self.collection.find()
            return len(results)
        except Exception as e:
            logger.error(f"Error counting images: {str(e)}")
            return 0
