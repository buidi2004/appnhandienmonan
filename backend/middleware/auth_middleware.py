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
