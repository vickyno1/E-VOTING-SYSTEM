import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev_insecure_secret_key_change_in_production_1234567890")
    
    # MongoDB
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "evoting_db")
    
    # Frontend Origin / CORS
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    
    # Auth & Tokens
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "8"))
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() in ("true", "1", "yes")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    
    # Timezone & Formatting
    TIMEZONE = os.getenv("TIMEZONE", "UTC")
    
    # Biometric / Face Recognition
    BASE_DIR = Path(__file__).resolve().parent
    MODELS_DIR = BASE_DIR / "models"
    FACE_MODEL_NAME = os.getenv("FACE_MODEL_NAME", "sface")
    FACE_SIMILARITY_THRESHOLD = float(os.getenv("FACE_SIMILARITY_THRESHOLD", "0.363"))
    FACE_DETECTOR_PATH = os.getenv(
        "FACE_DETECTOR_PATH",
        str(MODELS_DIR / "face_detection_yunet_2023mar.onnx")
    )
    FACE_RECOGNIZER_PATH = os.getenv(
        "FACE_RECOGNIZER_PATH",
        str(MODELS_DIR / "face_recognition_sface_2021dec.onnx")
    )
    
    # Upload limits: 5MB maximum for face images
    MAX_CONTENT_LENGTH = int(os.getenv("FACE_MAX_UPLOAD_BYTES", 5 * 1024 * 1024))
