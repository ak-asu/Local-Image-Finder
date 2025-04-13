import os
import logging
import numpy as np
from typing import List, Dict, Any, Union, Optional
from PIL import Image
from sentence_transformers import SentenceTransformer
from transformers import CLIPProcessor, CLIPModel
import torch
from app.models.user_model import ModelType

logger = logging.getLogger(__name__)

# Models are loaded lazily when needed
_text_model = None
_image_model = None
_clip_processor = None

# Set device based on availability
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Models to use based on quality setting
TEXT_MODELS = {
    ModelType.PERFORMANCE: "all-MiniLM-L6-v2",  # Faster, smaller model
    ModelType.DEFAULT: "all-MiniLM-L6-v2",      # Default - balanced
    ModelType.QUALITY: "all-mpnet-base-v2"      # Slower but better quality
}

IMAGE_MODELS = {
    ModelType.PERFORMANCE: "openai/clip-vit-base-patch32",  # Faster
    ModelType.DEFAULT: "openai/clip-vit-base-patch32",      # Default
    ModelType.QUALITY: "openai/clip-vit-large-patch14"      # Higher quality
}

# Cache directory for downloaded models
MODELS_DIR = os.path.join(os.path.expanduser("~"), ".local-image-finder", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def get_text_embedding_model(model_type: ModelType = ModelType.DEFAULT):
    """Get or load the text embedding model"""
    global _text_model
    
    # Select model name based on quality setting
    model_name = TEXT_MODELS[model_type]
    
    if _text_model is None or _text_model.model_name != model_name:
        try:
            logger.info(f"Loading text embedding model: {model_name}")
            _text_model = SentenceTransformer(model_name, cache_folder=MODELS_DIR)
            # Store model name for future reference
            _text_model.model_name = model_name
            logger.info("Text embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading text embedding model: {str(e)}")
            raise
    return _text_model

def get_image_embedding_model(model_type: ModelType = ModelType.DEFAULT):
    """Get or load the image embedding model and processor"""
    global _image_model, _clip_processor
    
    # Select model name based on quality setting
    model_name = IMAGE_MODELS[model_type]
    
    if _image_model is None or _image_model.config._name_or_path != model_name:
        try:
            logger.info(f"Loading image embedding model: {model_name}")
            _image_model = CLIPModel.from_pretrained(model_name, cache_dir=MODELS_DIR).to(DEVICE)
            _clip_processor = CLIPProcessor.from_pretrained(model_name, cache_dir=MODELS_DIR)
            logger.info("Image embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading image embedding model: {str(e)}")
            raise
    return _image_model, _clip_processor

async def generate_text_embedding(text: str, model_type: ModelType = ModelType.DEFAULT) -> List[float]:
    """Generate embedding vector for text"""
    model = get_text_embedding_model(model_type)
    try:
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Error generating text embedding: {str(e)}")
        raise

async def generate_image_embedding(image: Image.Image, model_type: ModelType = ModelType.DEFAULT) -> List[float]:
    """Generate embedding vector for image"""
    model, processor = get_image_embedding_model(model_type)
    try:
        with torch.no_grad():
            # Preprocess image
            inputs = processor(images=image, return_tensors="pt").to(DEVICE)
            
            # Get image features
            image_features = model.get_image_features(**inputs)
            
            # Normalize embedding
            embedding = image_features / image_features.norm(dim=1, keepdim=True)
            
            # Convert to list
            return embedding.cpu().numpy()[0].tolist()
    except Exception as e:
        logger.error(f"Error generating image embedding: {str(e)}")
        raise

def combine_embeddings(embeddings: List[List[float]]) -> List[float]:
    """Combine multiple embeddings into a single embedding vector"""
    if not embeddings:
        raise ValueError("No embeddings provided")
    
    if len(embeddings) == 1:
        return embeddings[0]
    
    # Convert to numpy arrays for easier manipulation
    np_embeddings = [np.array(e) for e in embeddings]
    
    # Combine by averaging and normalizing
    combined = np.mean(np_embeddings, axis=0)
    normalized = combined / np.linalg.norm(combined)
    
    return normalized.tolist()

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    if not vec1 or not vec2:
        raise ValueError("Invalid vectors")
    
    a = np.array(vec1)
    b = np.array(vec2)
    
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

async def search_by_vector(
    collection, 
    query_embedding: List[float], 
    limit: int = 20,
    include_metadata: bool = True
) -> List[Dict[str, Any]]:
    """Search ChromaDB collection by vector similarity"""
    try:
        results = collection.collection.query(
            query_embeddings=[query_embedding],
            n_results=limit,
            include=["metadatas", "distances"] if include_metadata else ["distances"]
        )
        
        search_results = []
        if results and "ids" in results and results["ids"]:
            for i, result_id in enumerate(results["ids"][0]):
                item = {"id": result_id}
                
                # Add distance/similarity score
                if "distances" in results:
                    # Convert distance to similarity score (1 - normalized_distance)
                    item["similarity_score"] = 1 - min(results["distances"][0][i], 1.0)
                
                # Add metadata if requested
                if include_metadata and "metadatas" in results:
                    item["metadata"] = results["metadatas"][0][i]
                
                search_results.append(item)
        
        return search_results
    except Exception as e:
        logger.error(f"Error searching by vector: {str(e)}")
        raise
