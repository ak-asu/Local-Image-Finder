from fastapi import APIRouter, HTTPException, Body
from app.models.image_model import OpenImageRequest
from app.utils.helpers import open_image_in_native_viewer
import os

router = APIRouter()

@router.post("/open")
async def open_image(request: OpenImageRequest):
    """Open an image in the system's default image viewer"""
    if not os.path.exists(request.image_path):
        raise HTTPException(status_code=404, detail="Image file not found")
        
    success = open_image_in_native_viewer(request.image_path)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to open image in system viewer")
        
    return {"success": True, "path": request.image_path}
