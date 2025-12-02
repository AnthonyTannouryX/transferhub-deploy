from fastapi import APIRouter, HTTPException
from models.schemas import ChatRequest, ChatResponse
from services.openai_service import OpenAIService

router = APIRouter()
openai_service = OpenAIService()

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Process a chat message and return AI agent response

    Args:
        request: ChatRequest containing message, user_token, and user_context

    Returns:
        ChatResponse with AI response and function calls made
    """
    try:
        response = await openai_service.process_message(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "TransferHub AI Agent"}
