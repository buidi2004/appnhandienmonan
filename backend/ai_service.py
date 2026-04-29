import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-flash-latest")

def generate_recipes(ingredients: list[str]) -> list[dict]:
    """
    Dùng Gemini AI để gợi ý các món ăn Việt Nam dựa trên nguyên liệu đã cho.
    Trả về danh sách công thức nấu ăn chi tiết bằng tiếng Việt.
    """
    ingredients_str = ", ".join(ingredients)
    
    prompt = f"""Bạn là đầu bếp chuyên nghiệp về ẩm thực Việt Nam.
Với các nguyên liệu sau: {ingredients_str}

Hãy gợi ý 3 món ăn Việt Nam có thể nấu được từ những nguyên liệu này.

Trả về kết quả ở dạng JSON hợp lệ (chỉ JSON, không có markdown hay text thừa) theo định dạng sau:
[
  {{
    "title": "Tên món ăn",
    "ingredients": ["nguyên liệu 1", "nguyên liệu 2"],
    "instructions": "Bước 1: ... Bước 2: ... Bước 3: ...",
    "prep_time": "30 phút",
    "difficulty": "Dễ",
    "calories": "350 kcal",
    "health_warning": "Lưu ý sức khỏe: Không phù hợp cho trẻ em dưới 3 tuổi và người mắc bệnh tiểu đường (Ghi rõ lứa tuổi/bệnh lý không phù hợp. Nếu an toàn thì ghi 'Phù hợp cho mọi lứa tuổi và thể trạng').",
    "tips": "Mẹo nhỏ giúp món ăn ngon hơn"
  }}
]

Lưu ý:
- Ưu tiên các món ăn Việt Nam truyền thống
- Hướng dẫn chi tiết từng bước
- Ước tính thời gian và độ khó chính xác
- Thêm mẹo nấu ăn hữu ích
"""
    
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Xử lý trường hợp Gemini trả về markdown code block
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        recipes = json.loads(response_text)
        print(f"[AI] Đã tạo {len(recipes)} công thức nấu ăn")
        return recipes
        
    except json.JSONDecodeError as e:
        print(f"[AI] Lỗi parse JSON: {e}")
        print(f"[AI] Response gốc: {response_text}")
        # Trả về dữ liệu mẫu nếu parse lỗi
        return [
            {
                "title": f"Món ăn từ {ingredients_str}",
                "ingredients": ingredients,
                "instructions": "Đang cập nhật công thức...",
                "prep_time": "30 phút",
                "difficulty": "Trung bình",
                "calories": "N/A",
                "health_warning": "Chưa có thông tin cảnh báo sức khỏe.",
                "tips": "Hãy thử lại để nhận công thức chi tiết hơn."
            }
        ]
    except Exception as e:
        print(f"[AI] Lỗi khi tạo công thức: {e}")
        return [
            {
                "title": "Lỗi kết nối AI",
                "ingredients": ingredients,
                "instructions": f"Lỗi: {str(e)}",
                "prep_time": "N/A",
                "difficulty": "N/A",
                "calories": "N/A",
                "health_warning": "Lỗi hệ thống.",
                "tips": "Vui lòng kiểm tra API key và thử lại."
            }
        ]
