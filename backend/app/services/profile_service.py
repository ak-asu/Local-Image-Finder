from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from app.models.user_model import Profile
from app.utils.database import get_profile_collection

logger = logging.getLogger(__name__)

async def get_profiles() -> List[Profile]:
    """Get all profiles"""
    collection = await get_profile_collection()
    profiles_data = await collection.find({}).to_list(length=100)  # Limit to 100 profiles
    return [Profile(**profile_data) for profile_data in profiles_data]

async def get_profile(profile_id: str) -> Optional[Profile]:
    """Get a specific profile"""
    collection = await get_profile_collection()
    profile_data = await collection.find_one({"id": profile_id})
    
    if profile_data:
        return Profile(**profile_data)
    return None

async def create_profile(profile: Profile) -> Profile:
    """Create a new profile"""
    collection = await get_profile_collection()
    
    # Check if this is the first profile
    existing_count = await collection.count_documents({})
    if existing_count == 0:
        profile.is_default = True
    
    profile_dict = profile.dict()
    await collection.insert_one(profile_dict)
    
    return profile

async def update_profile(profile_id: str, updates: Dict[str, Any]) -> Optional[Profile]:
    """Update an existing profile"""
    collection = await get_profile_collection()
    
    # Update the last_accessed timestamp
    updates["last_accessed"] = datetime.now()
    
    result = await collection.find_one_and_update(
        {"id": profile_id},
        {"$set": updates},
        return_document=True
    )
    
    if result:
        return Profile(**result)
    return None

async def delete_profile(profile_id: str) -> bool:
    """Delete a profile"""
    collection = await get_profile_collection()
    
    # Check if this is the default profile
    profile = await get_profile(profile_id)
    if profile and profile.is_default:
        # Find another profile to make default
        other_profile = await collection.find_one({"id": {"$ne": profile_id}})
        if other_profile:
            await collection.update_one(
                {"id": other_profile["id"]},
                {"$set": {"is_default": True}}
            )
        else:
            # If no other profiles exist, don't delete the default one
            return False
    
    result = await collection.delete_one({"id": profile_id})
    return result.deleted_count > 0

async def set_default_profile(profile_id: str) -> None:
    """Set a profile as the default profile"""
    collection = await get_profile_collection()
    
    # Verify profile exists
    profile_data = await collection.find_one({"id": profile_id})
    if not profile_data:
        raise ValueError("Profile not found")
    
    # Remove default status from all profiles
    await collection.update_many(
        {"is_default": True},
        {"$set": {"is_default": False}}
    )
    
    # Set new default profile
    await collection.update_one(
        {"id": profile_id},
        {"$set": {"is_default": True}}
    )

async def get_default_profile() -> Optional[Profile]:
    """Get the default profile"""
    collection = await get_profile_collection()
    profile_data = await collection.find_one({"is_default": True})
    
    if profile_data:
        return Profile(**profile_data)
    
    # If no default, get the first profile
    profiles = await get_profiles()
    return profiles[0] if profiles else None
