from flask import Blueprint, request, jsonify
from config import db
from middleware.auth_middleware import token_required
from datetime import datetime
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from utils.validators import validate_pantry_item, ValidationError, sanitize_string
except ImportError:
    # Fallback if utils not available
    class ValidationError(Exception):
        pass
    def validate_pantry_item(data):
        return True
    def sanitize_string(text, max_length=1000):
        return str(text)[:max_length] if text else ""

logger = logging.getLogger(__name__)
pantry_bp = Blueprint('pantry', __name__)

@pantry_bp.route('/', methods=['GET'])
@token_required
def get_pantry(user_id):
    try:
        pantry_docs = db.collection('pantry').document(user_id).collection('items').stream()
        items = []
        for doc in pantry_docs:
            d = doc.to_dict()
            d['id'] = doc.id
            items.append(d)
        return jsonify({"success": True, "data": items})
    except Exception as e:
        logger.error(f"Error getting pantry: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to retrieve pantry items"}), 500

@pantry_bp.route('/update', methods=['POST'])
@token_required
def update_pantry(user_id):
    try:
        data = request.get_json(silent=True)  # Use get_json with silent=True
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        # Validate input
        try:
            validate_pantry_item(data)
        except ValidationError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        
        # Sanitize input
        item_data = {
            "name": sanitize_string(data.get('name'), 100),
            "quantity": float(data.get('quantity')),
            "unit": sanitize_string(data.get('unit'), 20),
            "expiry_date": data.get('expiry_date'),
            "updated_at": datetime.now().isoformat()
        }
        
        item_id = data.get('id')
        if item_id:
            # Update existing item
            db.collection('pantry').document(user_id).collection('items').document(item_id).update(item_data)
            return jsonify({"success": True, "message": "Item updated", "id": item_id})
        else:
            # Create new item
            item_data['created_at'] = datetime.now().isoformat()
            _, doc_ref = db.collection('pantry').document(user_id).collection('items').add(item_data)
            return jsonify({"success": True, "message": "Item created", "id": doc_ref.id}), 201
            
    except ValueError as e:
        return jsonify({"success": False, "error": "Invalid data type"}), 400
    except Exception as e:
        logger.error(f"Error updating pantry: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to update pantry item"}), 500

@pantry_bp.route('/delete/<item_id>', methods=['DELETE'])
@token_required
def delete_pantry_item(user_id, item_id):
    try:
        if not item_id or len(item_id) == 0:
            return jsonify({"success": False, "error": "Item ID is required"}), 400
        
        db.collection('pantry').document(user_id).collection('items').document(item_id).delete()
        return jsonify({"success": True, "message": "Item deleted"})
        
    except Exception as e:
        logger.error(f"Error deleting pantry item: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to delete item"}), 500
