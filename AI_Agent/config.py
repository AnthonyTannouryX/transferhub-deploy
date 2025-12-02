import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LARAVEL_API_URL: str = os.getenv("LARAVEL_API_URL", "http://localhost:8000/api")
    FASTAPI_PORT: int = int(os.getenv("FASTAPI_PORT", "8001"))

    # OpenAI Configuration
    # Models (in order of capability):
    # "gpt-4o-2024-11-20" - Latest GPT-4 Omni (RECOMMENDED - Best quality, function calling)
    # "gpt-4o" - GPT-4 Omni (Fast, excellent quality)
    # "gpt-4-turbo" - GPT-4 Turbo (High quality, slower)
    # "gpt-3.5-turbo" - Faster, cheaper, but lower quality
    OPENAI_MODEL: str = "gpt-4o-2024-11-20"
    MAX_TOKENS: int = 2000
    TEMPERATURE: float = 0.7

settings = Settings()
