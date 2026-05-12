from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import logging
from config import db, cache
from middleware.logging_middleware import setup_request_logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# --- APP CONFIGURATION ---
app.config['LOG_HEALTH_CHECKS'] = os.getenv('LOG_HEALTH_CHECKS', 'false').lower() == 'true'
app.config['API_VERSION'] = '1.4.0'

# --- INITIALIZE CACHE ---
cache.init_app(app)

# --- INITIALIZE RATE LIMITER ---
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri=os.getenv('RATELIMIT_STORAGE_URL', 'memory://'),
    enabled=os.getenv('RATELIMIT_ENABLED', 'true').lower() == 'true'
)

# --- SETUP REQUEST/RESPONSE LOGGING ---
if os.getenv('ENABLE_REQUEST_LOGGING', 'true').lower() == 'true':
    setup_request_logging(app)
    logger.info("Request/Response logging enabled")

# --- REGISTER BLUEPRINTS (API VERSIONING) ---
from routes.health import health_bp
from routes.community import community_bp
from routes.pantry import pantry_bp
from routes.user import user_bp
from routes.recipes import recipes_bp
from routes.ai_analysis import ai_bp
from routes.admin import admin_bp

# API v1 routes
app.register_blueprint(health_bp, url_prefix='/api/v1/health')
app.register_blueprint(community_bp, url_prefix='/api/v1/community')
app.register_blueprint(pantry_bp, url_prefix='/api/v1/pantry')
app.register_blueprint(user_bp, url_prefix='/api/v1/user')
app.register_blueprint(recipes_bp, url_prefix='/api/v1/recipes')
app.register_blueprint(ai_bp, url_prefix='/api/v1/ai')
app.register_blueprint(admin_bp, url_prefix='/api/v1/admin')

# Backward compatibility (no version prefix)
app.register_blueprint(health_bp, name='health_legacy', url_prefix='/api/health')
app.register_blueprint(community_bp, name='community_legacy', url_prefix='/api/community')
app.register_blueprint(pantry_bp, name='pantry_legacy', url_prefix='/api/pantry')
app.register_blueprint(user_bp, name='user_legacy', url_prefix='/api/user')
app.register_blueprint(recipes_bp, name='recipes_legacy', url_prefix='/api/recipes')
app.register_blueprint(ai_bp, name='ai_legacy', url_prefix='/api/ai')
app.register_blueprint(admin_bp, name='admin_legacy', url_prefix='/api/admin')

@app.route('/')
def index():
    """API root endpoint with version information."""
    return jsonify({
        "message": "Welcome to AI Cooking App API!",
        "status": "online",
        "version": app.config['API_VERSION'],
        "api_versions": {
            "v1": {
                "status": "stable",
                "base_url": "/api/v1",
                "endpoints": [
                    "/api/v1/health",
                    "/api/v1/ai",
                    "/api/v1/recipes",
                    "/api/v1/community",
                    "/api/v1/pantry",
                    "/api/v1/user"
                ]
            },
            "legacy": {
                "status": "deprecated",
                "base_url": "/api",
                "note": "Use /api/v1 for new integrations"
            }
        },
        "features": {
            "rate_limiting": os.getenv('RATELIMIT_ENABLED', 'true').lower() == 'true',
            "caching": cache.config.get('CACHE_TYPE') != 'null',
            "request_logging": os.getenv('ENABLE_REQUEST_LOGGING', 'true').lower() == 'true',
            "api_versioning": True
        },
        "documentation": "/api/docs"
    })

@app.route('/api/v1')
def api_v1_info():
    """API v1 information endpoint."""
    return jsonify({
        "version": "1.0",
        "status": "stable",
        "endpoints": {
            "health": "/api/v1/health",
            "ai": {
                "scan_ingredients": "/api/v1/ai/scan-ingredients",
                "suggest_recipes": "/api/v1/ai/suggest-recipes",
                "analyze_meal": "/api/v1/ai/analyze-meal"
            },
            "recipes": {
                "search": "/api/v1/recipes/search",
                "recommendations": "/api/v1/recipes/recommendations",
                "meal_plan": "/api/v1/recipes/meal-plan/generate"
            },
            "community": {
                "feed": "/api/v1/community/feed",
                "post": "/api/v1/community/post",
                "like": "/api/v1/community/like"
            },
            "pantry": "/api/v1/pantry",
            "user": {
                "profile": "/api/v1/user/data",
                "gamification": "/api/v1/user/gamification",
                "favorites": "/api/v1/user/favorites"
            },
            "admin": {
                "cache_stats": "/api/v1/admin/cache/stats",
                "cache_clear": "/api/v1/admin/cache/clear",
                "cache_stats_reset": "/api/v1/admin/cache/stats/reset"
            }
        }
    })

@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    return jsonify({
        "error": "Resource not found",
        "status_code": 404,
        "path": request.path,
        "suggestion": "Check /api/v1 for available endpoints"
    }), 404

@app.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit exceeded errors."""
    return jsonify({
        "error": "Rate limit exceeded",
        "message": "Too many requests. Please try again later.",
        "status_code": 429
    }), 429

@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors."""
    logger.error(f"Internal server error: {str(e)}", exc_info=True)
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred",
        "status_code": 500
    }), 500

@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all unhandled exceptions."""
    logger.error(f"Unhandled exception: {repr(e)}", exc_info=True)
    
    # Return generic error in production
    if os.getenv('FLASK_ENV') == 'production':
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "status_code": 500
        }), 500
    else:
        # Return detailed error in development
        return jsonify({
            "error": str(e),
            "type": type(e).__name__,
            "status_code": 500
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'production') != 'production'
    
    logger.info(f"Starting AI Cooking App API v{app.config['API_VERSION']}")
    logger.info(f"Environment: {os.getenv('FLASK_ENV', 'production')}")
    logger.info(f"Port: {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Rate limiting: {os.getenv('RATELIMIT_ENABLED', 'true')}")
    logger.info(f"Caching: {cache.config.get('CACHE_TYPE')}")
    logger.info(f"Request logging: {os.getenv('ENABLE_REQUEST_LOGGING', 'true')}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
