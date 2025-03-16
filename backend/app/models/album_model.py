from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum
from uuid import uuid4

class AlbumType(str, Enum):
    MANUAL = "manual"           # User created album
    AUTO = "auto"               # Auto-generated from saved sessions
    RECOMMENDED = "recommended" # System recommended based on user behavior

class AlbumImage(BaseModel):
    """Represents an image in an album with optional custom order"""
    image_id: str
    order: int  # For custom ordering within the album
    added_at: datetime = Field(default_factory=datetime.now)

class Album(BaseModel):
    """Represents a collection of images grouped into an album"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: Optional[str] = None
    cover_image_id: Optional[str] = None
    profile_id: str
    type: AlbumType
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    search_query: Optional[str] = None  # Original search query if auto-generated
    images: List[AlbumImage] = []
    
    @property
    def image_count(self) -> int:
        return len(self.images)
