from typing import List, Dict, Optional, Any
import logging
import uuid
import json
from datetime import datetime

from .chroma_client import ChromaDBClient

logger = logging.getLogger(__name__)

class ProfileRepository:
    """Repository for managing user profiles using ChromaDB"""
    
    PROFILES_COLLECTION = "profiles"
    
    def __init__(self):
        """Initialize the profile repository"""
        self.client = ChromaDBClient.get_instance().get_client()
        self.collection = ChromaDBClient.get_instance().get_or_create_collection(self.PROFILES_COLLECTION)
        logger.info("Profile repository initialized")
    
    def create_profile(self, name: str, avatar_path: Optional[str] = None, settings: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """Create a new user profile"""
        try:
            profile_id = str(uuid.uuid4())
            
            default_settings = {
                "image_folders": [],
                "similar_image_count": 20,
                "theme": "light",
                "similarity_threshold": 0.7,
                "ai_model_nlp": "default_nlp",
                "ai_model_vlm": "default_vlm"
            }
            
            profile_metadata = {
                "name": name,
                "avatar_path": avatar_path,
                "settings": settings or default_settings,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "last_accessed": datetime.now().isoformat()
            }
            
            # Store profile with a dummy embedding
            dummy_embedding = [0.0] * 768  # Arbitrary dimension
            
            self.collection.add(
                ids=[profile_id],
                embeddings=[dummy_embedding],
                metadatas=[profile_metadata],
                documents=[f"Profile: {name}"]
            )
            
            logger.info(f"Created new profile '{name}' with ID {profile_id}")
            return profile_id
        except Exception as e:
            logger.error(f"Error creating profile: {str(e)}")
            return None
    
    def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get a profile by ID"""
        try:
            result = self.collection.get(ids=[profile_id], include=["metadatas"])
            
            if not result or not result["ids"]:
                logger.warning(f"Profile with ID {profile_id} not found")
                return None
            
            profile_data = {
                "id": profile_id,
                **result["metadatas"][0]
            }
            
            # Update last accessed timestamp
            self.update_last_accessed(profile_id)
            
            return profile_data
        except Exception as e:
            logger.error(f"Error getting profile {profile_id}: {str(e)}")
            return None
    
    def list_profiles(self) -> List[Dict[str, Any]]:
        """List all profiles"""
        try:
            result = self.collection.get(include=["metadatas"])
            
            profiles = []
            if result and "ids" in result:
                for i, profile_id in enumerate(result["ids"]):
                    profiles.append({
                        "id": profile_id,
                        **result["metadatas"][i]
                    })
            
            logger.info(f"Retrieved {len(profiles)} profiles")
            return profiles
        except Exception as e:
            logger.error(f"Error listing profiles: {str(e)}")
            return []
    
    def update_profile(self, profile_id: str, name: Optional[str] = None,
                      avatar_path: Optional[str] = None, settings: Optional[Dict[str, Any]] = None) -> bool:
        """Update a profile's details"""
        try:
            result = self.collection.get(ids=[profile_id], include=["embeddings", "metadatas"])
            
            if not result or not result["ids"]:
                logger.warning(f"Profile with ID {profile_id} not found")
                return False
            
            current_metadata = result["metadatas"][0]
            updated_metadata = current_metadata.copy()
            
            if name is not None:
                updated_metadata["name"] = name
            if avatar_path is not None:
                updated_metadata["avatar_path"] = avatar_path
            if settings is not None:
                updated_metadata["settings"] = settings
                
            updated_metadata["updated_at"] = datetime.now().isoformat()
            
            self.collection.update(
                ids=[profile_id],
                embeddings=[result["embeddings"][0]],
                metadatas=[updated_metadata]
            )
            
            logger.info(f"Updated profile {profile_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating profile {profile_id}: {str(e)}")
            return False
    
    def update_last_accessed(self, profile_id: str) -> bool:
        """Update the last accessed timestamp for a profile"""
        try:
            result = self.collection.get(ids=[profile_id], include=["embeddings", "metadatas"])
            
            if not result or not result["ids"]:
                return False
            
            current_metadata = result["metadatas"][0]
            updated_metadata = current_metadata.copy()
            updated_metadata["last_accessed"] = datetime.now().isoformat()
            
            self.collection.update(
                ids=[profile_id],
                embeddings=[result["embeddings"][0]],
                metadatas=[updated_metadata]
            )
            
            return True
        except Exception:
            return False
    
    def delete_profile(self, profile_id: str) -> bool:
        """Delete a profile"""
        try:
            self.collection.delete(ids=[profile_id])
            logger.info(f"Deleted profile {profile_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting profile {profile_id}: {str(e)}")
            return False
