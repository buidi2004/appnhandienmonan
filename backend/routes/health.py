from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running!"})

@health_bp.route('/index', methods=['GET'])
def index():
    return jsonify({
        "message": "Welcome to AI Cooking App API!",
        "status": "online",
        "version": "1.1.0"
    })
