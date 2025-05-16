from fastapi import APIRouter, HTTPException, Query, Body, Path, Response
from typing import List, Optional
from app.models.album_model import Album, AlbumType, AlbumCreate, AlbumUpdate, AlbumImagesRequest
from app.services.album_service import (
    get_albums, get_album, create_album, update_album, delete_album,
    add_image_to_album, remove_image_from_album, reorder_album_images,
    create_album_from_session
)

router = APIRouter()

@router.get("/albums", response_model=List[Album])
async def list_all_albums(
    profile_id: str = Query(..., description="The profile ID"),
    album_type: Optional[AlbumType] = None,
    search_term: Optional[str] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    skip: int = 0, 
    limit: int = 50
):
    """Get all albums for a user profile"""
    try:
        albums = await get_albums(
            profile_id, 
            skip=skip, 
            limit=limit, 
            search_term=search_term,
            album_type=album_type,
            sort_by=sort_by,
            sort_order=sort_order
        )
        return albums
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch albums: {str(e)}")

@router.get("/albums/{id}", response_model=Album)
async def get_album_detail(
    id: str,
    profile_id: str = Query(..., description="The profile ID")
):
    """Get details of a specific album"""
    album = await get_album(profile_id, id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

@router.post("/albums", response_model=Album)
async def create_new_album(
    album_data: AlbumCreate,
    profile_id: str = Query(..., description="The profile ID")
):
    """Create a new album"""
    try:
        # If search query is provided, create album from search results
        if album_data.search_query and album_data.type == AlbumType.AUTO:
            album = await create_album_from_session(
                profile_id,
                album_data.name,
                album_data.search_query,
                description=album_data.description,
                result_limit=album_data.result_limit,
                folders_to_search=album_data.folders_to_search
            )
        else:
            # Create an empty manual album
            album = Album(
                name=album_data.name,
                description=album_data.description,
                profile_id=profile_id,
                type=album_data.type,
                cover_image_id=album_data.cover_image_id,
                search_query=album_data.search_query,
                images=[]
            )
            album = await create_album(profile_id, album)
            
        return album
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create album: {str(e)}")

@router.put("/albums/{id}", response_model=Album)
async def update_album_details(
    id: str,
    updates: AlbumUpdate,
    profile_id: str = Query(..., description="The profile ID")
):
    """Update album details"""
    album = await get_album(profile_id, id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    updated_album = await update_album(profile_id, id, updates.dict(exclude_unset=True))
    return updated_album

@router.delete("/albums/{id}")
async def delete_album_endpoint(
    id: str,
    profile_id: str = Query(..., description="The profile ID")
):
    """Delete an album"""
    success = await delete_album(profile_id, id)
    if not success:
        raise HTTPException(status_code=404, detail="Album not found")
    return {"success": True, "id": id}

@router.post("/albums/{id}/images", response_model=Album)
async def add_images(
    id: str,
    images_request: AlbumImagesRequest,
    profile_id: str = Query(..., description="The profile ID")
):
    """Add multiple images to an album"""
    try:
        album = await get_album(profile_id, id)
        if not album:
            raise HTTPException(status_code=404, detail="Album not found")
        
        # Add each image to the album
        for image_id in images_request.image_ids:
            album = await add_image_to_album(profile_id, id, image_id)
        
        return album
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add images: {str(e)}")

@router.delete("/albums/{id}/images")
async def remove_images(
    id: str,
    images_request: AlbumImagesRequest,
    profile_id: str = Query(..., description="The profile ID")
):
    """Remove multiple images from an album"""
    try:
        album = await get_album(profile_id, id)
        if not album:
            raise HTTPException(status_code=404, detail="Album not found")
        
        # Remove each image from the album
        for image_id in images_request.image_ids:
            album = await remove_image_from_album(profile_id, id, image_id)
        
        return album
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove images: {str(e)}")
