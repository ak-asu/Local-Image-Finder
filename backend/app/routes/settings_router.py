from fastapi import APIRouter, HTTPException, Path, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.models.user_model import ProfileSettings, ThemeMode, ModelType
from app.services.settings_service import get_profile_settings, update_profile_settings

router = APIRouter()

class SettingsUpdate(BaseModel):
    similar_image_count: Optional[int] = None
    monitored_folders: Optional[List[str]] = None
    theme_mode: Optional[ThemeMode] = None
    custom_theme_colors: Optional[Dict[str, str]] = None
    similarity_threshold: Optional[float] = None
    nlp_model: Optional[ModelType] = None
    vlm_model: Optional[ModelType] = None
    auto_index_interval_minutes: Optional[int] = None

@router.get("/{profile_id}", response_model=ProfileSettings)
async def get_settings(profile_id: str):
    """Get settings for a specific profile"""
    settings = await get_profile_settings(profile_id)
    if not settings:
        raise HTTPException(status_code=404, detail="Profile settings not found")
    return settings

@router.patch("/{profile_id}", response_model=ProfileSettings)
async def update_settings(profile_id: str, settings_update: SettingsUpdate):
    """Update settings for a specific profile"""
    try:
        # Filter out None values
        updates = {k: v for k, v in settings_update.dict().items() if v is not None}
        updated_settings = await update_profile_settings(profile_id, updates)
        if not updated_settings:
            raise HTTPException(status_code=404, detail="Profile settings not found")
        return updated_settings
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

@router.get("/folders/validate", response_model=Dict[str, bool])
async def validate_folders(folders: List[str] = Body(...)):
    """Validate if the provided folders exist and are accessible"""
    import os
    result = {}
    for folder in folders:
        result[folder] = os.path.exists(folder) and os.path.isdir(folder)
    return result
