from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum

class ThemeMode(str, Enum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"

class ModelType(str, Enum):
    DEFAULT = "default"
    PERFORMANCE = "performance"
    QUALITY = "quality"

class ProfileSettings(BaseModel):
    """Settings specific to a user profile"""
    similar_image_count: int = 20
    monitored_folders: List[str] = []
    theme_mode: ThemeMode = ThemeMode.SYSTEM
    custom_theme_colors: Optional[Dict[str, str]] = None
    similarity_threshold: float = 0.7  # Between 0 and 1
    nlp_model: ModelType = ModelType.DEFAULT
    vlm_model: ModelType = ModelType.DEFAULT
    auto_index_interval_minutes: int = 60  # How often to scan for new images
    last_indexed: Optional[datetime] = None

class Profile(BaseModel):
    """User profile containing preferences and settings"""
    id: str
    name: str
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    last_accessed: datetime = Field(default_factory=datetime.now)
    settings: ProfileSettings = Field(default_factory=ProfileSettings)
    is_default: bool = False
