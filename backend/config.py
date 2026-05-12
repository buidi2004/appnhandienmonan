import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import google.generativeai as genai
import logging
import redis
from flask_caching import Cache

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

load_dotenv()

# --- FIREBASE SETUP ---
db = None
try:
    firebase_config = os.getenv("FIREBASE_CONFIG_JSON")
    if firebase_config:
        cred_dict = json.loads(firebase_config)
        cred = credentials.Certificate(cred_dict)
    else:
        cred_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            cred = None

    if cred:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("Firebase connected successfully")
    else:
        logger.warning("Firebase credentials not found")
except Exception as e:
    logger.error("Firebase initialization failed", exc_info=False)
    # Không log full exception để tránh expose sensitive data

# --- GEMINI SETUP ---
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    logger.info("Gemini AI configured successfully")
else:
    logger.warning("GEMINI_API_KEY not configured")

# --- REDIS SETUP WITH CONNECTION POOLING ---
redis_client = None
redis_pool = None

def create_redis_connection():
    """
    Create Redis connection with connection pooling and fallback support.
    Returns tuple of (redis_client, redis_pool) or (None, None) if connection fails.
    """
    try:
        # Get Redis configuration from environment variables
        redis_url = os.getenv('REDIS_URL')
        redis_host = os.getenv('REDIS_HOST', 'localhost')
        redis_port = int(os.getenv('REDIS_PORT', '6379'))
        redis_db = int(os.getenv('REDIS_DB', '0'))
        redis_password = os.getenv('REDIS_PASSWORD', None)
        
        # Create connection pool with optimized settings
        pool_config = {
            'host': redis_host,
            'port': redis_port,
            'db': redis_db,
            'password': redis_password if redis_password else None,
            'decode_responses': True,
            'max_connections': 50,  # Maximum connections in pool
            'socket_timeout': 5,  # Socket timeout in seconds
            'socket_connect_timeout': 5,  # Connection timeout in seconds
            'socket_keepalive': True,  # Enable TCP keepalive
            'health_check_interval': 30,  # Health check every 30 seconds
        }
        
        # Use REDIS_URL if provided, otherwise use individual parameters
        if redis_url:
            pool = redis.ConnectionPool.from_url(
                redis_url,
                decode_responses=True,
                max_connections=50,
                socket_timeout=5,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30
            )
        else:
            pool = redis.ConnectionPool(**pool_config)
        
        # Create Redis client from pool
        client = redis.Redis(connection_pool=pool)
        
        # Test connection
        client.ping()
        logger.info(f"Redis connected successfully at {redis_host}:{redis_port}/{redis_db}")
        logger.info(f"Redis connection pool created with max_connections=50")
        
        return client, pool
        
    except redis.ConnectionError as e:
        logger.warning(f"Redis connection failed: {str(e)}")
        logger.warning("Falling back to in-memory cache")
        return None, None
    except Exception as e:
        logger.error(f"Unexpected error during Redis setup: {str(e)}")
        logger.warning("Falling back to in-memory cache")
        return None, None

# Initialize Redis connection
redis_client, redis_pool = create_redis_connection()

# --- CACHE SETUP WITH FALLBACK ---
def get_cache_config():
    """
    Get cache configuration with automatic fallback to in-memory cache.
    Returns Flask-Caching configuration dictionary.
    """
    if redis_client:
        # Redis cache configuration
        cache_config = {
            'CACHE_TYPE': 'redis',
            'CACHE_REDIS_URL': os.getenv('REDIS_URL', f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', '6379')}/{os.getenv('REDIS_DB', '0')}"),
            'CACHE_KEY_PREFIX': 'appnauan_',
            'CACHE_DEFAULT_TIMEOUT': 300,  # 5 minutes default
            'CACHE_REDIS_HOST': os.getenv('REDIS_HOST', 'localhost'),
            'CACHE_REDIS_PORT': int(os.getenv('REDIS_PORT', '6379')),
            'CACHE_REDIS_DB': int(os.getenv('REDIS_DB', '0')),
            'CACHE_REDIS_PASSWORD': os.getenv('REDIS_PASSWORD', None),
        }
        logger.info("Cache configured with Redis backend")
    else:
        # In-memory cache fallback configuration
        cache_config = {
            'CACHE_TYPE': 'simple',
            'CACHE_DEFAULT_TIMEOUT': 300,  # 5 minutes default
            'CACHE_THRESHOLD': 500,  # Maximum number of items in simple cache
        }
        logger.warning("Cache configured with in-memory backend (fallback mode)")
    
    return cache_config

cache_config = get_cache_config()
cache = Cache(config=cache_config)

def is_redis_available():
    """
    Check if Redis is currently available.
    Returns True if Redis is connected, False otherwise.
    """
    if redis_client is None:
        return False
    try:
        redis_client.ping()
        return True
    except Exception:
        return False

# --- APP CONFIG ---
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
MAX_UPLOAD_SIZE = int(os.getenv('MAX_UPLOAD_SIZE', '10485760'))  # 10MB default
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
