from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "default_secret_key")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "postgresql://postgres:Alaska2013!@localhost/dunderdata")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # ✅ Flask Session Configuration
    SESSION_TYPE = "filesystem" 
    SESSION_PERMANENT = True
    SESSION_USE_SIGNER = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False  # Set to True in production
    SESSION_COOKIE_SAMESITE = "Lax"  # Allows cross-site requests for authentication
    SESSION_COOKIE_NAME = "session"
    SESSION_FILE_DIR = "/tmp/flask_sessions"  # Ensure the session is stored
    SESSION_KEY_PREFIX = "auth_"  
