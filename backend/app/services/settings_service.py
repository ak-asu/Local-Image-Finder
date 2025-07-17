from typing import Dict, Any, Optional, List
import logging
import os
from backend.app.models.profiles_model import ProfileSettings
from app.utils.database import get_settings_collection, get_profile_collection
from app.services.indexing_service import check_for_new_images

logger = logging.getLogger(__name__)

async def get_profile_settings(profile_id: str) -> Optional[ProfileSettings]:
    """Get settings for a specific profile"""
    settings_collection = await get_settings_collection()
    profile_collection = await get_profile_collection()
    
    # Try to get settings from settings collection first
    settings_data = await settings_collection.find_one({"profile_id": profile_id})
    
    if settings_data:
        # Convert to model and remove profile_id field which isn't part of ProfileSettings
        settings_data.pop("profile_id", None)
        settings_data.pop("_id", None)
        return ProfileSettings(**settings_data)
    
    # If not found, try to get from profile
    profile_data = await profile_collection.find_one({"id": profile_id})
    
    if profile_data and "settings" in profile_data:
        return ProfileSettings(**profile_data["settings"])
    
    # If still not found, return default settings
    return ProfileSettings()

async def update_profile_settings(profile_id: str, updates: Dict[str, Any]) -> Optional[ProfileSettings]:
    """Update settings for a specific profile"""
    settings_collection = await get_settings_collection()
    profile_collection = await get_profile_collection()
    
    # Validate settings if needed
    if "similarity_threshold" in updates and (updates["similarity_threshold"] < 0 or updates["similarity_threshold"] > 1):
        raise ValueError("Similarity threshold must be between 0 and 1")
    
    if "monitored_folders" in updates:
        # Validate that folders exist
        for folder in updates["monitored_folders"]:
            if not os.path.exists(folder) or not os.path.isdir(folder):
                raise ValueError(f"Folder not found or not accessible: {folder}")
    
    # Check if settings document exists
    settings_data = await settings_collection.find_one({"profile_id": profile_id})
    
    if settings_data:
        # Update existing settings
        result = await settings_collection.find_one_and_update(
            {"profile_id": profile_id},
            {"$set": updates},
            return_document=True
        )
        
        if result:
            result.pop("_id", None)
            result.pop("profile_id", None)
            
            # If monitored folders were updated, trigger a new indexing
            if "monitored_folders" in updates:
                await check_for_new_images(profile_id, force=True)
                
            return ProfileSettings(**result)
    else:
        # Create new settings document
        profile = await profile_collection.find_one({"id": profile_id})
        
        if not profile:
            return None
        
        # Start with default settings or profile settings if available
        settings = ProfileSettings(**(profile.get("settings", {})))
        
        # Apply updates
        for key, value in updates.items():
            setattr(settings, key, value)
        
        # Store in settings collection
        settings_dict = settings.dict()
        settings_dict["profile_id"] = profile_id
        
        await settings_collection.insert_one(settings_dict)
        
        # Update profile document as well
        await profile_collection.update_one(
            {"id": profile_id},
            {"$set": {"settings": settings.dict()}}
        )
        
        # If monitored folders were updated, trigger a new indexing
        if "monitored_folders" in updates:
            await check_for_new_images(profile_id, force=True)
            
        return settings
    
    return None
