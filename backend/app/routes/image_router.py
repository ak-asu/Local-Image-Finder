from fastapi import APIRouter, HTTPException, Body, Query
from fastapi.responses import FileResponse
from app.models.image_model import OpenImageRequest
from app.utils.helpers import open_image_in_native_viewer
import os
import mimetypes

router = APIRouter()

@router.get("/serve")
async def serve_image(path: str = Query(..., description="Absolute path to the image file")):
    """Serve a local image file over HTTP so Electron renderer can load it."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image file not found")
    if not os.path.isfile(path):
        raise HTTPException(status_code=400, detail="Path is not a file")
    mime, _ = mimetypes.guess_type(path)
    return FileResponse(path, media_type=mime or "image/jpeg")

@router.post("/open")
async def open_image(request: OpenImageRequest):
    """Open an image in the system's default image viewer"""
    if not os.path.exists(request.image_path):
        raise HTTPException(status_code=404, detail="Image file not found")
        
    success = open_image_in_native_viewer(request.image_path)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to open image in system viewer")
        
    return {"success": True, "path": request.image_path}
