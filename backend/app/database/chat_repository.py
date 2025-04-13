import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
from app.utils.database import get_chroma_collection

logger = logging.getLogger(__name__)

class ChatRepository:
    """Repository for managing chat/search history in ChromaDB"""
    
    def __init__(self, profile_id: str):
        self.profile_id = profile_id
        self.collection_name = f"{profile_id}_chats"
        self.collection = None
    
    async def initialize(self):
        """Initialize the collection"""
        if not self.collection:
            self.collection = await get_chroma_collection(self.collection_name)
        return self.collection
    
    async def create_chat(self, title: Optional[str] = None) -> str:
        """Create a new chat session and return its ID"""
        try:
            chat_id = str(uuid.uuid4())
            
            chat_data = {
                "id": chat_id,
                "profile_id": self.profile_id,
                "title": title or "New Chat",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "messages": []
            }
            
            if not self.collection:
                await self.initialize()
            
            # Store with a dummy embedding - chats don't need real embeddings
            self.collection.upsert(
                ids=[chat_id],
                metadatas=[chat_data],
                embeddings=[[0.0] * 10]  # Dummy embedding
            )
            
            return chat_id
        except Exception as e:
            logger.error(f"Error creating chat: {str(e)}")
            return None
    
    async def add_message(self, chat_id: str, message_type: str, content: Dict[str, Any], 
                   embedding: Optional[List[float]] = None) -> str:
        """Add a message to a chat session"""
        try:
            message_id = str(uuid.uuid4())
            
            message_data = {
                "id": message_id,
                "type": message_type,
                "content": content,
                "timestamp": datetime.now().isoformat()
            }
            
            if not self.collection:
                await self.initialize()
                
            # Get current chat data
            results = self.collection.get(ids=[chat_id], include=["metadatas"])
            
            if not results or not results["metadatas"]:
                logger.error(f"Chat {chat_id} not found")
                return None
                
            chat_data = results["metadatas"][0]
            
            # Add message to chat
            messages = chat_data.get("messages", [])
            messages.append(message_data)
            
            # Update chat
            chat_data["messages"] = messages
            chat_data["updated_at"] = datetime.now().isoformat()
            
            # Store with embedding if provided, otherwise use dummy
            self.collection.upsert(
                ids=[chat_id],
                metadatas=[chat_data],
                embeddings=[embedding if embedding else [0.0] * 10]
            )
            
            return message_id
        except Exception as e:
            logger.error(f"Error adding message: {str(e)}")
            return None
    
    async def get_chat(self, chat_id: str) -> Optional[Dict[str, Any]]:
        """Get a chat by ID"""
        try:
            if not self.collection:
                await self.initialize()
                
            results = self.collection.get(ids=[chat_id], include=["metadatas"])
            
            if results and results["metadatas"] and results["metadatas"][0]:
                return results["metadatas"][0]
            return None
        except Exception as e:
            logger.error(f"Error getting chat: {str(e)}")
            return None
