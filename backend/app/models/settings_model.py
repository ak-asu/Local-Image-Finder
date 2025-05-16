from typing import List, Optional, Dict
from pydantic import BaseModel
from app.models.profiles_model import ThemeMode, ModelType

class SettingsUpdate(BaseModel):
    similar_image_count: Optional[int] = None
    monitored_folders: Optional[List[str]] = None
    theme_mode: Optional[ThemeMode] = None
    custom_theme_colors: Optional[Dict[str, str]] = None
    similarity_threshold: Optional[float] = None
    nlp_model: Optional[ModelType] = None
    vlm_model: Optional[ModelType] = None
    auto_index_interval_minutes: Optional[int] = None

class FolderValidationRequest(BaseModel):
    folders: List[str]