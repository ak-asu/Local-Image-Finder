from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional
from pydantic import BaseModel
from uuid import uuid4
from app.models.user_model import Profile, ProfileSettings
from app.services.profile_service import (
    get_profiles, get_profile, create_profile, 
    update_profile, delete_profile, set_default_profile
)

router = APIRouter()

class ProfileCreate(BaseModel):
    name: str
    avatar: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

@router.get("/", response_model=List[Profile])
async def list_profiles():
    """Get all user profiles"""
    try:
        profiles = await get_profiles()
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profiles: {str(e)}")

@router.get("/{profile_id}", response_model=Profile)
async def get_profile_details(profile_id: str):
    """Get details of a specific profile"""
    profile = await get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("/", response_model=Profile)
async def create_new_profile(profile_data: ProfileCreate):
    """Create a new user profile"""
    try:
        profile = Profile(
            id=str(uuid4()),
            name=profile_data.name,
            avatar=profile_data.avatar,
            settings=ProfileSettings()
        )
        created_profile = await create_profile(profile)
        return created_profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")

@router.patch("/{profile_id}", response_model=Profile)
async def update_profile_details(profile_id: str, updates: ProfileUpdate):
    """Update profile details"""
    profile = await get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    updated_profile = await update_profile(profile_id, update_data)
    return updated_profile

@router.delete("/{profile_id}", response_model=dict)
async def delete_profile_endpoint(profile_id: str):
    """Delete a user profile"""
    success = await delete_profile(profile_id)
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"success": True, "message": "Profile deleted successfully"}

@router.put("/{profile_id}/default", response_model=dict)
async def set_as_default(profile_id: str):
    """Set a profile as the default profile"""
    try:
        await set_default_profile(profile_id)
        return {"success": True, "message": "Default profile updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update default profile: {str(e)}")
