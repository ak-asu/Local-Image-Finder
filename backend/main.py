from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from app.routes import search_router, library_router, albums_router, settings_router, profiles_router
from app.utils.database import initialize_database
from app.services.indexing_service import start_indexing_scheduler

app = FastAPI(title="Local Image Finder API")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return {"message": "Local Image Finder API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
