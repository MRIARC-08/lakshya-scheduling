import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Config:
    # LLM Settings
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_API_KEY_SECONDARY: str = os.getenv("GROQ_API_KEY_SECONDARY", os.getenv("GROQ_API_KEY", ""))
    OPENAI_BASE_URL: Optional[str] = os.getenv("OPENAI_BASE_URL", None)
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    LLM_TEMPERATURE: float = 0.01

    # Corsair Bridge
    CORSAIR_BRIDGE_URL: str = os.getenv(
        "CORSAIR_BRIDGE_URL",
        "http://localhost:3001"
    )
    BRIDGE_API_KEY: str = os.getenv("BRIDGE_API_KEY", "")

    # Neon DB
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    DATABASE_URL_POOLED: str = os.getenv(
        "DATABASE_URL_POOLED",
        os.getenv("DATABASE_URL", "")  # fallback to direct
    )

    # Business
    BUSINESS_NAME: str  = os.getenv(
        "BUSINESS_NAME",
        "Lakshya IAS Academy"
    )
    BUSINESS_EMAIL: str = os.getenv(
        "BUSINESS_EMAIL",
        "appointments@lakshyaias.in"
    )

    # CORS
    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000"
    ).split(",")

    # Session types
    SESSION_TYPES: list[dict] = [
        {
            "name": "Free Counselling Session",
            "duration": 30,
            "description": "30-min intro session, no cost"
        },
        {
            "name": "One-on-One Mentorship",
            "duration": 60,
            "description": "60-min deep dive with expert faculty"
        },
        {
            "name": "Mock Interview",
            "duration": 45,
            "description": "45-min UPSC personality test simulation"
        },
        {
            "name": "Study Plan Review",
            "duration": 30,
            "description": "30-min personalised strategy session"
        },
        {
            "name": "Answer Writing Workshop",
            "duration": 90,
            "description": "90-min GS/Essay answer writing session"
        },
    ]

config = Config()
