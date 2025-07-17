from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional
import logging
from backend.app.models.search_model import Session, BulkDeleteRequest
from app.services.library_service import get_sessions, get_session, create_session, update_session, delete_session

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/sessions", response_model=List[Session])
async def get_all_sessions(
    profile_id: str = Query(..., description="The profile ID"),
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

@router.get("/sessions/{id}", response_model=Session)
async def get_session_detail(
    id: str,
    profile_id: str = Query(..., description="The profile ID")
):
    """Get details of a specific search session"""
    session = await get_session(profile_id, id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("/sessions", response_model=Session)
async def create_new_session(
    profile_id: str = Query(..., description="The profile ID"),
    session_data: dict = Body(...)
):
    """Create a new search session"""
    # Make sure required fields are present
    if "queries" not in session_data or "result_ids" not in session_data:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Ensure profile_id is set correctly
    session_data["profile_id"] = profile_id
    
    # Create session object
    session = Session(**session_data)
    created_session = await create_session(profile_id, session)
    return created_session

@router.put("/sessions/{id}", response_model=Session)
async def update_session_endpoint(
    id: str,
    profile_id: str = Query(..., description="The profile ID"),
    updates: dict = Body(...)
):
    """Update an existing session"""
    session = await get_session(profile_id, id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    updated_session = await update_session(profile_id, id, updates)
    return updated_session

@router.delete("/sessions/{id}")
async def delete_session_endpoint(
    id: str,
    profile_id: str = Query(..., description="The profile ID")
):
    """Delete a search session"""
    success = await delete_session(profile_id, id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "id": id}

@router.delete("/sessions")
async def bulk_delete_sessions(
    profile_id: str = Query(..., description="The profile ID"),
    delete_request: BulkDeleteRequest = Body(...)
):
    """Delete multiple sessions at once"""
    deleted_count = 0
    for session_id in delete_request.ids:
        try:
            success = await delete_session(profile_id, session_id)
            if success:
                deleted_count += 1
        except Exception as e:
            # Continue with other deletions even if one fails
            logger.error(f"Error deleting session {session_id}: {str(e)}")
    
    return {"success": True, "deleted_count": deleted_count}
