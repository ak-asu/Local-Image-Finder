from typing import List, Dict, Optional, Any
import logging
import uuid
import json
from datetime import datetime

from .chroma_client import ChromaDBClient

logger = logging.getLogger(__name__)

class AlbumRepository:
    """Repository for managing albums using ChromaDB"""
    
    ALBUMS_COLLECTION = "albums"
    ALBUM_IMAGES_COLLECTION = "album_images"
    
    def __init__(self, profile_id: str):
        """Initialize the album repository for a specific profile"""
        self.client = ChromaDBClient.get_instance().get_client()
        self.profile_id = profile_id
        self.albums_collection_name = f"{profile_id}_{self.ALBUMS_COLLECTION}"
        self.albums_collection = ChromaDBClient.get_instance().get_or_create_collection(self.albums_collection_name)
        logger.info(f"Album repository initialized for profile: {profile_id}")
    
    def _get_album_images_collection(self, album_id: str):
        """Get or create a collection for album images"""
        collection_name = f"{self.profile_id}_{album_id}_{self.ALBUM_IMAGES_COLLECTION}"
        return ChromaDBClient.get_instance().get_or_create_collection(collection_name)
    
    def create_album(self, name: str, description: str, cover_image_path: Optional[str] = None) -> Optional[str]:
        """Create a new album"""
        try:
            album_id = str(uuid.uuid4())
            
            # Album metadata
            album_metadata = {
                "name": name,
                "description": description,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "cover_image_path": cover_image_path,
                "image_count": 0
            }
            
            # Store album in ChromaDB with a dummy embedding (we don't need vector search for albums)
            dummy_embedding = [0.0] * 768  # Arbitrary dimension
            
            self.albums_collection.add(
                ids=[album_id],
                embeddings=[dummy_embedding],
                metadatas=[album_metadata],
                documents=[f"Album: {name} - {description}"]
            )
            
            logger.info(f"Created new album '{name}' with ID {album_id}")
            return album_id
        except Exception as e:
            logger.error(f"Error creating album: {str(e)}")
            return None
    
    def get_album(self, album_id: str) -> Optional[Dict[str, Any]]:
        """Get an album by ID"""
        try:
            result = self.albums_collection.get(ids=[album_id], include=["metadatas"])
            
            if not result or not result["ids"]:
                logger.warning(f"Album with ID {album_id} not found")
                return None
            
            album_data = {
                "id": album_id,
                **result["metadatas"][0]
            }
            
            return album_data
        except Exception as e:
            logger.error(f"Error getting album {album_id}: {str(e)}")
            return None
    
    def list_albums(self) -> List[Dict[str, Any]]:
        """List all albums for the current profile"""
        try:
            result = self.albums_collection.get(include=["metadatas"])
            
            albums = []
            if result and "ids" in result:
                for i, album_id in enumerate(result["ids"]):
                    albums.append({
                        "id": album_id,
                        **result["metadatas"][i]
                    })
            
            logger.info(f"Retrieved {len(albums)} albums for profile {self.profile_id}")
            return albums
        except Exception as e:
            logger.error(f"Error listing albums: {str(e)}")
            return []
    
    def update_album(self, album_id: str, name: Optional[str] = None, 
                     description: Optional[str] = None, cover_image_path: Optional[str] = None) -> bool:
        """Update an album's details"""
        try:
            result = self.albums_collection.get(ids=[album_id], include=["embeddings", "metadatas"])
            
            if not result or not result["ids"]:
                logger.warning(f"Album with ID {album_id} not found")
                return False
            
            current_metadata = result["metadatas"][0]
            updated_metadata = current_metadata.copy()
            
            if name is not None:
                updated_metadata["name"] = name
            if description is not None:
                updated_metadata["description"] = description
            if cover_image_path is not None:
                updated_metadata["cover_image_path"] = cover_image_path
                
            updated_metadata["updated_at"] = datetime.now().isoformat()
            
            self.albums_collection.update(
                ids=[album_id],
                embeddings=[result["embeddings"][0]],
                metadatas=[updated_metadata]
            )
            
            logger.info(f"Updated album {album_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating album {album_id}: {str(e)}")
            return False
    
    def delete_album(self, album_id: str) -> bool:
        """Delete an album and its images collection"""
        try:
            # Delete the album
            self.albums_collection.delete(ids=[album_id])
            
            # Delete the album images collection
            try:
                collection_name = f"{self.profile_id}_{album_id}_{self.ALBUM_IMAGES_COLLECTION}"
                ChromaDBClient.get_instance().delete_collection(collection_name)
            except Exception as inner_e:
                # Just log the error but continue with deletion
                logger.warning(f"Could not delete album images collection: {str(inner_e)}")
            
            logger.info(f"Deleted album {album_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting album {album_id}: {str(e)}")
            return False
    
    def add_images_to_album(self, album_id: str, image_ids: List[str], image_paths: List[str], 
                           embeddings: List[List[float]], metadata_list: List[Dict[str, Any]]) -> bool:
        """Add images to an album"""
        try:
            # Get album
            album = self.get_album(album_id)
            if not album:
                logger.error(f"Album {album_id} not found when adding images")
                return False
                
            # Get album images collection
            album_images_collection = self._get_album_images_collection(album_id)
            
            # Add images to album collection
            album_images_collection.add(
                ids=image_ids,
                embeddings=embeddings,
                metadatas=metadata_list,
                documents=[f"Image: {path}" for path in image_paths]
            )
            
            # Update image count in album metadata
            updated_count = album.get("image_count", 0) + len(image_ids)
            self.update_album(album_id)
            self.albums_collection.update(
                ids=[album_id],
                embeddings=[[0.0] * 768],  # Same dummy embedding as in create
                metadatas=[{**album, "image_count": updated_count, "updated_at": datetime.now().isoformat()}]
            )
            
            logger.info(f"Added {len(image_ids)} images to album {album_id}")
            return True
        except Exception as e:
            logger.error(f"Error adding images to album {album_id}: {str(e)}")
            return False
    
    def get_album_images(self, album_id: str) -> List[Dict[str, Any]]:
        """Get all images in an album"""
        try:
            # Check if album exists
            album = self.get_album(album_id)
            if not album:
                logger.error(f"Album {album_id} not found when fetching images")
                return []
            
            # Get album images collection
            album_images_collection = self._get_album_images_collection(album_id)
            
            # Get all images
            result = album_images_collection.get(include=["metadatas"])
            
            images = []
            if result and "ids" in result:
                for i, image_id in enumerate(result["ids"]):
                    images.append({
                        "id": image_id,
                        "metadata": result["metadatas"][i],
                        "path": result["metadatas"][i].get("image_path", "")
                    })
            
            logger.info(f"Retrieved {len(images)} images from album {album_id}")
            return images
        except Exception as e:
            logger.error(f"Error getting images from album {album_id}: {str(e)}")
            return []
    
    def search_album_images(self, album_id: str, query_embedding: List[float], limit: int = 20) -> List[Dict[str, Any]]:
        """Search for images in an album by similarity to the provided embedding"""
        try:
            # Check if album exists
            album = self.get_album(album_id)
            if not album:
                logger.error(f"Album {album_id} not found when searching images")
                return []
            
            # Get album images collection
            album_images_collection = self._get_album_images_collection(album_id)
            
            # Search by similarity
            results = album_images_collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                include=["metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            if results and results["ids"] and len(results["ids"]) > 0:
                for i, id_val in enumerate(results["ids"][0]):
                    result = {
                        "id": id_val,
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i] if "distances" in results else None,
                        "path": results["metadatas"][0][i].get("image_path", "")
                    }
                    formatted_results.append(result)
            
            logger.info(f"Found {len(formatted_results)} images in album {album_id} for similarity search")
            return formatted_results
        except Exception as e:
            logger.error(f"Error searching images in album {album_id}: {str(e)}")
            return []
    
    def remove_images_from_album(self, album_id: str, image_ids: List[str]) -> bool:
        """Remove images from an album"""
        try:
            # Check if album exists
            album = self.get_album(album_id)
            if not album:
                logger.error(f"Album {album_id} not found when removing images")
                return False
            
            # Get album images collection
            album_images_collection = self._get_album_images_collection(album_id)
            
            # Remove images
            album_images_collection.delete(ids=image_ids)
            
            # Update image count in album metadata
            updated_count = max(0, album.get("image_count", 0) - len(image_ids))
            self.albums_collection.update(
                ids=[album_id],
                embeddings=[[0.0] * 768],  # Same dummy embedding as in create
                metadatas=[{**album, "image_count": updated_count, "updated_at": datetime.now().isoformat()}]
            )
            
            logger.info(f"Removed {len(image_ids)} images from album {album_id}")
            return True
        except Exception as e:
            logger.error(f"Error removing images from album {album_id}: {str(e)}")
            return False
