from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query, Body, Path
from typing import List, Optional, Dict, Any
import json
import base64
import os
import uuid
import tempfile
import io
from PIL import Image
from app.models.search_model import SearchParams, SearchResponse
from app.services.search_service import (
    get_image_details, process_search_query
)

router = APIRouter()

@router.post("/query", response_model=SearchResponse)
async def process_query(search_params: SearchParams):
    """Process a search query with text and/or images"""
    try:
        # Validate request
        if not search_params.query_text and not search_params.image_file and not search_params.image_path:
            raise HTTPException(status_code=400, detail="Either query text, image file, or image path must be provided")
        
        # Process query
        image_paths = []
        if search_params.image_path:
            image_paths.append(search_params.image_path)
        
        # If base64 image is provided, decode and save temporarily
        temp_image_path = None
        if search_params.image_file:
            # Decode base64 image
            if "," in search_params.image_file:  # Remove data URL prefix if present
                search_params.image_file = search_params.image_file.split(",", 1)[1]
            
            image_data = base64.b64decode(search_params.image_file)
            image = Image.open(io.BytesIO(image_data))
            
            # Save to temp file
            temp_dir = tempfile.gettempdir()
            temp_image_path = os.path.join(temp_dir, f"search_image_{uuid.uuid4()}.jpg")
            image.save(temp_image_path)
            image_paths.append(temp_image_path)
        
        # Process the search query
        results = await process_search_query(
            profile_id=search_params.profile_id,
            query_text=search_params.query_text,
            image_paths=image_paths if image_paths else None,
            limit=search_params.limit
        )
        
        # Clean up temp file if created
        if temp_image_path and os.path.exists(temp_image_path):
            os.remove(temp_image_path)
        
        # Format response
        if "error" in results:
            raise HTTPException(status_code=500, detail=results["error"])
        
        # Split results into primary and related
        all_results = results.get("results", [])
        primary_count = min(5, len(all_results))
        primary_results = all_results[:primary_count]
        related_results = all_results[primary_count:]
        
        return SearchResponse(
            primary_results=primary_results,
            related_results=related_results,
            query=results.get("query", {}),
            session_id=results.get("chat_id")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@router.get("/properties/{image_id}")
async def get_image_properties_by_id(
    image_id: str = Path(..., description="The ID of the image"), 
    profile_id: str = Query(..., description="The profile ID")
):
    """Get detailed properties of an image by ID"""
    try:
        image_details = await get_image_details(profile_id, image_id)
        if not image_details:
            raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found")
        return image_details
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving image properties: {str(e)}")

@router.get("/properties")
async def get_image_properties_by_path(
    path: str = Query(..., description="Path to the image file"),
    profile_id: str = Query(..., description="The profile ID")
):
    """Get detailed properties of an image by path"""
    try:
        from app.services.indexing_service import extract_image_metadata
        
        # Check if file exists
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail=f"Image at path {path} not found")
        
        # Extract metadata directly
        metadata = extract_image_metadata(path)
        return metadata
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving image properties: {str(e)}")
