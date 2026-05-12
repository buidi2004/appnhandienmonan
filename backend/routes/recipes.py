from flask import Blueprint, request, jsonify
from config import db, cache
from middleware.auth_middleware import token_required
from firebase_admin import firestore
import logging
import hashlib
import json

logger = logging.getLogger(__name__)
recipes_bp = Blueprint('recipes', __name__)

@recipes_bp.route('/search', methods=['GET'])
@token_required
def search_recipes(user_id):
    """
    Search recipes by query and category.
    Cache: 10 minutes per query.
    """
    try:
        query = request.args.get('q', '').lower()
        category = request.args.get('category', 'Tất cả')
        
        # Create cache key
        cache_key = f"search_recipes_{hashlib.md5(f'{query}_{category}'.encode()).hexdigest()}"
        
        # Check cache
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit for search_recipes: {cache_key}")
            return jsonify({"success": True, "data": cached_result, "cached": True})
        
        # Simple search logic using Firestore
        recipes_ref = db.collection('recipes')
        
        if category != 'Tất cả':
            recipes_ref = recipes_ref.where('category', '==', category)
        
        docs = recipes_ref.limit(20).stream()
        results = []
        for doc in docs:
            d = doc.to_dict()
            if query in d.get('name', '').lower() or query in d.get('description', '').lower():
                d['id'] = doc.id
                results.append(d)
        
        # Cache for 10 minutes
        cache.set(cache_key, results, timeout=600)
        
        return jsonify({"success": True, "data": results, "cached": False})
    except Exception as e:
        logger.error(f"Search error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to search recipes"}), 500

@recipes_bp.route('/recommendations', methods=['GET'])
@token_required
def get_recommendations(user_id):
    """
    Get trending recipe recommendations.
    Cache: 5 minutes (frequently updated).
    """
    try:
        cache_key = "recommendations_trending"
        
        # Check cache
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit for recommendations")
            return jsonify({"success": True, "data": cached_result, "cached": True})
        
        # Get trending recipes
        docs = db.collection('recipes').where('is_trending', '==', True).limit(10).stream()
        recipes = []
        for doc in docs:
            d = doc.to_dict()
            d['id'] = doc.id
            recipes.append(d)
        
        result = {
            "category": "Gợi ý cho bạn",
            "recipes": recipes
        }
        
        # Cache for 5 minutes
        cache.set(cache_key, result, timeout=300)
        
        return jsonify({"success": True, "data": result, "cached": False})
    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to retrieve recommendations"}), 500

@recipes_bp.route('/meal-plan/generate', methods=['POST'])
@token_required
def generate_meal_plan(user_id):
    """
    Generate weekly meal plan.
    Cache: 1 hour per user.
    """
    try:
        cache_key = f"meal_plan_{user_id}"
        
        # Check cache
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit for meal_plan: {user_id}")
            return jsonify({"success": True, "data": cached_result, "cached": True})
        
        days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        # Logic to generate based on pantry and health profile
        mock_plan = {
            day: {
                "breakfast": {"name": "Phở gà", "calories": 350},
                "lunch": {"name": "Cơm tấm", "calories": 500},
                "dinner": {"name": "Salad ức gà", "calories": 300}
            }
            for day in days
        }
        
        # Cache for 1 hour
        cache.set(cache_key, mock_plan, timeout=3600)
        
        return jsonify({"success": True, "data": mock_plan, "cached": False})
    except Exception as e:
        logger.error(f"Error generating meal plan: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to generate meal plan"}), 500
