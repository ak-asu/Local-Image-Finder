from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import logging
from app.models.album_model import Album, AlbumImage, AlbumType
from app.services.search_service import search_by_text
from app.utils.database import get_albums_collection

logger = logging.getLogger(__name__)

async def get_albums(
    profile_id: str,
    skip: int = 0,
    limit: int = 50,
    search_term: Optional[str] = None,
    album_type: Optional[AlbumType] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc"
) -> List[Album]:
    """Get all albums for a user profile with filtering and sorting"""
    collection = await get_albums_collection()
    
    # Build query
    query = {"profile_id": profile_id}
    
    # Add album type filter if provided
    if album_type:
        query["type"] = album_type
    
    # Add search term filter if provided
    if search_term:
        query["$or"] = [
            {"name": {"$regex": search_term, "$options": "i"}},
            {"description": {"$regex": search_term, "$options": "i"}},
            {"search_query": {"$regex": search_term, "$options": "i"}}
        ]
    
    # Set sort order
    sort_direction = -1 if sort_order.lower() == "desc" else 1
    sort_options = {sort_by: sort_direction}
    
    # Execute query
    cursor = collection.find(query).sort(sort_options).skip(skip).limit(limit)
    albums_data = await cursor.to_list(length=limit)
    
    # Convert to model objects
    albums = [Album(**album_data) for album_data in albums_data]
    return albums

async def get_album(profile_id: str, album_id: str) -> Optional[Album]:
    """Get a specific album"""
    collection = await get_albums_collection()
    album_data = await collection.find_one({"profile_id": profile_id, "id": album_id})
    
    if album_data:
        return Album(**album_data)
    return None

async def create_album(profile_id: str, album: Album) -> Album:
    """Create a new album"""
    collection = await get_albums_collection()
    
    # Set profile_id if not already set
    if not album.profile_id:
        album.profile_id = profile_id
    
    album_dict = album.dict()
    await collection.insert_one(album_dict)
    
    return album

async def update_album(profile_id: str, album_id: str, updates: Dict[str, Any]) -> Optional[Album]:
    """Update an existing album"""
    collection = await get_albums_collection()
    
    # Add updated_at timestamp
    updates["updated_at"] = datetime.now()
    
    result = await collection.find_one_and_update(
        {"profile_id": profile_id, "id": album_id},
        {"$set": updates},
        return_document=True
    )
    
    if result:
        return Album(**result)
    return None

async def delete_album(profile_id: str, album_id: str) -> bool:
    """Delete an album"""
    collection = await get_albums_collection()
    result = await collection.delete_one({"profile_id": profile_id, "id": album_id})
    return result.deleted_count > 0

async def add_image_to_album(profile_id: str, album_id: str, image_id: str) -> Album:
    """Add an image to an album"""
    collection = await get_albums_collection()
    album_data = await collection.find_one({"profile_id": profile_id, "id": album_id})
    
    if not album_data:
        raise ValueError("Album not found")
    
    album = Album(**album_data)
    
    # Check if image already exists in album
    if any(img.image_id == image_id for img in album.images):
        return album  # Image already exists
    
    # Find the highest order to place new image at the end
    max_order = 0
    if album.images:
        max_order = max(img.order for img in album.images)
    
    # Add image
    album_image = AlbumImage(image_id=image_id, order=max_order + 1)
    album.images.append(album_image)
    album.updated_at = datetime.now()
    
    # If this is the first image, set it as cover image
    if len(album.images) == 1 and not album.cover_image_id:
        album.cover_image_id = image_id
    
    # Update in database
    await collection.update_one(
        {"id": album_id},
        {"$set": {
            "images": [img.dict() for img in album.images],
            "cover_image_id": album.cover_image_id,
            "updated_at": album.updated_at
        }}
    )
    
    return album

async def remove_image_from_album(profile_id: str, album_id: str, image_id: str) -> Album:
    """Remove an image from an album"""
    collection = await get_albums_collection()
    album_data = await collection.find_one({"profile_id": profile_id, "id": album_id})
    
    if not album_data:
        raise ValueError("Album not found")
    
    album = Album(**album_data)
    
    # Remove image
    album.images = [img for img in album.images if img.image_id != image_id]
    album.updated_at = datetime.now()
    
    # If removed image was the cover image, set a new cover image
    if album.cover_image_id == image_id:
        album.cover_image_id = album.images[0].image_id if album.images else None
    
    # Update in database
    await collection.update_one(
        {"id": album_id},
        {"$set": {
            "images": [img.dict() for img in album.images],
            "cover_image_id": album.cover_image_id,
            "updated_at": album.updated_at
        }}
    )
    
    return album

async def reorder_album_images(profile_id: str, album_id: str, image_orders: Dict[str, int]) -> Album:
    """Reorder images in an album"""
    collection = await get_albums_collection()
    album_data = await collection.find_one({"profile_id": profile_id, "id": album_id})
    
    if not album_data:
        raise ValueError("Album not found")
    
    album = Album(**album_data)
    
    # Update orders
    for img in album.images:
        if img.image_id in image_orders:
            img.order = image_orders[img.image_id]
    
    # Sort by order
    album.images.sort(key=lambda x: x.order)
    album.updated_at = datetime.now()
    
    # Update in database
    await collection.update_one(
        {"id": album_id},
        {"$set": {
            "images": [img.dict() for img in album.images],
            "updated_at": album.updated_at
        }}
    )
    
    return album

async def create_album_from_session(
    profile_id: str,
    name: str,
    search_query: str,
    description: Optional[str] = None,
    result_limit: Optional[int] = 20,
    folders_to_search: Optional[List[str]] = None
) -> Album:
    """Create an album from a search query"""
    # Perform search
    search_results = await search_by_text(search_query, profile_id, limit=result_limit or 20)
    
    # Create album
    album = Album(
        name=name,
        description=description,
        profile_id=profile_id,
        type=AlbumType.AUTO,
        search_query=search_query,
        images=[]
    )
    
    # Add images to album
    for i, result in enumerate(search_results):
        album_image = AlbumImage(image_id=result.image.id, order=i)
        album.images.append(album_image)
    
    # Set cover image if available
    if album.images:
        album.cover_image_id = album.images[0].image_id
    
    # Save album to database
    collection = await get_albums_collection()
    await collection.insert_one(album.dict())
    
    return album
