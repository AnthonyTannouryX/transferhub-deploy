from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class UserContext(BaseModel):
    user_id: str
    name: str
    email: str
    plan: str

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    user_token: str
    user_context: UserContext
    conversation_history: List[ChatMessage] = []  # Previous messages in the conversation

class FunctionCall(BaseModel):
    name: str
    arguments: Dict[str, Any]
    result: Optional[Any] = None

class ChatResponse(BaseModel):
    response: str
    function_calls: List[FunctionCall] = []
    metadata: Dict[str, Any] = {}
