from fastapi import APIRouter, HTTPException, Path, Query, Body
from typing import List, Optional
from pydantic import BaseModel
import uuid
from app.models.session_model import Session, SearchQuery
from app.services.library_service import get_sessions, get_session, create_session, update_session, delete_session

router = APIRouter()

class SessionUpdateModel(BaseModel):
    name: Optional[str] = None

@router.get("/sessions/{profile_id}", response_model=List[Session])
async def list_sessions(
    profile_id: str,
    skip: int = 0, 
    limit: int = 50,
    search_term: Optional[str] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc"
):
    """Get all search sessions for a user profile"""
    try:
        sessions = await get_sessions(
            profile_id, 
            skip=skip, 
            limit=limit, 
            search_term=search_term,
            sort_by=sort_by,
            sort_order=sort_order
        )
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sessions: {str(e)}")

@router.get("/sessions/{profile_id}/{session_id}", response_model=Session)
async def get_session_detail(profile_id: str, session_id: str):
    """Get details of a specific search session"""
    session = await get_session(profile_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/sessions/{profile_id}", response_model=Session)
async def create_new_session(profile_id: str, session: Session):
    """Create a new search session"""
    created_session = await create_session(profile_id, session)
    return created_session

@router.patch("/sessions/{profile_id}/{session_id}", response_model=Session)
async def update_session_details(
    profile_id: str, 
    session_id: str, 
    updates: SessionUpdateModel
):
    """Update session details like name"""
    session = await get_session(profile_id, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    updated_session = await update_session(profile_id, session_id, updates.dict(exclude_none=True))
    return updated_session

@router.delete("/sessions/{profile_id}/{session_id}", response_model=dict)
async def delete_session_endpoint(profile_id: str, session_id: str):
    """Delete a search session"""
    success = await delete_session(profile_id, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "message": "Session deleted successfully"}
