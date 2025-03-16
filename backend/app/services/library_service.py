from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from app.models.session_model import Session, SearchQuery
from app.utils.database import get_sessions_collection, get_profile_collection

logger = logging.getLogger(__name__)

async def get_sessions(
    profile_id: str,
    skip: int = 0,
    limit: int = 50,
    search_term: Optional[str] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc"
) -> List[Session]:
    """Get all search sessions for a user profile with filtering and sorting"""
    collection = await get_sessions_collection()
    
    # Build query
    query = {"profile_id": profile_id}
    
    # Add search term filter if provided
    if search_term:
        query["$or"] = [
            {"name": {"$regex": search_term, "$options": "i"}},
            {"queries.text": {"$regex": search_term, "$options": "i"}}
        ]
    
    # Set sort order
    sort_direction = -1 if sort_order.lower() == "desc" else 1
    sort_options = {sort_by: sort_direction}
    
    # Execute query
    cursor = collection.find(query).sort(sort_options).skip(skip).limit(limit)
    sessions_data = await cursor.to_list(length=limit)
    
    # Convert to model objects
    sessions = [Session(**session_data) for session_data in sessions_data]
    return sessions

async def get_session(profile_id: str, session_id: str) -> Optional[Session]:
    """Get a specific search session"""
    collection = await get_sessions_collection()
    session_data = await collection.find_one({"profile_id": profile_id, "id": session_id})
    
    if session_data:
        return Session(**session_data)
    return None

async def create_session(profile_id: str, session: Session) -> Session:
    """Create a new search session"""
    collection = await get_sessions_collection()
    
    # Set profile_id if not already set
    if not session.profile_id:
        session.profile_id = profile_id
    
    # Generate name if not provided
    if not session.name and session.queries:
        session.name = session.get_preview_text()
    
    session_dict = session.dict()
    await collection.insert_one(session_dict)
    
    return session

async def update_session(profile_id: str, session_id: str, updates: Dict[str, Any]) -> Optional[Session]:
    """Update an existing search session"""
    collection = await get_sessions_collection()
    
    # Add updated_at timestamp
    updates["updated_at"] = datetime.now()
    
    result = await collection.find_one_and_update(
        {"profile_id": profile_id, "id": session_id},
        {"$set": updates},
        return_document=True
    )
    
    if result:
        return Session(**result)
    return None

async def delete_session(profile_id: str, session_id: str) -> bool:
    """Delete a search session"""
    collection = await get_sessions_collection()
    result = await collection.delete_one({"profile_id": profile_id, "id": session_id})
    return result.deleted_count > 0

async def save_search_query(profile_id: str, query: SearchQuery, result_ids: List[str]) -> Session:
    """Save a search query to history and create or update a session"""
    collection = await get_sessions_collection()
    
    # Check if there's an active session for this profile
    active_session = await collection.find_one(
        {"profile_id": profile_id},
        sort=[("updated_at", -1)]
    )
    
    if active_session and (datetime.now() - active_session["updated_at"]).total_seconds() < 3600:
        # Update existing session if less than an hour old
        session = Session(**active_session)
        session.queries.append(query)
        session.result_ids.extend(result_ids)
        session.updated_at = datetime.now()
        
        await collection.update_one(
            {"id": session.id},
            {"$set": {
                "queries": [q.dict() for q in session.queries],
                "result_ids": session.result_ids,
                "updated_at": session.updated_at
            }}
        )
    else:
        # Create a new session
        session = Session(
            profile_id=profile_id,
            queries=[query],
            result_ids=result_ids
        )
        
        # Generate name from query
        session.name = session.get_preview_text()
        
        await collection.insert_one(session.dict())
    
    return session
