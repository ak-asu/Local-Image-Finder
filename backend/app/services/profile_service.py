import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

from app.models.profiles_model import Profile, ProfileSettings
from app.utils.database import get_profile_collection, get_settings_collection

logger = logging.getLogger(__name__)


def _profile_to_metadata(profile: Profile) -> dict:
    """Flatten a Profile into a ChromaDB-compatible metadata dict (no nested dicts/datetimes)."""
    d = profile.dict()
    d.pop("settings", None)  # stored separately
    d["created_at"] = d["created_at"].isoformat() if isinstance(d.get("created_at"), datetime) else d.get("created_at", "")
    d["last_accessed"] = d["last_accessed"].isoformat() if isinstance(d.get("last_accessed"), datetime) else d.get("last_accessed", "")
    return d


def _settings_to_metadata(profile_id: str, settings: ProfileSettings) -> dict:
    """Flatten ProfileSettings into a ChromaDB-compatible metadata dict."""
    d = settings.dict()
    # custom_theme_colors is a dict — serialize to JSON string
    d["custom_theme_colors"] = json.dumps(d.get("custom_theme_colors", {}))
    # Enum values are already str (ThemeMode/ModelType are str enums)
    d["profile_id"] = profile_id
    return d


def _metadata_to_settings(metadata: dict) -> ProfileSettings:
    """Reconstruct ProfileSettings from ChromaDB metadata."""
    data = {k: v for k, v in metadata.items() if k != "profile_id"}
    if "custom_theme_colors" in data and isinstance(data["custom_theme_colors"], str):
        try:
            data["custom_theme_colors"] = json.loads(data["custom_theme_colors"])
        except (json.JSONDecodeError, TypeError):
            data["custom_theme_colors"] = {}
    return ProfileSettings(**data)

async def get_profiles() -> List[Profile]:
    """Get all profiles from the database"""
    try:
        collection = await get_profile_collection()
        results = collection.get(include=["metadatas"])

        profiles = []
        if results and "metadatas" in results and results["metadatas"]:
            for metadata in results["metadatas"]:
                # settings are stored separately — attach default so model validates
                metadata.setdefault("settings", {})
                profile = Profile(**metadata)
                profiles.append(profile)

        return profiles
    except Exception as e:
        logger.error(f"Error fetching profiles: {str(e)}")
        raise

async def get_profile(profile_id: str) -> Optional[Profile]:
    """Get a specific profile by ID"""
    try:
        collection = await get_profile_collection()
        results = collection.get(ids=[profile_id], include=["metadatas"])

        if results and "metadatas" in results and results["metadatas"]:
            metadata = results["metadatas"][0]
            metadata.setdefault("settings", {})
            return Profile(**metadata)
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
        
        # Store profile in ChromaDB (flat metadata — no nested dicts)
        collection.upsert(
            ids=[profile.id],
            metadatas=[_profile_to_metadata(profile)],
            embeddings=[[0.0] * 10]
        )

        # Create default settings for the profile
        settings_collection = await get_settings_collection()
        settings_collection.upsert(
            ids=[f"settings_{profile.id}"],
            metadatas=[_settings_to_metadata(profile.id, profile.settings)],
            embeddings=[[0.0] * 10]
        )
        
        return profile
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise

async def update_profile(profile_id: str, update_data: Dict[str, Any]) -> Profile:
    """Update an existing profile"""
    try:
        profile = await get_profile(profile_id)
        if not profile:
            raise ValueError(f"Profile with ID {profile_id} not found")
        
        # Update profile fields
        for key, value in update_data.items():
            if hasattr(profile, key):
                setattr(profile, key, value)
        
        # Update last accessed timestamp
        profile.last_accessed = datetime.now()
        
        # Save to database
        collection = await get_profile_collection()
        collection.upsert(
            ids=[profile.id],
            metadatas=[_profile_to_metadata(profile)],
            embeddings=[[0.0] * 10]
        )

        return profile
    except Exception as e:
        logger.error(f"Error updating profile {profile_id}: {str(e)}")
        raise

async def delete_profile(profile_id: str) -> bool:
    """Delete a profile"""
    try:
        # Check if profile exists
        profile = await get_profile(profile_id)
        if not profile:
            return False
        
        # Delete profile from ChromaDB
        collection = await get_profile_collection()
        collection.delete(ids=[profile_id])
        
        # Delete profile settings
        settings_collection = await get_settings_collection()
        settings_collection.delete(ids=[f"settings_{profile_id}"])
        
        # If this was the default profile, set a new default
        if profile.is_default:
            profiles = await get_profiles()
            if profiles:
                await set_default_profile(profiles[0].id)
        
        return True
    except Exception as e:
        logger.error(f"Error deleting profile {profile_id}: {str(e)}")
        raise

async def set_default_profile(profile_id: str) -> None:
    """Set a profile as the default profile"""
    try:
        # Check if profile exists
        profile = await get_profile(profile_id)
        if not profile:
            raise ValueError(f"Profile with ID {profile_id} not found")
        
        # Get all profiles
        collection = await get_profile_collection()
        profiles = await get_profiles()
        
        # Update all profiles to set is_default flag
        for p in profiles:
            p.is_default = (p.id == profile_id)
            collection.upsert(
                ids=[p.id],
                metadatas=[_profile_to_metadata(p)],
                embeddings=[[0.0] * 10]
            )
    except Exception as e:
        logger.error(f"Error setting default profile {profile_id}: {str(e)}")
        raise

async def update_profile_settings(profile_id: str, settings: Dict[str, Any]) -> ProfileSettings:
    """Update settings for a profile"""
    try:
        # Get current settings
        settings_collection = await get_settings_collection()
        results = settings_collection.get(ids=[f"settings_{profile_id}"], include=["metadatas"])
        
        if not results or not results["metadatas"]:
            # Create default settings if none exist
            current_settings = ProfileSettings().dict()
        else:
            # Extract settings from metadata (exclude profile_id)
            metadata = results["metadatas"][0]
            current_settings = {k: v for k, v in metadata.items() if k != "profile_id"}
        
        # Update settings
        current_settings.update(settings)
        
        # Store updated settings
        updated_settings = ProfileSettings(**current_settings)
        settings_collection.upsert(
            ids=[f"settings_{profile_id}"],
            metadatas=[{"profile_id": profile_id, **updated_settings.dict()}],
            embeddings=[[0.0] * 10]  # Dummy embedding
        )
        
        return updated_settings
    except Exception as e:
        logger.error(f"Error updating settings for profile {profile_id}: {str(e)}")
        raise

async def get_profile_settings(profile_id: str) -> ProfileSettings:
    """Get settings for a profile"""
    try:
        settings_collection = await get_settings_collection()
        results = settings_collection.get(ids=[f"settings_{profile_id}"], include=["metadatas"])
        
        if results and results["metadatas"]:
            # Extract settings from metadata (exclude profile_id)
            metadata = results["metadatas"][0]
            settings_data = {k: v for k, v in metadata.items() if k != "profile_id"}
            return ProfileSettings(**settings_data)
        
        # Return default settings if none exist
        return ProfileSettings()
    except Exception as e:
        logger.error(f"Error fetching settings for profile {profile_id}: {str(e)}")
        raise

async def get_default_profile() -> Optional[Profile]:
    """Get the default profile"""
    try:
        profiles = await get_profiles()
        for profile in profiles:
            if profile.is_default:
                return profile
        
        # If no default profile is set but profiles exist, set the first one as default
        if profiles:
            await set_default_profile(profiles[0].id)
            return profiles[0]
        
        return None
    except Exception as e:
        logger.error(f"Error fetching default profile: {str(e)}")
        raise

async def ensure_default_profile() -> Profile:
    """Ensure that a default profile exists, creating one if necessary"""
    try:
        default_profile = await get_default_profile()
        if default_profile:
            return default_profile
        
        # Create a default profile
        new_profile = Profile(
            id=str(uuid4()),
            name="Default Profile",
            is_default=True,
            settings=ProfileSettings()
        )
        
        return await create_profile(new_profile)
    except Exception as e:
        logger.error(f"Error ensuring default profile: {str(e)}")
        raise
