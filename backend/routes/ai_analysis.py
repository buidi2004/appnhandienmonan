from flask import Blueprint, request, jsonify
from config import db, allowed_file, MAX_UPLOAD_SIZE, cache
import google.generativeai as genai
from middleware.auth_middleware import token_required
from utils.cache_decorator import cached_route, cached_image_route
import os
import re
import json
import tempfile
import logging
import sys
import hashlib

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from utils.validators import validate_ingredients_list, ValidationError
except ImportError:
    class ValidationError(Exception):
        pass
    def validate_ingredients_list(ingredients):
        return True

logger = logging.getLogger(__name__)
ai_bp = Blueprint('ai', __name__)

# Import AI service
from services.ai_service import generate_recipes as ai_generate_recipes

# Import limiter from app
from flask import current_app

def get_limiter():
    """Get limiter from current app context."""
    return current_app.extensions.get('limiter')

@ai_bp.route('/scan-ingredients', methods=['POST'])
@token_required
def scan_ingredients(user_id):
    """
    Scan ingredients from image using Gemini Vision.
    Rate limit: 5 requests per minute per user.
    Cache: 1 hour (3600 seconds) based on image hash.
    
    Requirements: 2.1, 2.5
    """
    limiter = get_limiter()
    if limiter:
        limiter.limit("5 per minute")(lambda: None)()
    
    tmp_path = None
    try:
        if 'image' not in request.files:
            return jsonify({"success": False, "error": "No image uploaded"}), 400
        
        file = request.files['image']
        
        # Validate file
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"success": False, "error": "Invalid file type. Allowed: png, jpg, jpeg, gif, webp"}), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_UPLOAD_SIZE:
            return jsonify({"success": False, "error": f"File too large. Maximum size: {MAX_UPLOAD_SIZE/1024/1024}MB"}), 400
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        
        # Read image data
        with open(tmp_path, 'rb') as f:
            image_data = f.read()
        
        # Generate cache key from image hash
        from utils.cache_decorator import cache_key_with_image_hash
        cache_key = cache_key_with_image_hash(image_data, prefix="scan_ingredients")
        
        # Check cache
        try:
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for scan_ingredients: {cache_key}")
                return jsonify({"success": True, "data": cached_result, "cached": True})
        except Exception as e:
            logger.warning(f"Cache read failed: {str(e)}")
        
        # Cache miss - process with AI
        logger.debug(f"Cache miss for scan_ingredients: {cache_key}")
        
        prompt = """
        Phân tích hình ảnh này và liệt kê tất cả các nguyên liệu nấu ăn bạn thấy.
        Trả về JSON: {"ingredients": ["tên 1", "tên 2"]}
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": image_data}
        ])
        
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = {"ingredients": []}
        
        # Store in cache with 1 hour TTL
        try:
            cache.set(cache_key, result, timeout=3600)
            logger.info(f"Cached result for scan_ingredients: {cache_key} with TTL: 3600s")
        except Exception as e:
            logger.warning(f"Cache write failed: {str(e)}")
        
        return jsonify({"success": True, "data": result, "cached": False})
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to parse AI response"}), 500
    except Exception as e:
        logger.error(f"Error scanning ingredients: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to scan ingredients"}), 500
    finally:
        # Cleanup temp file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file: {str(e)}")

@ai_bp.route('/suggest-recipes', methods=['POST'])
@token_required
@cached_route(ttl=1800, key_prefix="suggest_recipes", include_body=True)
def suggest_recipes(user_id):
    """
    Suggest recipes based on ingredients.
    Rate limit: 10 requests per minute per user.
    Cache: 30 minutes based on ingredients + health profile + pantry context.
    """
    limiter = get_limiter()
    if limiter:
        limiter.limit("10 per minute")(lambda: None)()
    
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        ingredients = data.get('ingredients', [])
        
        # Validate ingredients
        try:
            validate_ingredients_list(ingredients)
        except ValidationError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        
        health_profile = data.get('health_profile', {})
        pantry_context = data.get('pantry_context', [])
        
        # Use consolidated AI service
        recipes = ai_generate_recipes(ingredients, health_profile)
        
        return jsonify({
            "success": True, 
            "recipes": recipes,
            "ingredients": ingredients
        })
        
    except ValidationError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to parse AI response"}), 500
    except Exception as e:
        logger.error(f"Error suggesting recipes: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to suggest recipes"}), 500

@ai_bp.route('/analyze-meal', methods=['POST'])
@token_required
@cached_image_route(ttl=86400, key_prefix="analyze_meal")
def analyze_meal(user_id, image_data):
    """
    Analyze meal from image.
    Rate limit: 5 requests per minute per user.
    Cache: 24 hours (86400 seconds) based on image hash.
    
    Validates: Requirements 2.3, 2.5
    """
    limiter = get_limiter()
    if limiter:
        limiter.limit("5 per minute")(lambda: None)()
    
    tmp_path = None
    try:
        file = request.files['image']
        
        # Validate file
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"success": False, "error": "Invalid file type"}), 400
        
        # Save to temp file for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            tmp.write(image_data)
            tmp_path = tmp.name
        
        prompt = """
        Phân tích hình ảnh món ăn này và trả về dữ liệu dinh dưỡng chi tiết.
        Trả về JSON: 
        {
          "dish_name": "tên món",
          "calories": số calo,
          "protein": số gram protein,
          "carbs": số gram carbs,
          "fat": số gram fat,
          "ingredients": ["nguyên liệu 1", "nguyên liệu 2"],
          "health_advice": "lời khuyên sức khỏe ngắn gọn",
          "health_score": 0-100
        }
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content([
            prompt, 
            {"mime_type": "image/jpeg", "data": image_data}
        ])
        
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return jsonify({"success": True, "data": result})
        
        return jsonify({"success": False, "error": "Failed to analyze meal"}), 500
        
    except Exception as e:
        logger.error(f"Error analyzing meal: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to analyze meal"}), 500
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file: {str(e)}")

@ai_bp.route('/search-image', methods=['GET'])
@token_required
def search_image(user_id):
    """
    Search for a realistic food image based on a query.
    """
    try:
        query = request.args.get('q', 'food')
        # We'll use a reliable public image service for high quality food photos
        # For a production app, use Unsplash API or Google Custom Search
        image_url = f"https://loremflickr.com/800/600/cooking,{query.replace(' ', ',')}/all"
        
        # Optionally, we could use Gemini to provide a more specific Unsplash-friendly query
        return jsonify({"success": True, "url": image_url})
    except Exception as e:
        logger.error(f"Error searching image: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to search image"}), 500
