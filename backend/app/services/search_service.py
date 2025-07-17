from typing import List, Optional, Dict, Any, Union, Tuple
import os
import tempfile
import numpy as np
from PIL import Image as PILImage
from io import BytesIO
from datetime import datetime
import logging
from app.models.image_model import Image, ImageMetadata, ImageSearchResult
from backend.app.models.profiles_model import ModelType
from app.utils.database import get_chroma_collection, get_settings_collection, get_profile_collection
from app.utils.embeddings import (
    get_text_embedding_model, get_image_embedding_model,
    generate_text_embedding, generate_image_embedding, 
    combine_embeddings
)
from app.services.indexing_service import check_for_new_images
from app.database.image_repository import ImageRepository
from app.database.chat_repository import ChatRepository

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

async def search_by_text(profile_id: str, query_text: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Search for images using a text query"""
    try:
        # Always check for new images before search
        await check_for_new_images(profile_id)
        
        # Generate embedding for the text query
        embedding = await generate_text_embedding(query_text)
        
        # Use the repository for consistent access
        image_repo = ImageRepository(profile_id)
        results = image_repo.search_by_embedding(embedding, limit)
        
        # Verify images still exist
        verified_results = []
        for result in results:
            image_path = result.get("path", "")
            if os.path.exists(image_path):
                result["exists"] = True
                verified_results.append(result)
            else:
                result["exists"] = False
                verified_results.append(result)
        
        logger.info(f"Text search found {len(verified_results)} results for profile {profile_id}")
        return verified_results
        
    except Exception as e:
        logger.error(f"Error searching by text: {str(e)}")
        return []

async def search_by_image(profile_id: str, image_path: str, limit: int = 20) -> List[Dict[str, Any]]:
    """Search for similar images to a provided image"""
    try:
        # Always check for new images before search
        await check_for_new_images(profile_id)
        
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        # Generate embedding for the image
        from PIL import Image as PILImage
        with PILImage.open(image_path) as img:
            embedding = await generate_image_embedding(img)
        
        # Use the repository for search
        image_repo = ImageRepository(profile_id)
        results = image_repo.search_by_embedding(embedding, limit)
        
        # Verify images still exist
        verified_results = []
        for result in results:
            result_path = result.get("path", "")
            if os.path.exists(result_path):
                result["exists"] = True
                verified_results.append(result)
            else:
                result["exists"] = False
                verified_results.append(result)
        
        logger.info(f"Image search found {len(verified_results)} results for profile {profile_id}")
        return verified_results
        
    except Exception as e:
        logger.error(f"Error searching by image: {str(e)}")
        return []

async def process_search_query(profile_id: str, query_text: Optional[str] = None, 
                              image_paths: Optional[List[str]] = None,
                              limit: int = 20) -> Dict[str, Any]:
    """Process a search query with text and/or images and save to chat history"""
    try:
        # Create a new chat session
        chat_repo = ChatRepository(profile_id)
        chat_id = chat_repo.create_chat(title=query_text[:30] if query_text else "Image Search")
        
        if not chat_id:
            logger.error("Failed to create chat session")
            return {"error": "Failed to create chat session"}
        
        # Create query content
        query_content = {}
        if query_text:
            query_content["text"] = query_text
        if image_paths:
            query_content["image_paths"] = image_paths
            
        # Save query to chat
        embedding = None
        if query_text:
            embedding = await generate_text_embedding(query_text)
            
        message_id = chat_repo.add_message(chat_id, "query", query_content, embedding)
        
        # Process query and get results
        results = []
        if query_text:
            text_results = await search_by_text(profile_id, query_text, limit)
            results.extend(text_results)
        
        if image_paths:
            for image_path in image_paths:
                if os.path.exists(image_path):
                    image_results = await search_by_image(profile_id, image_path, limit)
                    results.extend(image_results)
        
        # Remove duplicates based on ID
        unique_results = {}
        for result in results:
            if result["id"] not in unique_results:
                unique_results[result["id"]] = result
        
        final_results = list(unique_results.values())
        
        # Save results to chat
        result_content = {
            "results": final_results[:limit],  # Limit the number of results
            "query": query_content
        }
        
        chat_repo.add_message(chat_id, "result", result_content)
        
        logger.info(f"Search query processed for profile {profile_id}, chat {chat_id}")
        
        return {
            "chat_id": chat_id,
            "results": final_results[:limit],
            "query": query_content,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error processing search query: {str(e)}")
        return {"error": str(e)}

async def get_image_details(profile_id: str, image_id: str) -> Dict[str, Any]:
    """Get detailed information about a specific image"""
    try:
        # Use the repository for consistent access
        image_repo = ImageRepository(profile_id)
        
        # Get image by ID
        result = image_repo.collection.get(ids=[image_id], include=["metadatas"])
        
        if not result or not result["ids"]:
            logger.warning(f"Image with ID {image_id} not found")
            return {}
        
        metadata = result["metadatas"][0]
        image_path = metadata.get("filepath", "")
        
        # Check if image still exists
        exists = os.path.exists(image_path) if image_path else False
        
        return {
            "id": image_id,
            "metadata": metadata,
            "path": image_path,
            "exists": exists
        }
        
    except Exception as e:
        logger.error(f"Error getting image details: {str(e)}")
        return {}
