from flask import Blueprint, request, jsonify
from config import db, cache
from firebase_admin import firestore
from middleware.auth_middleware import token_required
from datetime import datetime
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from utils.validators import validate_community_post, ValidationError, sanitize_string
except ImportError:
    # Fallback if utils not available
    class ValidationError(Exception):
        pass
    def validate_community_post(data):
        return True
    def sanitize_string(text, max_length=1000):
        return str(text)[:max_length] if text else ""

logger = logging.getLogger(__name__)
community_bp = Blueprint('community', __name__)

@community_bp.route('/post', methods=['POST'])
@token_required
def create_community_post(user_id):
    """
    Create a new community post.
    Rate limit: 10 posts per hour per user.
    """
    from flask import current_app
    limiter = current_app.extensions.get('limiter')
    if limiter:
        limiter.limit("10 per hour")(lambda: None)()
    
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
        
        # Validate input
        try:
            validate_community_post(data)
        except ValidationError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        
        user_ref = db.collection('users').document(user_id).get()
        user_data = user_ref.to_dict() if user_ref.exists else {}
        
        post_data = {
            "user_id": user_id,
            "user_name": sanitize_string(user_data.get('name', 'Đầu bếp ẩn danh'), 100),
            "dish_name": sanitize_string(data.get('dish_name'), 200),
            "image_url": sanitize_string(data.get('image_url', ''), 500),
            "description": sanitize_string(data.get('description', ''), 1000),
            "calories": int(data.get('calories', 0)),
            "macros": data.get('macros', {}),
            "likes": 0,
            "created_at": datetime.now().isoformat()
        }
        
        _, doc_ref = db.collection('community_posts').add(post_data)
        
        # Tặng 50 XP
        db.collection('users').document(user_id).update({
            "xp": firestore.Increment(50)
        })
        
        # Invalidate feed cache
        cache.delete_memoized('get_community_feed')
        
        return jsonify({"success": True, "message": "Post created", "post_id": doc_ref.id}), 201
        
    except ValueError as e:
        return jsonify({"success": False, "error": "Invalid data type"}), 400
    except Exception as e:
        logger.error(f"Error creating post: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to create post"}), 500

@community_bp.route('/feed', methods=['GET'])
@token_required
def get_community_feed(user_id):
    """
    Get community feed with posts.
    Cache: 2 minutes (frequently updated).
    """
    try:
        cache_key = f"community_feed_{user_id}"
        
        # Check cache
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.info(f"Cache hit for community_feed: {user_id}")
            return jsonify({"success": True, "data": cached_result, "cached": True})
        
        # Lấy posts
        posts_docs = db.collection('community_posts')\
            .order_by('created_at', direction=firestore.Query.DESCENDING)\
            .limit(50)\
            .stream()
        
        posts = []
        post_ids = []
        
        for doc in posts_docs:
            d = doc.to_dict()
            d['id'] = doc.id
            d['is_liked'] = False  # Default
            posts.append(d)
            post_ids.append(doc.id)
        
        # Batch check likes (tối ưu performance)
        if post_ids:
            # Firestore limit 10 items in 'in' query, so we batch
            batch_size = 10
            liked_post_ids = set()
            
            for i in range(0, len(post_ids), batch_size):
                batch = post_ids[i:i+batch_size]
                user_likes_docs = db.collection('user_likes')\
                    .where('user_id', '==', user_id)\
                    .where('post_id', 'in', batch)\
                    .stream()
                
                for doc in user_likes_docs:
                    liked_post_ids.add(doc.to_dict()['post_id'])
            
            for post in posts:
                post['is_liked'] = post['id'] in liked_post_ids
        
        # Cache for 2 minutes
        cache.set(cache_key, posts, timeout=120)
        
        return jsonify({"success": True, "data": posts, "cached": False})
        
    except Exception as e:
        logger.error(f"Error getting feed: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to retrieve feed"}), 500

@community_bp.route('/like', methods=['POST'])
@token_required
def like_post(user_id):
    """
    Like/unlike a post.
    Rate limit: 30 likes per minute per user.
    """
    from flask import current_app
    limiter = current_app.extensions.get('limiter')
    if limiter:
        limiter.limit("30 per minute")(lambda: None)()
    
    try:
        data = request.get_json(silent=True)
        post_id = data.get('post_id') if data else None
        if not post_id:
            return jsonify({"success": False, "error": "Post ID is required"}), 400
        
        post_ref = db.collection('community_posts').document(post_id)
        like_ref = db.collection('user_likes').document(f"{user_id}_{post_id}")
        
        # Sử dụng transaction để tránh race condition
        @firestore.transactional
        def toggle_like_transaction(transaction):
            post_snapshot = post_ref.get(transaction=transaction)
            if not post_snapshot.exists:
                raise ValueError("Post not found")
            
            like_snapshot = like_ref.get(transaction=transaction)
            
            if like_snapshot.exists:
                # Unlike
                transaction.delete(like_ref)
                transaction.update(post_ref, {"likes": firestore.Increment(-1)})
                return {"action": "unliked"}
            else:
                # Like
                transaction.set(like_ref, {
                    "user_id": user_id,
                    "post_id": post_id,
                    "created_at": datetime.now().isoformat()
                })
                transaction.update(post_ref, {"likes": firestore.Increment(1)})
                return {"action": "liked"}
        
        transaction = db.transaction()
        result = toggle_like_transaction(transaction)
        
        # Invalidate user's feed cache
        cache.delete(f"community_feed_{user_id}")
        
        return jsonify({"success": True, **result})
        
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except Exception as e:
        logger.error(f"Error toggling like: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to toggle like"}), 500
