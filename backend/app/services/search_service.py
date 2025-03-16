from typing import List, Optional, Dict, Any, Union, Tuple
import os
import tempfile
import numpy as np
from PIL import Image as PILImage
from io import BytesIO
from datetime import datetime
import logging
from app.models.image_model import Image, ImageMetadata, ImageSearchResult
from app.models.user_model import ModelType
from app.utils.database import get_chroma_collection, get_settings_collection, get_profile_collection
from app.utils.embeddings import (
    get_text_embedding_model, get_image_embedding_model,
    generate_text_embedding, generate_image_embedding, 
    combine_embeddings
)
from app.services.indexing_service import check_for_new_images

logger = logging.getLogger(__name__)

async def search_by_text(query: str, profile_id: str, limit: int = 20) -> List[ImageSearchResult]:
    """Search for images using a text query"""
    # Get user settings for threshold
    settings_collection = await get_settings_collection()
    profile_settings = await settings_collection.find_one({"profile_id": profile_id})
    similarity_threshold = profile_settings.get("similarity_threshold", 0.7) if profile_settings else 0.7
    
    # Check for any new images before performing search
    await check_for_new_images(profile_id)
    
    # Generate text embedding
    embedding = await generate_text_embedding(query)
    
    # Search in ChromaDB
    collection = await get_chroma_collection("images")
    results = collection.query(
        query_embeddings=[embedding],
        n_results=limit,
        include=["metadatas", "distances"]
    )
    
    # Process results
    search_results = []
    if results and 'ids' in results and len(results['ids']) > 0:
        for i in range(len(results['ids'][0])):
            image_id = results['ids'][0][i]
            metadata = results['metadatas'][0][i]
            distance = float(results['distances'][0][i]) if 'distances' in results else 1.0
            
            # Convert distance to similarity score (1.0 is exact match, 0.0 is completely different)
            similarity_score = 1.0 - distance
            
            # Skip if below threshold
            if similarity_score < similarity_threshold:
                continue
                
            # Create ImageMetadata
            img_metadata = ImageMetadata(**metadata)
            
            # Check if file still exists
            exists = img_metadata.exists
            
            # Create Image object
            image = Image(
                id=image_id,
                metadata=img_metadata,
                embedding_id=f"embedding_{image_id}",
                last_indexed=datetime.fromisoformat(metadata.get("last_indexed", datetime.now().isoformat()))
            )
            
            # Add to results
            search_results.append(ImageSearchResult(
                image=image,
                similarity_score=similarity_score,
                exists=exists
            ))
    
    # Sort by similarity score
    search_results.sort(key=lambda x: x.similarity_score, reverse=True)
    return search_results

async def search_by_image(image_content: bytes, profile_id: str, limit: int = 20) -> List[ImageSearchResult]:
    """Search for images using an image input"""
    # Get user settings
    settings_collection = await get_settings_collection()
    profile_settings = await settings_collection.find_one({"profile_id": profile_id})
    similarity_threshold = profile_settings.get("similarity_threshold", 0.7) if profile_settings else 0.7
    
    # Check for any new images before performing search
    await check_for_new_images(profile_id)
    
    # Generate image embedding
    image = PILImage.open(BytesIO(image_content))
    embedding = await generate_image_embedding(image)
    
    # Search in ChromaDB
    collection = await get_chroma_collection("images")
    results = collection.query(
        query_embeddings=[embedding],
        n_results=limit,
        include=["metadatas", "distances"]
    )
    
    # Process results (same logic as search_by_text)
    search_results = []
    if results and 'ids' in results and len(results['ids']) > 0:
        for i in range(len(results['ids'][0])):
            image_id = results['ids'][0][i]
            metadata = results['metadatas'][0][i]
            distance = float(results['distances'][0][i]) if 'distances' in results else 1.0
            
            similarity_score = 1.0 - distance
            if similarity_score < similarity_threshold:
                continue
                
            img_metadata = ImageMetadata(**metadata)
            exists = img_metadata.exists
            
            image = Image(
                id=image_id,
                metadata=img_metadata,
                embedding_id=f"embedding_{image_id}",
                last_indexed=datetime.fromisoformat(metadata.get("last_indexed", datetime.now().isoformat()))
            )
            
            search_results.append(ImageSearchResult(
                image=image,
                similarity_score=similarity_score,
                exists=exists
            ))
    
    search_results.sort(key=lambda x: x.similarity_score, reverse=True)
    return search_results

async def search_combined(
    text: Optional[str], 
    image_contents: List[bytes], 
    profile_id: str, 
    limit: int = 20
) -> List[ImageSearchResult]:
    """Search using both text and image inputs"""
    # Get user settings
    settings_collection = await get_settings_collection()
    profile_settings = await settings_collection.find_one({"profile_id": profile_id})
    similarity_threshold = profile_settings.get("similarity_threshold", 0.7) if profile_settings else 0.7
    
    # Check for any new images before performing search
    await check_for_new_images(profile_id)
    
    # Generate embeddings
    embeddings = []
    
    if text:
        text_embedding = await generate_text_embedding(text)
        embeddings.append(text_embedding)
    
    for img_content in image_contents:
        image = PILImage.open(BytesIO(img_content))
        img_embedding = await generate_image_embedding(image)
        embeddings.append(img_embedding)
    
    # Combine embeddings if there are multiple
    if len(embeddings) > 1:
        final_embedding = combine_embeddings(embeddings)
    else:
        final_embedding = embeddings[0]
    
    # Search in ChromaDB
    collection = await get_chroma_collection("images")
    results = collection.query(
        query_embeddings=[final_embedding],
        n_results=limit,
        include=["metadatas", "distances"]
    )
    
    # Process results
    search_results = []
    if results and 'ids' in results and len(results['ids']) > 0:
        for i in range(len(results['ids'][0])):
            image_id = results['ids'][0][i]
            metadata = results['metadatas'][0][i]
            distance = float(results['distances'][0][i]) if 'distances' in results else 1.0
            
            similarity_score = 1.0 - distance
            if similarity_score < similarity_threshold:
                continue
                
            img_metadata = ImageMetadata(**metadata)
            exists = img_metadata.exists
            
            image = Image(
                id=image_id,
                metadata=img_metadata,
                embedding_id=f"embedding_{image_id}",
                last_indexed=datetime.fromisoformat(metadata.get("last_indexed", datetime.now().isoformat()))
            )
            
            search_results.append(ImageSearchResult(
                image=image,
                similarity_score=similarity_score,
                exists=exists
            ))
    
    search_results.sort(key=lambda x: x.similarity_score, reverse=True)
    
    # Split into closest matches and related
    closest_matches = search_results[:min(5, len(search_results))]
    related = search_results[min(5, len(search_results)):]
    
    # Return both groups combined
    return closest_matches + related

async def get_related_images(image_id: str, profile_id: str, limit: int = 10) -> List[ImageSearchResult]:
    """Get related images based on an existing image"""
    # Get the embedding for the image
    collection = await get_chroma_collection("images")
    results = collection.get(ids=[image_id], include=["embeddings", "metadatas"])
    
    if not results or not results["embeddings"] or len(results["embeddings"]) == 0:
        return []
    
    embedding = results["embeddings"][0]
    
    # Use embedding to find similar images
    similar_results = collection.query(
        query_embeddings=[embedding],
        n_results=limit + 1,  # +1 because the original image will be included
        include=["metadatas", "distances"]
    )
    
    # Process results (excluding the original image)
    search_results = []
    if similar_results and 'ids' in similar_results and len(similar_results['ids']) > 0:
        for i in range(len(similar_results['ids'][0])):
            result_id = similar_results['ids'][0][i]
            
            # Skip the original image
            if result_id == image_id:
                continue
                
            metadata = similar_results['metadatas'][0][i]
            distance = float(similar_results['distances'][0][i]) if 'distances' in similar_results else 1.0
            
            similarity_score = 1.0 - distance
            
            img_metadata = ImageMetadata(**metadata)
            exists = img_metadata.exists
            
            image = Image(
                id=result_id,
                metadata=img_metadata,
                embedding_id=f"embedding_{result_id}",
                last_indexed=datetime.fromisoformat(metadata.get("last_indexed", datetime.now().isoformat()))
            )
            
            search_results.append(ImageSearchResult(
                image=image,
                similarity_score=similarity_score,
                exists=exists
            ))
    
    return search_results[:limit]
