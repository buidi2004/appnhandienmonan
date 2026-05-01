from functools import wraps
from flask import request, jsonify
from firebase_admin import auth

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 1. Lấy header Authorization
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        # 2. Tách token
        id_token = auth_header.split(" ")[1]

        # 3. Xác thực bằng Firebase Admin
        try:
            decoded_token = auth.verify_id_token(id_token)
            request.user_id = decoded_token.get("uid")
        except Exception as e:
            return jsonify({"error": "Invalid token", "details": str(e)}), 401

        # 4. Cho phép đi tiếp vào route
        return f(*args, **kwargs)

    return decorated_function
