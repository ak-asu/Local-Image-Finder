# filepath: c:\Users\presyze\ASU\Apps\Local-Image-Finder\backend\app\services\profile_service.py
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

from backend.app.models.profiles_model import Profile, ProfileSettings
from app.utils.database import get_profile_collection, get_settings_collection
from app.database.chroma_client import serialize_datetime

logger = logging.getLogger(__name__)

async def get_profiles() -> List[Profile]:
    """Get all profiles from the database"""
    try:
        collection = await get_profile_collection()
        profiles = []
        
        # Use the find method from ChromaCollectionWrapper
        profile_docs = collection.find()
        
        for profile_doc in profile_docs:
            profile = Profile(**profile_doc)
            profiles.append(profile)
        
        return profiles
    except Exception as e:
        logger.error(f"Error fetching profiles: {str(e)}")
        raise

async def get_profile(profile_id: str) -> Optional[Profile]:
    """Get a specific profile by ID"""
    try:
        collection = await get_profile_collection()
        profile_doc = collection.find_one({"id": profile_id})
        
        if profile_doc:
            return Profile(**profile_doc)
        return None
    except Exception as e:
        logger.error(f"Error fetching profile {profile_id}: {str(e)}")
        raise

async def create_profile(profile: Profile) -> Profile:
    """Create a new profile"""
    try:
        collection = await get_profile_collection()
        
        # Check if this is the first profile, if so mark it as default
        existing_profiles = await get_profiles()
        if not existing_profiles:
            profile.is_default = True
        
        # Store profile in ChromaDB using the ChromaCollectionWrapper's add method
        profile_dict = profile.dict()
        
        # Store profile in ChromaDB
        collection.upsert(
            ids=[profile.id],
            metadatas=[profile_dict],
            embeddings=[[0.0] * 10]  # Dummy embedding, profiles don't need real embeddings
        )
        
        # Create default settings for the profile
        settings_collection = await get_settings_collection()
        settings_collection.upsert(
            ids=[f"settings_{profile.id}"],
            metadatas=[{"profile_id": profile.id, **profile.settings.dict()}],
            embeddings=[[0.0] * 10]  # Dummy embedding
        )
        
        return profile
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise

async def update_profile(profile_id: str, update_data: Dict[str, Any]) -> Optional[Profile]:
    """Update a profile"""
    try:
        profile = await get_profile(profile_id)
        if not profile:
            return None
            
        collection = await get_profile_collection()
        
        # Update the profile object
        for key, value in update_data.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        
        # Update the lastAccessed time
        profile.last_accessed = datetime.now()
        
        # Store the updated profile
        profile_dict = profile.dict()
        
        # Update using the ChromaCollectionWrapper's update_one method
        collection.update_one(
            {"id": profile_id},
            {"$set": profile_dict}
        )
        
        return profile
    except Exception as e:
        logger.error(f"Error updating profile {profile_id}: {str(e)}")
        raise

async def delete_profile(profile_id: str) -> bool:
    """Delete a profile"""
    try:
        collection = await get_profile_collection()
        
        # Check if profile exists and is not the default
        profile = await get_profile(profile_id)
        if not profile:
            return False
            
        if profile.is_default:
            # Cannot delete the default profile
            logger.warning(f"Cannot delete default profile: {profile_id}")
            return False
        
        # Delete the profile
        success = collection.delete_one({"id": profile_id})
        
        if success:
            # Also delete associated settings
            settings_collection = await get_settings_collection()
            settings_collection.delete_one({"profile_id": profile_id})
            
            logger.info(f"Profile {profile_id} deleted")
        
        return success
    except Exception as e:
        logger.error(f"Error deleting profile {profile_id}: {str(e)}")
        raise

async def set_default_profile(profile_id: str) -> bool:
    """Set a profile as the default"""
    try:
        # Get the profile
        profile = await get_profile(profile_id)
        if not profile:
            return False
            
        collection = await get_profile_collection()
        
        # First, unset default on all profiles
        all_profiles = await get_profiles()
        for p in all_profiles:
            if p.is_default and p.id != profile_id:
                p.is_default = False
                collection.update_one(
                    {"id": p.id},
                    {"$set": {"is_default": False}}
                )
        
        # Set this profile as default
        if not profile.is_default:
            profile.is_default = True
            collection.update_one(
                {"id": profile_id},
                {"$set": {"is_default": True}}
            )
        
        return True
    except Exception as e:
        logger.error(f"Error setting default profile {profile_id}: {str(e)}")
        raise

async def update_profile_settings(profile_id: str, settings_updates: Dict[str, Any]) -> Optional[ProfileSettings]:
    """Update profile settings"""
    try:
        profile = await get_profile(profile_id)
        if not profile:
            return None
            
        settings_collection = await get_settings_collection()
        
        # Get existing settings
        settings_doc = settings_collection.find_one({"profile_id": profile_id})
        settings = profile.settings
        
        # Apply updates to settings
        for key, value in settings_updates.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
        
        # Store updated settings
        settings_dict = settings.dict()
        
        if settings_doc:
            # Update existing settings
            settings_collection.update_one(
                {"profile_id": profile_id},
                {"$set": settings_dict}
            )
        else:
            # Create new settings
            settings_collection.add(
                ids=[f"settings_{profile_id}"],
                metadatas=[{"profile_id": profile_id, **settings_dict}],
                embeddings=[[0.0] * 10]  # Dummy embedding
            )
        
        # Also update the settings in the profile
        profile.settings = settings
        
        # Update the profile
        profile_collection = await get_profile_collection()
        profile_collection.update_one(
            {"id": profile_id},
            {"$set": {"settings": settings_dict}}
        )
        
        return settings
    except Exception as e:
        logger.error(f"Error updating settings for profile {profile_id}: {str(e)}")
        raise

async def get_default_profile() -> Optional[Profile]:
    """Get the default profile"""
    try:
        collection = await get_profile_collection()
        default_profile_doc = collection.find_one({"is_default": True})
        
        if default_profile_doc:
            return Profile(**default_profile_doc)
            
        # If no default profile is found, get the first profile
        profiles = await get_profiles()
        if profiles:
            return profiles[0]
            
        return None
    except Exception as e:
        logger.error(f"Error getting default profile: {str(e)}")
        raise
