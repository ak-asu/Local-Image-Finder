from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from uuid import uuid4

class SearchQuery(BaseModel):
    """Represents a search query with text and/or image inputs"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    text: Optional[str] = None
    image_paths: Optional[List[str]] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    model_settings: Optional[Dict[str, Any]] = None  # Store model-specific settings used for this query

class Session(BaseModel):
    """Represents a search session with queries and results"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    profile_id: str
    name: Optional[str] = None  # Auto-generated from first query if not provided
    queries: List[SearchQuery] = []
    result_ids: List[str] = []  # IDs of results stored in ChromaDB
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    def get_preview_text(self) -> str:
        """Get preview text from the first query for display in the library"""
        if not self.queries:
            return "Empty session"
        
        first_query = self.queries[0]
        if first_query.text:
            return first_query.text[:50] + ('...' if len(first_query.text) > 50 else '')
        elif first_query.image_paths:
            return f"Image search ({len(first_query.image_paths)} images)"
        else:
            return "Unknown search type"
