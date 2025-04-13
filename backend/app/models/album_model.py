from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from uuid import uuid4

class AlbumType(str, Enum):
    """Types of albums"""
    MANUAL = "manual"     # Manually created by user
    AUTO = "auto"         # Created automatically from search results
    RECOMMENDED = "recommended"  # Recommended by the application

class AlbumImage(BaseModel):
    """Image in an album with order information"""
    image_id: str
    order: int = 0  # For maintaining order within album
    added_at: datetime = Field(default_factory=datetime.now)

class Album(BaseModel):
    """Represents an album (collection of images)"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: Optional[str] = None
    profile_id: str
    type: AlbumType = AlbumType.MANUAL
    search_query: Optional[str] = None  # Original query if created from search
    images: List[AlbumImage] = []
    cover_image_id: Optional[str] = None  # ID of image to use as cover
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    def get_preview_image_ids(self, count: int = 4) -> List[str]:
        """Get IDs of preview images for UI display"""
        return [img.image_id for img in self.images[:count]]
