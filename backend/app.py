from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from ocr_service import process_image_for_ingredients, process_image_for_all
from ai_service import generate_recipes
from image_service import get_image_url_from_bing
from auth_middleware import require_auth
from datetime import datetime, date

import firebase_admin
from firebase_admin import credentials, firestore
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

print("=" * 50)
print(f"[STARTUP] AI Cooking App Backend starting...")
print(f"[STARTUP] Environment: {os.getenv('FLASK_ENV', 'development')}")
print(f"[STARTUP] Port: {os.getenv('PORT', '5000')}")
print(f"[STARTUP] Python Version: {os.getenv('PYTHON_VERSION', 'Unknown')}")
print("=" * 50)

# --- KHỞI TẠO FIREBASE ---
try:
    # Ưu tiên đọc cấu hình từ biến môi trường (Cho Render)
    firebase_config = os.getenv("FIREBASE_CONFIG_JSON")
    if firebase_config:
        print("[FIREBASE] Đang khởi tạo từ biến môi trường...")
        cred_dict = json.loads(firebase_config)
        cred = credentials.Certificate(cred_dict)
    else:
        # Nếu không có biến môi trường, tìm file local
        print("[FIREBASE] Đang tìm file cấu hình local...")
        cred_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            cred = None
            print("[CANH BAO] Không tìm thấy cấu hình Firebase!")

    if cred:
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("[OK] Firebase đã kết nối thành công!")
    else:
        db = None
except Exception as e:
    print(f"[LOI] Khởi tạo Firebase thất bại: {e}")
    db = None

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "message": "Chào mừng bạn đến với AI Cooking App API!",
        "status": "online",
        "version": "1.0.0"
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend đang chạy!"})

@app.route('/api/scan-ingredients', methods=['POST'])
def scan_ingredients():
    """Nhận ảnh từ Android, dùng Gemini Vision AI để nhận diện nguyên liệu."""
    if 'image' not in request.files:
        return jsonify({"error": "Không tìm thấy file ảnh"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Tên file trống"}), 400
        
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Dùng Gemini Vision AI nhận diện nguyên liệu
        ingredients = process_image_for_ingredients(filepath)
        
        # Dọn dẹp file tạm
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({"ingredients": ingredients})

@app.route('/api/suggest-recipes', methods=['POST'])
def suggest_recipes():
    """Nhận danh sách nguyên liệu và hồ sơ sức khỏe, dùng Gemini AI gợi ý công thức món Việt."""
    data = request.get_json()
    if not data or 'ingredients' not in data:
        return jsonify({"error": "Vui lòng cung cấp danh sách nguyên liệu"}), 400
        
    ingredients = data['ingredients']
    health_profile = data.get('health_profile', None)
    
    # Dùng Gemini AI tạo công thức nấu ăn Việt Nam
    recipes = generate_recipes(ingredients, health_profile)
    
    return jsonify({"recipes": recipes})

@app.route('/api/scan-and-suggest', methods=['POST'])
@require_auth
def scan_and_suggest():
    """Nhận ảnh, nhận diện nguyên liệu và gợi ý công thức trong 1 bước duy nhất (Có check Quota)."""
    user_id = getattr(request, 'user_id', None)
    
    # Check Quota (giới hạn 3 lần / ngày)
    if db and user_id:
        today_str = date.today().isoformat()
        quota_ref = db.collection('quotas').document(f"{user_id}_{today_str}")
        quota_doc = quota_ref.get()
        
        usage_count = 0
        if quota_doc.exists:
            usage_count = quota_doc.to_dict().get('count', 0)
            
        if usage_count >= 3:
            return jsonify({"error": "Bạn đã hết lượt sử dụng AI miễn phí hôm nay (3/3 lượt). Vui lòng nâng cấp Pro!"}), 403

    print("[SERVER] Da nhan duoc yeu cau tu App...")
    if 'image' not in request.files:
        return jsonify({"error": "Không tìm thấy file ảnh"}), 400
        
    file = request.files['image']
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Parse health_profile
        import json
        health_profile = None
        health_profile_str = request.form.get('health_profile')
        if health_profile_str:
            try:
                health_profile = json.loads(health_profile_str)
            except:
                pass
        
        # Gọi hàm xử lý gộp
        result = process_image_for_all(filepath, health_profile)
        
        # Tăng Quota usage
        if db and user_id:
            if usage_count == 0:
                quota_ref.set({"count": 1, "date": today_str, "user_id": user_id})
            else:
                quota_ref.update({"count": firestore.Increment(1)})
        
        try:
            os.remove(filepath)
        except:
            pass
            
        return jsonify(result)

@app.route('/api/identify-dish', methods=['POST'])
def identify_dish():
    """Nhận ảnh một món ăn, dùng AI nhận diện tên món và gợi ý công thức."""
    if 'image' not in request.files:
        return jsonify({"error": "Không tìm thấy file ảnh"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Tên file trống"}), 400
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        from PIL import Image
        import google.generativeai as genai
        
        img = Image.open(filepath)
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = """Bạn là chuyên gia ẩm thực Việt Nam.
Hãy nhìn vào hình ảnh món ăn này và cho biết:
1. Tên món ăn (bằng tiếng Việt)
2. Mô tả ngắn gọn về món ăn
3. Danh sách nguyên liệu chính
4. Hướng dẫn nấu chi tiết từng bước
5. Thời gian chuẩn bị
6. Độ khó
7. Ước tính calories
8. Mẹo nấu ăn

Trả về kết quả dạng JSON hợp lệ (chỉ JSON, không markdown):
{
  "dish_name": "Tên món",
  "description": "Mô tả ngắn",
  "ingredients": ["nguyên liệu 1", "nguyên liệu 2"],
  "instructions": "Bước 1: ... Bước 2: ...",
  "prep_time": "30 phút",
  "difficulty": "Dễ",
  "calories": "350 kcal",
  "tips": "Mẹo nấu ăn",
  "origin": "Xuất xứ vùng miền"
}
"""
        
        try:
            response = model.generate_content([prompt, img])
            response_text = response.text.strip()
            
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            import json
            dish_info = json.loads(response_text)
            
            # Dọn dẹp file tạm
            try:
                os.remove(filepath)
            except:
                pass
            
            return jsonify({"dish": dish_info})
            
        except Exception as e:
            return jsonify({"error": f"Lỗi nhận diện: {str(e)}"}), 500

@app.route('/api/search-image', methods=['GET'])
def search_image():
    """Tìm kiếm ảnh chân thực 100% bằng query (tên món ăn hoặc thao tác)."""
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "Vui lòng cung cấp query 'q'"}), 400
        
    image_url = get_image_url_from_bing(query)
    if image_url:
        return jsonify({"url": image_url})
    else:
        return jsonify({"error": "Không tìm thấy ảnh"}), 404

# --- API FAVORITES (DATABASE) ---

@app.route('/api/favorites', methods=['GET'])
@require_auth
def get_favorites():
    """Lấy danh sách món ăn yêu thích từ Firestore của User hiện tại."""
    if not db:
        return jsonify({"error": "Database chưa được cấu hình"}), 500
    
    try:
        user_id = request.user_id
        favs_ref = db.collection('favorites').where('user_id', '==', user_id)
        docs = favs_ref.stream()
        
        favorites = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            favorites.append(data)
            
        return jsonify(favorites)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/favorites', methods=['POST'])
@require_auth
def add_favorite():
    """Lưu một món ăn vào danh sách yêu thích của User hiện tại."""
    if not db:
        return jsonify({"error": "Database chưa được cấu hình"}), 500
        
    data = request.get_json()
    if not data:
        return jsonify({"error": "Thiếu dữ liệu món ăn"}), 400
        
    try:
        user_id = request.user_id
        data['user_id'] = user_id
        data['created_at'] = datetime.now().isoformat()
        
        update_time, doc_ref = db.collection('favorites').add(data)
        
        return jsonify({
            "message": "Đã lưu vào yêu thích",
            "id": doc_ref.id
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/favorites/<fav_id>', methods=['DELETE'])
@require_auth
def delete_favorite(fav_id):
    """Xóa món ăn khỏi danh sách yêu thích."""
    if not db:
        return jsonify({"error": "Database chưa được cấu hình"}), 500
        
    try:
        user_id = request.user_id
        doc_ref = db.collection('favorites').document(fav_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return jsonify({"error": "Không tìm thấy món ăn"}), 404
            
        if doc.to_dict().get('user_id') != user_id:
            return jsonify({"error": "Không có quyền xóa món ăn này"}), 403
            
        doc_ref.delete()
        return jsonify({"message": "Đã xóa thành công"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    print(f"[CRITICAL-ERROR]: {repr(e)}")
    import traceback
    traceback.print_exc()
    return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("=" * 60)
        print("[CANH BAO] Chua cau hinh GEMINI_API_KEY!")
        print("-> Tao file .env trong thu muc backend voi noi dung:")
        print('   GEMINI_API_KEY=your_api_key_here')
        print("-> Lay API key mien phi tai: https://aistudio.google.com/apikey")
        print("=" * 60)
    else:
        print("[OK] Gemini API key da duoc cau hinh!")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
