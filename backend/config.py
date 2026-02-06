from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "default_secret_key")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Trust X-Forwarded-Proto header from Cloudflare Tunnel for HTTPS redirects
    PREFERRED_URL_SCHEME = "https"

    # Flask Session Configuration
    SESSION_TYPE = "filesystem"
    SESSION_PERMANENT = True
    SESSION_USE_SIGNER = True
    SESSION_COOKIE_HTTPONLY = True
    # Cross-site cookies require SameSite=None + Secure over HTTPS
    is_https = os.environ.get("USE_HTTPS", "").lower() == "true" or os.environ.get("FLASK_ENV") == "production"
    SESSION_COOKIE_SECURE = is_https
    SESSION_COOKIE_SAMESITE = "None" if is_https else "Lax"
    SESSION_COOKIE_NAME = "session"
    SESSION_FILE_DIR = "/tmp/flask_sessions"  # Ensure the session is stored
    SESSION_KEY_PREFIX = "auth_"  
