from fastapi import APIRouter, HTTPException, Path, Body, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from backend.app.models.profiles_model import ProfileSettings
from app.models.settings_model import SettingsUpdate, FolderValidationRequest
from app.services.settings_service import get_profile_settings, update_profile_settings
from app.utils.embeddings import TEXT_MODELS, IMAGE_MODELS
import os

router = APIRouter()

@router.get("/settings/{profile_id}", response_model=ProfileSettings)
async def get_settings(profile_id: str):
    """Get settings for a specific profile"""
    settings = await get_profile_settings(profile_id)
    if not settings:
        raise HTTPException(status_code=404, detail="Profile settings not found")
    return settings

@router.put("/settings/{profile_id}", response_model=ProfileSettings)
async def update_settings(
    profile_id: str, 
    settings_update: dict = Body(...)
):
    """Update settings for a specific profile"""
    try:
        updated_settings = await update_profile_settings(profile_id, settings_update)
        if not updated_settings:
            raise HTTPException(status_code=404, detail="Profile settings not found")
        return updated_settings
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

@router.post("/settings/folders/validate", response_model=Dict[str, bool])
async def validate_folders(validation_request: FolderValidationRequest):
    """Validate if the provided folders exist and are accessible"""
    result = {}
    for folder in validation_request.folders:
        result[folder] = os.path.exists(folder) and os.path.isdir(folder)
    return result

@router.get("/settings/models", response_model=Dict[str, List[str]])
async def get_available_models():
    """Get available AI models for text and image processing"""
    # Convert Enum values to strings for the response
    text_models = [model.value for model in TEXT_MODELS.keys()]
    image_models = [model.value for model in IMAGE_MODELS.keys()]
    
    return {
        "text_models": text_models,
        "image_models": image_models
    }
