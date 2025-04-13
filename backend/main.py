from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import os
import uuid
from pathlib import Path
from app.routes import search_router, library_router, albums_router, settings_router, profiles_router
from app.utils.database import initialize_database
from app.services.indexing_service import start_indexing_scheduler

# Initialize the FastAPI app
app = FastAPI(
    title="Local Image Finder API",
    description="API for searching and managing local images using AI",
    version="0.1.0"
)

# Add CORS middleware to allow frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(search_router.router, prefix="/api/search", tags=["search"])
app.include_router(library_router.router, prefix="/api/library", tags=["library"])
app.include_router(albums_router.router, prefix="/api/albums", tags=["albums"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(profiles_router.router, prefix="/api/profiles", tags=["profiles"])

@app.on_event("startup")
async def startup_event():
    # Initialize database connections and collections
    await initialize_database()
    # Start background indexing scheduler
    start_indexing_scheduler()

@app.get("/")
async def root():
    """Root endpoint to verify the API is running."""
    return {"message": "Local Image Finder API is running!"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
