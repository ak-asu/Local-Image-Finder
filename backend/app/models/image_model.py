from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import os

class ImageMetadata(BaseModel):
    """Metadata extracted from image files"""
    filename: str
    filepath: str
    filesize: int
    width: Optional[int] = None
    height: Optional[int] = None
    creation_date: Optional[str] = None
    modified_date: Optional[str] = None
    exif: Optional[Dict[str, Any]] = None
    
    @property
    def exists(self) -> bool:
        """Check if the image file still exists"""
        return os.path.exists(self.filepath)

class Image(BaseModel):
    """Represents an indexed image"""
    id: str
    metadata: ImageMetadata
    embedding_id: Optional[str] = None  # ID of the embedding in ChromaDB
    last_indexed: datetime = Field(default_factory=datetime.now)

class ImageSearchResult(BaseModel):
    """Search result with image and similarity score"""
    image: Image
    similarity_score: float  # 0.0 to 1.0 where 1.0 is perfect match
    exists: bool = True  # Whether the file still exists

class OpenImageRequest(BaseModel):
    image_path: str