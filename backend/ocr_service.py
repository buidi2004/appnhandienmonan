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

def process_image_for_all(image_path: str):
    """
    Dùng Gemini Vision AI để vừa nhận diện nguyên liệu vừa gợi ý công thức trong 1 lần gọi duy nhất.
    """
    try:
        img = Image.open(image_path)
        
        prompt = """Bạn là chuyên gia ẩm thực Việt Nam.
Hãy nhìn vào hình ảnh này và:
1. Liệt kê các nguyên liệu nhận diện được.
2. Gợi ý 3 công thức nấu món Việt Nam dựa trên các nguyên liệu đó.

Trả về kết quả duy nhất dưới dạng JSON (không markdown):
{
  "ingredients": ["tên nguyên liệu 1", "tên nguyên liệu 2"],
  "recipes": [
    {
      "title": "Tên món ăn",
      "ingredients": ["nguyên liệu 1", "nguyên liệu 2"],
      "instructions": "Bước 1: ... Bước 2: ...",
      "prep_time": "30 phút",
      "difficulty": "Dễ",
      "calories": "350 kcal",
      "health_warning": "Cảnh báo nếu có",
      "tips": "Mẹo nấu ăn"
    }
  ]
}
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
            return json.loads(json_str)
        else:
            # Nếu không tìm thấy {}, thử parse trực tiếp
            return json.loads(response_text)
        
    except Exception as e:
        print(f"[OCR-ALL] Lỗi: {e}")
        return {"ingredients": [], "recipes": []}
