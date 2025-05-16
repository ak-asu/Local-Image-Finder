from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
from uuid import uuid4

class ThemeMode(str, Enum):
    """Theme mode options"""
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"

class ModelType(str, Enum):
    """AI model quality options"""
    PERFORMANCE = "performance"  # Faster but lower quality
    DEFAULT = "default"          # Balanced
    QUALITY = "quality"          # Higher quality but slower

class ProfileSettings(BaseModel):
    """User profile settings"""
    similar_image_count: int = 20
    monitored_folders: List[str] = []
    theme_mode: ThemeMode = ThemeMode.SYSTEM
    custom_theme_colors: Dict[str, str] = Field(default_factory=dict)
    similarity_threshold: float = 0.7  # Threshold for considering images similar (0-1)
    nlp_model: ModelType = ModelType.DEFAULT
    vlm_model: ModelType = ModelType.DEFAULT
    auto_index_interval_minutes: int = 60  # How often to check for new images

class Profile(BaseModel):
    """User profile"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    avatar: Optional[str] = None
    is_default: bool = False
    settings: ProfileSettings = Field(default_factory=ProfileSettings)
    created_at: datetime = Field(default_factory=datetime.now)
    last_accessed: datetime = Field(default_factory=datetime.now)

class ProfileCreate(BaseModel):
    name: str
    avatar: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None