import os
import logging
import numpy as np
from typing import List, Dict, Any, Union
from PIL import Image
from sentence_transformers import SentenceTransformer
from transformers import CLIPProcessor, CLIPModel
import torch

logger = logging.getLogger(__name__)

# Models are loaded lazily when needed
_text_model = None
_image_model = None
_clip_processor = None

# Set device based on availability
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Models to use
TEXT_MODEL_NAME = "all-MiniLM-L6-v2"  # Lightweight model for text embeddings
IMAGE_MODEL_NAME = "openai/clip-vit-base-patch32"  # CLIP model for image embeddings

# Cache directory for downloaded models
MODELS_DIR = os.path.join(os.path.expanduser("~"), ".local-image-finder", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def get_text_embedding_model():
    """Get or load the text embedding model"""
    global _text_model
    if _text_model is None:
        try:
            logger.info(f"Loading text embedding model: {TEXT_MODEL_NAME}")
            _text_model = SentenceTransformer(TEXT_MODEL_NAME, cache_folder=MODELS_DIR)
            logger.info("Text embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading text embedding model: {str(e)}")
            raise
    return _text_model

def get_image_embedding_model():
    """Get or load the image embedding model and processor"""
    global _image_model, _clip_processor
    if _image_model is None or _clip_processor is None:
        try:
            logger.info(f"Loading image embedding model: {IMAGE_MODEL_NAME}")
            _image_model = CLIPModel.from_pretrained(IMAGE_MODEL_NAME, cache_dir=MODELS_DIR).to(DEVICE)
            _clip_processor = CLIPProcessor.from_pretrained(IMAGE_MODEL_NAME, cache_dir=MODELS_DIR)
            logger.info("Image embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading image embedding model: {str(e)}")
            raise
    return _image_model, _clip_processor

async def generate_text_embedding(text: str) -> List[float]:
    """Generate embedding vector for text"""
    model = get_text_embedding_model()
    try:
        embedding = model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Error generating text embedding: {str(e)}")
        raise

async def generate_image_embedding(image: Image.Image) -> List[float]:
    """Generate embedding vector for image"""
    model, processor = get_image_embedding_model()
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
