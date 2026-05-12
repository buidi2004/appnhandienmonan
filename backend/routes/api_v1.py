"""
API Version 1 Blueprint
Aggregates all v1 routes under /api/v1 prefix
"""

from flask import Blueprint

# Create v1 blueprint
api_v1 = Blueprint('api_v1', __name__)

# Import all route blueprints
from routes.health import health_bp
from routes.community import community_bp
from routes.pantry import pantry_bp
from routes.user import user_bp
from routes.recipes import recipes_bp
from routes.ai_analysis import ai_bp
from routes.admin import admin_bp

# Register sub-blueprints under v1
def register_v1_routes(app):
    """Register all v1 routes."""
    app.register_blueprint(health_bp, url_prefix='/api/v1/health')
    app.register_blueprint(community_bp, url_prefix='/api/v1/community')
    app.register_blueprint(pantry_bp, url_prefix='/api/v1/pantry')
    app.register_blueprint(user_bp, url_prefix='/api/v1/user')
    app.register_blueprint(recipes_bp, url_prefix='/api/v1/recipes')
    app.register_blueprint(ai_bp, url_prefix='/api/v1/ai')
    app.register_blueprint(admin_bp, url_prefix='/api/v1/admin')
    
    # Also register without version for backward compatibility
    app.register_blueprint(health_bp, url_prefix='/api/health')
    app.register_blueprint(community_bp, url_prefix='/api/community')
    app.register_blueprint(pantry_bp, url_prefix='/api/pantry')
    app.register_blueprint(user_bp, url_prefix='/api/user')
    app.register_blueprint(recipes_bp, url_prefix='/api/recipes')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
