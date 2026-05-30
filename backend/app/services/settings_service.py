import json
import logging
import os
from typing import Dict, Any, Optional

from app.models.profiles_model import ProfileSettings
from app.utils.database import get_settings_collection
from app.services.indexing_service import check_for_new_images

logger = logging.getLogger(__name__)


def _settings_to_metadata(profile_id: str, settings: ProfileSettings) -> dict:
    d = settings.dict()
    d["custom_theme_colors"] = json.dumps(d.get("custom_theme_colors", {}))
    d["profile_id"] = profile_id
    return d


def _metadata_to_settings(metadata: dict) -> ProfileSettings:
    data = {k: v for k, v in metadata.items() if k not in ("profile_id", "id")}
    if "custom_theme_colors" in data and isinstance(data["custom_theme_colors"], str):
        try:
            data["custom_theme_colors"] = json.loads(data["custom_theme_colors"])
        except (json.JSONDecodeError, TypeError):
            data["custom_theme_colors"] = {}
    return ProfileSettings(**data)


async def get_profile_settings(profile_id: str) -> Optional[ProfileSettings]:
    """Get settings for a specific profile"""
    try:
        collection = await get_settings_collection()
        result = collection.find_one({"profile_id": profile_id})
        if result:
            return _metadata_to_settings(result)
        return ProfileSettings()
    except Exception as e:
        logger.error(f"Error fetching settings for profile {profile_id}: {str(e)}")
        raise


async def update_profile_settings(profile_id: str, updates: Dict[str, Any]) -> Optional[ProfileSettings]:
    """Update settings for a specific profile"""
    try:
        if "similarity_threshold" in updates:
            if not (0 <= updates["similarity_threshold"] <= 1):
                raise ValueError("Similarity threshold must be between 0 and 1")

        if "monitored_folders" in updates:
            for folder in updates["monitored_folders"]:
                if not os.path.exists(folder) or not os.path.isdir(folder):
                    raise ValueError(f"Folder not found or not accessible: {folder}")

        # Load current settings
        collection = await get_settings_collection()
        existing = collection.find_one({"profile_id": profile_id})
        if existing:
            current = _metadata_to_settings(existing)
        else:
            current = ProfileSettings()

        # Apply updates
        current_dict = current.dict()
        current_dict.update(updates)
        updated = ProfileSettings(**current_dict)

        # Persist
        collection.upsert(
            ids=[f"settings_{profile_id}"],
            metadatas=[_settings_to_metadata(profile_id, updated)],
            embeddings=[[0.0] * 10]
        )

        if "monitored_folders" in updates:
            await check_for_new_images(profile_id, force=True)

        return updated
    except (ValueError, Exception) as e:
        logger.error(f"Error updating settings for profile {profile_id}: {str(e)}")
        raise
