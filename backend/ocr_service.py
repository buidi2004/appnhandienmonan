import os
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-flash-latest")

def process_image_for_ingredients(image_path: str) -> list[str]:
    """
    Dùng Gemini Vision AI để phân tích hình ảnh và nhận diện nguyên liệu thực phẩm.
    Trả về danh sách nguyên liệu bằng tiếng Việt.
    """
    try:
        img = Image.open(image_path)
        
        prompt = """Bạn là chuyên gia ẩm thực Việt Nam.
Hãy nhìn vào hình ảnh này và liệt kê TẤT CẢ các nguyên liệu thực phẩm mà bạn nhận diện được.
Trả lời bằng tiếng Việt.
Chỉ trả về danh sách nguyên liệu, mỗi nguyên liệu trên một dòng.
Không thêm số thứ tự, gạch đầu dòng hay ký hiệu gì khác.
Ví dụ:
Cà chua
Thịt bò
Hành tây
"""
        
        response = model.generate_content([prompt, img])
        
        # Parse response into list
        ingredients_text = response.text.strip()
        ingredients = [line.strip() for line in ingredients_text.split("\n") if line.strip()]
        
        print(f"[OCR] Đã nhận diện được {len(ingredients)} nguyên liệu: {ingredients}")
        return ingredients
        
    except Exception as e:
        print(f"[OCR] Lỗi khi phân tích ảnh: {e}")
        # Fallback nếu API lỗi
        return ["Không nhận diện được nguyên liệu. Vui lòng thử lại."]

def process_image_for_all(image_path: str, health_profile: dict = None):
    """
    Dùng Gemini Vision AI để vừa nhận diện nguyên liệu vừa gợi ý công thức trong 1 lần gọi duy nhất.
    """
    try:
        img = Image.open(image_path)
        
        health_context = ""
        if health_profile:
            conditions = ", ".join(health_profile.get('conditions', [])) or "Không"
            symptoms = ", ".join(health_profile.get('symptoms', [])) or "Không"
            diet = health_profile.get('diet', 'Bình thường')
            allergies = ", ".join(health_profile.get('allergies', [])) or "Không"
            
            health_context = f"""
⚠️ QUAN TRỌNG - Người dùng có hồ sơ sức khỏe sau:
- Bệnh lý: {conditions}
- Triệu chứng hiện tại: {symptoms}
- Chế độ ăn: {diet}
- Dị ứng/Kiêng kỵ: {allergies}

YÊU CẦU BẮT BUỘC:
1. Gợi ý món ăn PHẢI PHÙ HỢP TUYỆT ĐỐI với hồ sơ sức khỏe trên.
2. NẾU có nguyên liệu gây dị ứng hoặc không tốt cho bệnh lý/chế độ ăn, hãy loại bỏ hoặc thay thế bằng nguyên liệu khác (Ghi rõ trong substitutions).
3. Đánh giá điểm sức khỏe (health_score) từ 0-100 dựa trên mức độ phù hợp với hồ sơ.
"""
        
        prompt = f"""Bạn là đầu bếp và chuyên gia dinh dưỡng chuyên về ẩm thực Việt Nam.
Hãy nhìn vào hình ảnh này và:
1. Liệt kê các nguyên liệu nhận diện được.
2. Gợi ý 3 công thức nấu món Việt Nam dựa trên các nguyên liệu đó.

{health_context}

Trả về kết quả duy nhất dưới dạng JSON (không markdown):
{{
  "ingredients": ["tên nguyên liệu 1", "tên nguyên liệu 2"],
  "recipes": [
    {{
      "title": "Tên món ăn",
      "ingredients": ["nguyên liệu 1", "nguyên liệu 2"],
      "instructions": "Bước 1: ... Bước 2: ...",
      "prep_time": "30 phút",
      "difficulty": "Dễ",
      "calories": "350 kcal",
      "health_score": 95,
      "health_benefits": ["Giàu vitamin C", "Tốt cho tiêu hóa"],
      "health_warnings": ["Hạn chế ăn nhiều nếu đau dạ dày"],
      "substitutions": [{{"original": "Đường", "replacement": "Đường kiêng", "reason": "Tiểu đường"}}],
      "nutrition_detail": {{"carbs": "15g", "protein": "20g", "fat": "8g", "sugar": "3g", "sodium": "400mg"}},
      "tips": "Mẹo nấu ăn"
    }}
  ]
        }}
        """
        
        response = model.generate_content([prompt, img])
        response_text = response.text.strip()
        # print(f"[GEMINI-RESPONSE]: {response_text}") # Tạm đóng vì lỗi encoding trên Windows Terminal
        
        import re
        import json
        
        # Tìm kiếm khối JSON trong phản hồi (tránh lỗi nếu Gemini trả về text thừa)
        json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
            result = json.loads(json_str)
            
            # TỐI ƯU HIỆU NĂNG: Lấy ảnh Bing cho các món ăn
            from concurrent.futures import ThreadPoolExecutor
            from image_service import get_image_url_from_bing
            
            def add_image_to_recipe(recipe):
                img_url = get_image_url_from_bing(recipe.get('title', 'Món ăn Việt Nam'))
                if img_url:
                    recipe['imageUrl'] = img_url
                return recipe

            if 'recipes' in result:
                with ThreadPoolExecutor(max_workers=3) as executor:
                    result['recipes'] = list(executor.map(add_image_to_recipe, result['recipes']))
            
            return result
        else:
            # Nếu không tìm thấy {}, thử parse trực tiếp
            return json.loads(response_text)
        
    except Exception as e:
        print(f"[OCR-ALL] Lỗi: {e}")
        return {"ingredients": [], "recipes": []}
