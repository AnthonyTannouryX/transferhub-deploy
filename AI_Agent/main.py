from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat import router as chat_router
from config import settings

# Create FastAPI application
app = FastAPI(
    title="TransferHub AI Agent",
    description="AI-powered support agent for TransferHub money transfer platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",  # Frontend
        "http://localhost:8000",  # Laravel Backend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/chat", tags=["chat"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "TransferHub AI Agent",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "chat": "/chat/message",
            "health": "/chat/health",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.FASTAPI_PORT,
        reload=True
    )
