from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
from typing import List, Optional
import json
from app.models.image_model import ImageSearchResult
from app.models.session_model import SearchQuery
from app.services.search_service import search_by_text, search_by_image, search_combined
from app.services.library_service import save_search_query

router = APIRouter()

@router.post("/text", response_model=List[ImageSearchResult])
async def text_search(
    query: str = Form(...),
    profile_id: str = Form(...),
    limit: int = Form(20),
    save_to_history: bool = Form(True)
):
    """Search for images using a text query"""
    try:
        results = await search_by_text(query, profile_id, limit)
        
        if save_to_history:
            search_query = SearchQuery(text=query)
            await save_search_query(profile_id, search_query, [r.image.id for r in results])
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@router.post("/image", response_model=List[ImageSearchResult])
async def image_search(
    file: UploadFile = File(...),
    profile_id: str = Form(...),
    limit: int = Form(20),
    save_to_history: bool = Form(True)
):
    """Search for similar images by uploading an image"""
    try:
        image_content = await file.read()
        results = await search_by_image(image_content, profile_id, limit)
        
        if save_to_history:
            # We don't save the uploaded image, just record that an image search was performed
            search_query = SearchQuery(image_paths=["[uploaded image]"])
            await save_search_query(profile_id, search_query, [r.image.id for r in results])
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image search error: {str(e)}")

@router.post("/combined", response_model=List[ImageSearchResult])
async def combined_search(
    text: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    profile_id: str = Form(...),
    limit: int = Form(20),
    save_to_history: bool = Form(True)
):
    """Search using both text and image inputs"""
    if not text and not files:
        raise HTTPException(status_code=400, detail="Either text or image(s) must be provided")
    
    try:
        image_contents = []
        if files:
            for file in files:
                image_contents.append(await file.read())
        
        results = await search_combined(text, image_contents, profile_id, limit)
        
        if save_to_history:
            search_query = SearchQuery(
                text=text,
                image_paths=["[uploaded image]" for _ in files] if files else None
            )
            await save_search_query(profile_id, search_query, [r.image.id for r in results])
            
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Combined search error: {str(e)}")
