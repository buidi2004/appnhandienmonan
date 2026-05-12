from flask import Blueprint, request, jsonify
from config import db
from middleware.auth_middleware import token_required, require_auth
from firebase_admin import firestore
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
user_bp = Blueprint('user', __name__)

@user_bp.route('/gamification', methods=['GET'])
@token_required
def get_gamification(user_id):
    try:
        user_ref = db.collection('users').document(user_id).get()
        data = user_ref.to_dict() if user_ref.exists else {}
        xp = data.get('xp', 0)
        level = (xp // 500) + 1
        
        leaderboard_docs = db.collection('users')\
            .order_by('xp', direction=firestore.Query.DESCENDING)\
            .limit(10)\
            .stream()
        
        leaderboard = [
            {
                "name": d.to_dict().get('name', 'Anonymous'),
                "xp": d.to_dict().get('xp', 0),
                "level": (d.to_dict().get('xp', 0) // 500) + 1
            }
            for d in leaderboard_docs
        ]
        
        return jsonify({
            "success": True,
            "data": {
                "xp": xp,
                "level": level,
                "next_level_xp": level * 500,
                "badges": data.get('badges', []),
                "leaderboard": leaderboard
            }
        })
    except Exception as e:
        logger.error(f"Error getting gamification: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to retrieve gamification data"}), 500

@user_bp.route('/favorites', methods=['GET'])
@require_auth
def get_favorites():
    try:
        user_id = request.user_id
        docs = db.collection('favorites').where('user_id', '==', user_id).stream()
        favorites = [{**doc.to_dict(), "id": doc.id} for doc in docs]
        return jsonify({"success": True, "data": favorites})
    except Exception as e:
        logger.error(f"Error getting favorites: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to retrieve favorites"}), 500

@user_bp.route('/favorites', methods=['POST'])
@require_auth
def add_favorite():
    try:
        data = request.get_json(silent=True)  # Use get_json with silent=True
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        data['user_id'] = request.user_id
        data['created_at'] = datetime.now().isoformat()
        
        _, doc_ref = db.collection('favorites').add(data)
        return jsonify({"success": True, "message": "Favorite saved", "id": doc_ref.id}), 201
    except Exception as e:
        logger.error(f"Error adding favorite: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to save favorite"}), 500

@user_bp.route('/favorites/<favorite_id>', methods=['DELETE'])
@require_auth
def delete_favorite(favorite_id):
    try:
        if not favorite_id:
            return jsonify({"success": False, "error": "Favorite ID is required"}), 400
        
        # Verify ownership
        doc = db.collection('favorites').document(favorite_id).get()
        if not doc.exists:
            return jsonify({"success": False, "error": "Favorite not found"}), 404
        
        if doc.to_dict().get('user_id') != request.user_id:
            return jsonify({"success": False, "error": "Permission denied"}), 403
        
        db.collection('favorites').document(favorite_id).delete()
        return jsonify({"success": True, "message": "Favorite deleted"})
    except Exception as e:
        logger.error(f"Error deleting favorite: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to delete favorite"}), 500

# --- SYNC ROUTES ---
@user_bp.route('/sync-profile', methods=['POST'])
@require_auth
def sync_profile():
    try:
        data = request.get_json(silent=True)  # Use get_json with silent=True
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        db.collection('user_profiles').document(request.user_id).set({
            "user_id": request.user_id,
            "profile": data,
            "updated_at": datetime.now().isoformat()
        })
        return jsonify({"success": True, "message": "Profile synced"})
    except Exception as e:
        logger.error(f"Error syncing profile: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to sync profile"}), 500

@user_bp.route('/data', methods=['GET'])
@require_auth
def get_user_data():
    user_id = request.user_id
    try:
        # Tối giản: chỉ lấy profile và stats cơ bản
        profile = db.collection('user_profiles').document(user_id).get()
        profile_data = profile.to_dict().get("profile") if profile.exists else None
        
        return jsonify({"success": True, "data": {"profile": profile_data}})
    except Exception as e:
        logger.error(f"Error getting user data: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to retrieve user data"}), 500

@user_bp.route('/add-xp', methods=['POST'])
@token_required
def add_xp(user_id):
    try:
        data = request.json
        amount = data.get('amount', 0)
        action = data.get('action', 'unknown')
        
        db.collection('users').document(user_id).update({
            "xp": firestore.Increment(amount),
            "last_action": action,
            "last_active": datetime.now().isoformat()
        })
        
        return jsonify({"success": True, "message": f"Added {amount} XP"})
    except Exception as e:
        logger.error(f"Error adding XP: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to add XP"}), 500

@user_bp.route('/nutrition/stats', methods=['GET'])
@token_required
def get_nutrition_stats(user_id):
    try:
        # Mock data - replace with real data from database
        return jsonify({
            "success": True,
            "data": {
                "labels": ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                "calories": [1800, 2100, 1950, 2200, 1900, 2400, 2000],
                "macros": {"protein": 30, "carbs": 50, "fat": 20}
            }
        })
    except Exception as e:
        logger.error(f"Error getting nutrition stats: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to retrieve nutrition stats"}), 500
