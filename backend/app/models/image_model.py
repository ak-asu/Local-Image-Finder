from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import os

class ImageMetadata(BaseModel):
    """Metadata extracted from an image file including EXIF data"""
    filename: str
    filepath: str
    filesize: int
    width: Optional[int] = None
    height: Optional[int] = None
    creation_date: Optional[datetime] = None
    modified_date: Optional[datetime] = None
    exif: Optional[Dict[str, Any]] = None
    
    @property
    def exists(self) -> bool:
        """Check if the image file still exists on disk"""
        return os.path.exists(self.filepath)

class Image(BaseModel):
    """Represents an image with its metadata and vector embedding"""
    id: str
    metadata: ImageMetadata
    embedding_id: str
    last_indexed: datetime = Field(default_factory=datetime.now)
    
    class Config:
        arbitrary_types_allowed = True

class ImageSearchResult(BaseModel):
    """Represents a search result with similarity score"""
    image: Image
    similarity_score: float  # Between 0 and 1, with 1 being exact match
    exists: bool = True      # Flag to indicate if the image still exists on disk
