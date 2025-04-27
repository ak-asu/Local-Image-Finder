from fastapi import APIRouter, HTTPException, Query, Body, Path
from typing import List, Optional, Dict
from pydantic import BaseModel
from app.models.album_model import Album, AlbumImage, AlbumType
from app.services.album_service import (
    get_albums, get_album, create_album, update_album, delete_album,
    add_image_to_album, remove_image_from_album, reorder_album_images,
    create_album_from_session
)

router = APIRouter()

class AlbumCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: AlbumType = AlbumType.MANUAL
    search_query: Optional[str] = None
    cover_image_id: Optional[str] = None
    result_limit: Optional[int] = None
    folders_to_search: Optional[List[str]] = None

class AlbumUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cover_image_id: Optional[str] = None

class ImageOrder(BaseModel):
    image_id: str
    order: int

@router.get("/{profile_id}", response_model=List[Album])
async def list_albums(
    profile_id: str,
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

@router.get("/{profile_id}/{album_id}", response_model=Album)
async def get_album_detail(profile_id: str, album_id: str):
    """Get details of a specific album"""
    album = await get_album(profile_id, album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album

@router.post("/{profile_id}", response_model=Album)
async def create_new_album(profile_id: str, album_data: AlbumCreate):
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

@router.patch("/{profile_id}/{album_id}", response_model=Album)
async def update_album_details(
    profile_id: str, 
    album_id: str, 
    updates: dict = Body(...)
):
    """Update album details"""
    album = await get_album(profile_id, album_id)
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    updated_album = await update_album(profile_id, album_id, updates)
    return updated_album

@router.delete("/{profile_id}/{album_id}")
async def delete_album_endpoint(profile_id: str, album_id: str):
    """Delete an album"""
    success = await delete_album(profile_id, album_id)
    if not success:
        raise HTTPException(status_code=404, detail="Album not found")
    return album_id

@router.post("/{profile_id}/{album_id}/images/{image_id}")
async def add_image(profile_id: str, album_id: str, image_id: str):
    """Add an image to an album"""
    try:
        updated_album = await add_image_to_album(profile_id, album_id, image_id)
        return updated_album.dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add image: {str(e)}")

@router.delete("/{profile_id}/{album_id}/images/{image_id}")
async def remove_image(profile_id: str, album_id: str, image_id: str):
    """Remove an image from an album"""
    try:
        updated_album = await remove_image_from_album(profile_id, album_id, image_id)
        return updated_album.dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove image: {str(e)}")

@router.put("/{profile_id}/{album_id}/order")
async def reorder_images(profile_id: str, album_id: str, orders: List[ImageOrder]):
    """Reorder images in an album"""
    try:
        image_orders = {item.image_id: item.order for item in orders}
        updated_album = await reorder_album_images(profile_id, album_id, image_orders)
        return updated_album.dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reorder images: {str(e)}")
