import os
import uuid
import hashlib
import asyncio
import logging
import time
from datetime import datetime
from typing import List, Dict, Any, Set, Optional, Tuple
from PIL import Image as PILImage
from PIL.ExifTags import TAGS
import chromadb
from app.utils.database import get_chroma_collection, get_settings_collection
from app.utils.embeddings import generate_image_embedding
from app.services.profile_service import get_profiles

logger = logging.getLogger(__name__)

# Global variable to track indexing state
indexing_tasks = {}
indexing_lock = asyncio.Lock()

def extract_image_metadata(image_path: str) -> Dict[str, Any]:
    """Extract metadata from an image file"""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    stats = os.stat(image_path)
    filename = os.path.basename(image_path)
    
    # Basic file metadata
    metadata = {
        "filename": filename,
        "filepath": image_path,
        "filesize": stats.st_size,
        "creation_date": datetime.fromtimestamp(stats.st_ctime).isoformat(),
        "modified_date": datetime.fromtimestamp(stats.st_mtime).isoformat(),
    }
    
    try:
        # Extract image specific metadata
        with PILImage.open(image_path) as img:
            metadata["width"] = img.width
            metadata["height"] = img.height
            
            # Extract EXIF data if available
            exif_data = {}
            if hasattr(img, '_getexif') and img._getexif():
                exif_info = img._getexif()
                if exif_info:
                    for tag, value in exif_info.items():
                        tag_name = TAGS.get(tag, tag)
                        exif_data[str(tag_name)] = str(value)
            
            if exif_data:
                metadata["exif"] = exif_data
    except Exception as e:
        logger.warning(f"Error extracting metadata from {image_path}: {str(e)}")
    
    return metadata

async def index_image(image_path: str, collection) -> Tuple[str, Dict[str, Any]]:
    """Process a single image and add to ChromaDB"""
    # Generate a unique ID for this image
    image_hash = hashlib.md5(image_path.encode()).hexdigest()
    image_id = f"img_{image_hash}"
    
    # Extract metadata
    metadata = extract_image_metadata(image_path)
    metadata["last_indexed"] = datetime.now().isoformat()
    
    try:
        # Generate embedding
        with PILImage.open(image_path) as img:
            embedding = await generate_image_embedding(img)
        
        # Store in ChromaDB
        collection.upsert(
            ids=[image_id],
            embeddings=[embedding],
            metadatas=[metadata]
        )
        
        logger.debug(f"Indexed image: {image_path}")
        return image_id, metadata
    
    except Exception as e:
        logger.error(f"Failed to index image {image_path}: {str(e)}")
        raise

async def scan_directory(directory: str, collection, processed_paths: Set[str]) -> List[str]:
    """Scan a directory for images and index them"""
    indexed_files = []
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'}
    
    try:
        for root, _, files in os.walk(directory):
            for file in files:
                if os.path.splitext(file)[1].lower() in image_extensions:
                    full_path = os.path.abspath(os.path.join(root, file))
                    
                    # Skip already processed files
                    if full_path in processed_paths:
                        continue
                    
                    try:
                        image_id, _ = await index_image(full_path, collection)
                        indexed_files.append(image_id)
                        processed_paths.add(full_path)
                    except Exception as e:
                        logger.error(f"Error indexing {full_path}: {str(e)}")
    except Exception as e:
        logger.error(f"Error scanning directory {directory}: {str(e)}")
    
    return indexed_files

async def check_for_new_images(profile_id: str, force: bool = False) -> List[str]:
    """Check monitored folders for new images and index them"""
    global indexing_tasks
    
    # Don't start new indexing if already in progress for this profile
    if profile_id in indexing_tasks and indexing_tasks[profile_id].get('running', False) and not force:
        logger.info(f"Indexing already in progress for profile {profile_id}")
        return []
    
    # Set indexing state
    async with indexing_lock:
        indexing_tasks[profile_id] = {'running': True, 'start_time': time.time()}
    
    try:
        # Get monitored folders from profile settings
        settings_collection = await get_settings_collection(profile_id)
        settings = await settings_collection.find_one({"profile_id": profile_id})
        
        if not settings or "monitored_folders" not in settings:
            logger.warning(f"No monitored folders found for profile {profile_id}")
            return []
        
        monitored_folders = settings.get("monitored_folders", [])
        if not monitored_folders:
            logger.info(f"No folders to monitor for profile {profile_id}")
            return []
        
        # Get the images collection
        collection = await get_chroma_collection(f"{profile_id}_images")
        
        # Get all existing image paths
        existing_results = collection.get(include=["metadatas"])
        processed_paths = set()
        if existing_results and "metadatas" in existing_results:
            for metadata in existing_results["metadatas"]:
                if "filepath" in metadata:
                    processed_paths.add(metadata["filepath"])
        
        # Scan each monitored folder
        indexed_files = []
        for folder in monitored_folders:
            if not os.path.exists(folder) or not os.path.isdir(folder):
                logger.warning(f"Folder does not exist or is not accessible: {folder}")
                continue
            
            logger.info(f"Scanning folder: {folder}")
            folder_files = await scan_directory(folder, collection, processed_paths)
            indexed_files.extend(folder_files)
        
        # Update last indexed timestamp
        if settings:
            current_time = datetime.now()
            await settings_collection.update_one(
                {"profile_id": profile_id},
                {"$set": {"last_indexed": current_time.isoformat()}}
            )
        
        logger.info(f"Indexing completed for profile {profile_id}. Indexed {len(indexed_files)} new files.")
        return indexed_files
    
    except Exception as e:
        logger.error(f"Error during indexing for profile {profile_id}: {str(e)}")
        return []
    
    finally:
        # Reset indexing state
        async with indexing_lock:
            if profile_id in indexing_tasks:
                indexing_tasks[profile_id]['running'] = False
                indexing_tasks[profile_id]['end_time'] = time.time()

async def index_all_profiles():
    """Run indexing for all profiles"""
    profiles = await get_profiles()
    
    for profile in profiles:
        logger.info(f"Starting indexing for profile: {profile.name} ({profile.id})")
        await check_for_new_images(profile.id)

def start_indexing_scheduler():
    """Start a background task that periodically checks for new images"""
    async def indexing_task():
        while True:
            try:
                await index_all_profiles()
            except Exception as e:
                logger.error(f"Error in indexing scheduler: {str(e)}")
            
            # Sleep for an hour before next check
            await asyncio.sleep(3600)  # 1 hour
    
    # Start background task
    asyncio.create_task(indexing_task())
    logger.info("Started background indexing scheduler")
