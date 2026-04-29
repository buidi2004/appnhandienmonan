from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from ocr_service import process_image_for_ingredients, process_image_for_all
from ai_service import generate_recipes

load_dotenv()

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

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
    """Nhận danh sách nguyên liệu, dùng Gemini AI gợi ý công thức món Việt."""
    data = request.get_json()
    if not data or 'ingredients' not in data:
        return jsonify({"error": "Vui lòng cung cấp danh sách nguyên liệu"}), 400
        
    ingredients = data['ingredients']
    
    # Dùng Gemini AI tạo công thức nấu ăn Việt Nam
    recipes = generate_recipes(ingredients)
    
    return jsonify({"recipes": recipes})

@app.route('/api/scan-and-suggest', methods=['POST'])
def scan_and_suggest():
    """Nhận ảnh, nhận diện nguyên liệu và gợi ý công thức trong 1 bước duy nhất."""
    print("[SERVER] Da nhan duoc yeu cau tu App...")
    if 'image' not in request.files:
        print("[SERVER] Loi: Khong tim thay file anh")
        return jsonify({"error": "Không tìm thấy file ảnh"}), 400
        
    file = request.files['image']
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        print(f"[SERVER] Da luu file tam: {filepath}")
        
        # Gọi hàm xử lý gộp
        result = process_image_for_all(filepath)
        print(f"[SERVER] Ket qua xu ly: {len(result.get('ingredients', []))} nglieu, {len(result.get('recipes', []))} mon")
        
        # Dọn dẹp
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
