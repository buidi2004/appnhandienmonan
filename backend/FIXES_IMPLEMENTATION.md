# Hướng Dẫn Triển Khai Các Fix

## 1. Fix Auth Middleware Security

### File: `backend/middleware/auth_middleware.py`

Thay thế toàn bộ file bằng code sau:

```python
from functools import wraps
from flask import request, jsonify
from firebase_admin import auth
import os
import re
import logging

logger = logging.getLogger(__name__)

def _validate_local_token(id_token: str) -> str:
    """Validate local development token."""
    # Chỉ cho phép trong development
    if os.getenv("FLASK_ENV") != "development":
        raise ValueError("Local tokens not allowed in production")
    
    parts = id_token.split(":")
    if len(parts) < 2:
        raise ValueError("Invalid local token format")
    
    email = parts[1]
    # Validate email format
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        raise ValueError("Invalid email format")
    
    return email.replace(".", "_").replace("@", "_")

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "error": "Missing or invalid Authorization header"}), 401
        
        id_token = auth_header.split(" ")[1]
        
        try:
            if id_token.startswith("local-token:"):
                request.user_id = _validate_local_token(id_token)
            else:
                decoded_token = auth.verify_id_token(id_token)
                request.user_id = decoded_token.get("uid")
                
            if not request.user_id:
                raise ValueError("Invalid user ID")
                
        except ValueError as e:
            logger.warning(f"Token validation failed: {str(e)}")
            return jsonify({"success": False, "error": "Invalid token"}), 401
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}", exc_info=True)
            return jsonify({"success": False, "error": "Authentication failed"}), 401
            
        return f(*args, **kwargs)
    return decorated_function

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "error": "Missing or invalid Authorization header"}), 401
        
        id_token = auth_header.split(" ")[1]
        
        try:
            if id_token.startswith("local-token:"):
                user_id = _validate_local_token(id_token)
            else:
                decoded_token = auth.verify_id_token(id_token)
                user_id = decoded_token.get("uid")
                
            if not user_id:
                raise ValueError("Invalid user ID")
                
            request.user_id = user_id
            
        except ValueError as e:
            logger.warning(f"Token validation failed: {str(e)}")
            return jsonify({"success": False, "error": "Invalid token"}), 401
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}", exc_info=True)
            return jsonify({"success": False, "error": "Authentication failed"}), 401
            
        return f(user_id, *args, **kwargs)
    return decorated_function
```

---

## 2. Add Input Validation

### File: `backend/utils/validators.py` (Tạo mới)

```python
from datetime import datetime
from typing import Any, Dict, List
import re

class ValidationError(Exception):
    """Custom validation error."""
    pass

def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValidationError("Invalid email format")
    return True

def validate_pantry_item(data: Dict[str, Any]) -> bool:
    """Validate pantry item data."""
    # Name validation
    name = data.get('name')
    if not name or not isinstance(name, str) or len(name.strip()) == 0:
        raise ValidationError("Name is required and must be a non-empty string")
    if len(name) > 100:
        raise ValidationError("Name must be less than 100 characters")
    
    # Quantity validation
    quantity = data.get('quantity')
    if quantity is None:
        raise ValidationError("Quantity is required")
    if not isinstance(quantity, (int, float)):
        raise ValidationError("Quantity must be a number")
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than 0")
    
    # Unit validation
    unit = data.get('unit')
    if not unit or not isinstance(unit, str):
        raise ValidationError("Unit is required and must be a string")
    
    valid_units = ['kg', 'g', 'l', 'ml', 'cái', 'quả', 'củ', 'gói', 'hộp']
    if unit.lower() not in valid_units:
        raise ValidationError(f"Unit must be one of: {', '.join(valid_units)}")
    
    # Expiry date validation
    expiry_date = data.get('expiry_date')
    if expiry_date:
        try:
            datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            raise ValidationError("Invalid expiry date format. Use ISO 8601 format")
    
    return True

def validate_community_post(data: Dict[str, Any]) -> bool:
    """Validate community post data."""
    # Dish name
    dish_name = data.get('dish_name')
    if not dish_name or not isinstance(dish_name, str) or len(dish_name.strip()) == 0:
        raise ValidationError("Dish name is required")
    if len(dish_name) > 200:
        raise ValidationError("Dish name must be less than 200 characters")
    
    # Description
    description = data.get('description', '')
    if not isinstance(description, str):
        raise ValidationError("Description must be a string")
    if len(description) > 1000:
        raise ValidationError("Description must be less than 1000 characters")
    
    # Image URL
    image_url = data.get('image_url')
    if image_url and not isinstance(image_url, str):
        raise ValidationError("Image URL must be a string")
    if image_url and not image_url.startswith(('http://', 'https://')):
        raise ValidationError("Image URL must be a valid HTTP(S) URL")
    
    # Calories
    calories = data.get('calories', 0)
    if not isinstance(calories, (int, float)):
        raise ValidationError("Calories must be a number")
    if calories < 0 or calories > 10000:
        raise ValidationError("Calories must be between 0 and 10000")
    
    return True

def validate_ingredients_list(ingredients: List[str]) -> bool:
    """Validate ingredients list."""
    if not isinstance(ingredients, list):
        raise ValidationError("Ingredients must be a list")
    if len(ingredients) == 0:
        raise ValidationError("At least one ingredient is required")
    if len(ingredients) > 50:
        raise ValidationError("Maximum 50 ingredients allowed")
    
    for ingredient in ingredients:
        if not isinstance(ingredient, str):
            raise ValidationError("Each ingredient must be a string")
        if len(ingredient.strip()) == 0:
            raise ValidationError("Ingredient cannot be empty")
        if len(ingredient) > 100:
            raise ValidationError("Each ingredient must be less than 100 characters")
    
    return True

def sanitize_string(text: str, max_length: int = 1000) -> str:
    """Sanitize user input string."""
    if not isinstance(text, str):
        return ""
    # Remove control characters
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
    # Trim whitespace
    text = text.strip()
    # Limit length
    return text[:max_length]
```

---

## 3. Update Pantry Route với Validation

### File: `backend/routes/pantry.py`

```python
from flask import Blueprint, request, jsonify
from config import db
from middleware.auth_middleware import token_required
from utils.validators import validate_pantry_item, ValidationError, sanitize_string
from datetime import datetime
import logging

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
        data = request.json
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
```

---

## 4. Fix Race Condition trong Community Route

### File: `backend/routes/community.py`

```python
from flask import Blueprint, request, jsonify
from config import db
from firebase_admin import firestore
from middleware.auth_middleware import token_required
from utils.validators import validate_community_post, ValidationError, sanitize_string
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
community_bp = Blueprint('community', __name__)

@community_bp.route('/post', methods=['POST'])
@token_required
def create_community_post(user_id):
    try:
        data = request.json
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
        
        return jsonify({"success": True, "message": "Post created", "post_id": doc_ref.id}), 201
        
    except ValueError as e:
        return jsonify({"success": False, "error": "Invalid data type"}), 400
    except Exception as e:
        logger.error(f"Error creating post: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to create post"}), 500

@community_bp.route('/feed', methods=['GET'])
@token_required
def get_community_feed(user_id):
    try:
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
            user_likes_docs = db.collection('user_likes')\
                .where('user_id', '==', user_id)\
                .where('post_id', 'in', post_ids[:10])\
                .stream()  # Firestore limit 10 items in 'in' query
            
            liked_post_ids = {doc.to_dict()['post_id'] for doc in user_likes_docs}
            
            for post in posts:
                post['is_liked'] = post['id'] in liked_post_ids
        
        return jsonify({"success": True, "data": posts})
        
    except Exception as e:
        logger.error(f"Error getting feed: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to retrieve feed"}), 500

@community_bp.route('/like', methods=['POST'])
@token_required
def like_post(user_id):
    try:
        post_id = request.json.get('post_id')
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
        
        return jsonify({"success": True, **result})
        
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except Exception as e:
        logger.error(f"Error toggling like: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": "Failed to toggle like"}), 500
```

---

## 5. Update Config với Logging

### File: `backend/config.py`

```python
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv
import google.generativeai as genai
import logging

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

# --- APP CONFIG ---
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
MAX_UPLOAD_SIZE = int(os.getenv('MAX_UPLOAD_SIZE', '10485760'))  # 10MB default
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
```

---

## Cách Triển Khai

### Bước 1: Backup code hiện tại
```bash
cd backend
git add .
git commit -m "Backup before security fixes"
```

### Bước 2: Tạo file validators
```bash
mkdir -p backend/utils
touch backend/utils/__init__.py
# Copy nội dung validators.py vào backend/utils/validators.py
```

### Bước 3: Update các file theo thứ tự
1. `config.py`
2. `middleware/auth_middleware.py`
3. `routes/pantry.py`
4. `routes/community.py`

### Bước 4: Cập nhật .env
```bash
# Thêm vào .env
FLASK_ENV=development
MAX_UPLOAD_SIZE=10485760
UPLOAD_FOLDER=uploads
```

### Bước 5: Test
```bash
python -c "from utils.validators import *; print('Validators OK')"
python app.py
```

### Bước 6: Deploy
```bash
git add .
git commit -m "Security fixes: auth validation, input sanitization, race condition"
git push
```
