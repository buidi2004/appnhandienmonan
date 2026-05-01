import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-flash-latest")

def generate_recipes(ingredients: list[str], health_profile: dict = None) -> list[dict]:
    """
    Dùng Gemini AI để gợi ý các món ăn Việt Nam dựa trên nguyên liệu đã cho và hồ sơ sức khỏe.
    Trả về danh sách công thức nấu ăn chi tiết bằng tiếng Việt.
    """
    ingredients_str = ", ".join(ingredients)
    
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
2. NẾU có nguyên liệu gây dị ứng hoặc không tốt cho bệnh lý/chế độ ăn, hãy loại bỏ hoặc thay thế bằng nguyên liệu khác (Ghi rõ trong phần substitutions).
3. Đánh giá điểm sức khỏe (health_score) từ 0-100 dựa trên mức độ phù hợp với hồ sơ.
"""

    prompt = f"""Bạn là đầu bếp và chuyên gia y tế chuyên về ẩm thực Việt Nam.
Với các nguyên liệu sau: {ingredients_str}

Hãy kiểm tra xem các từ khóa trên có thực sự là nguyên liệu nấu ăn hay không. Nếu không có nguyên liệu nào hợp lệ, hoặc toàn những từ vô nghĩa/đồ vật không ăn được, hãy tạo 1 JSON duy nhất với tiêu đề "Không tìm thấy nguyên liệu", và ghi rõ lý do vào phần "instructions".

Nếu có nguyên liệu hợp lệ, hãy gợi ý 3 món ăn Việt Nam có thể nấu được từ những nguyên liệu này.
Mỗi món cần nói rõ nguyên liệu nào người dùng đã có, nguyên liệu nào cần mua thêm, và mức sẵn sàng để nấu.
{health_context}

TRẢ VỀ KẾT QUẢ DƯỚI DẠNG MẢNG JSON HỢP LỆ (BẮT BUỘC, CHỈ JSON, KHÔNG CÓ MARKDOWN HAY TEXT NÀO KHÁC BÊN NGOÀI). Định dạng chuẩn như sau:
[
  {{
    "title": "Tên món ăn",
    "ingredients": ["nguyên liệu 1", "nguyên liệu 2"],
    "available_ingredients": ["nguyên liệu người dùng đã có"],
    "missing_ingredients": ["nguyên liệu cần mua thêm"],
    "readiness": "ready",
    "instructions": "Bước 1: [chi tiết cách làm]... Bước 2: [chi tiết]... Bước 3: [chi tiết]...",
    "prep_time": "30 phút",
    "difficulty": "Dễ",
    "calories": "350 kcal",
    "health_score": 95,
    "health_benefits": ["Giàu vitamin C", "Tốt cho người tiểu đường"],
    "health_warnings": ["Hạn chế ăn mặn nếu huyết áp cao", "Lưu ý không dùng nếu dị ứng..."],
    "substitutions": [{{"original": "Đường", "replacement": "Đường ăn kiêng", "reason": "Dành cho người tiểu đường"}}],
    "nutrition_detail": {{"carbs": "15g", "protein": "20g", "fat": "8g", "sugar": "3g", "sodium": "400mg"}},
    "tips": "Mẹo nhỏ giúp món ăn ngon hơn"
  }}
]

        Lưu ý: 
        * Hướng dẫn nấu (instructions) cần chi tiết nhưng súc tích (3-5 bước chính).
        * readiness chỉ dùng một trong ba giá trị: "ready", "missing_items", "health_check".
        * missing_ingredients để mảng rỗng nếu có thể nấu ngay bằng nguyên liệu đã đưa.
        * health_warnings: Ngắn gọn, thiết thực.
        * Đầu ra CHỈ LÀ JSON, không bọc markdown.
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
        
        # TỐI ƯU HIỆU NĂNG: Lấy ảnh Bing cho tất cả món ăn trong 1 lần gọi duy nhất (đa luồng)
        from concurrent.futures import ThreadPoolExecutor
        from image_service import get_image_url_from_bing
        
        def add_image_to_recipe(recipe):
            img_url = get_image_url_from_bing(recipe.get('title', 'Món ăn Việt Nam'))
            if img_url:
                recipe['imageUrl'] = img_url
            return recipe

        with ThreadPoolExecutor(max_workers=3) as executor:
            recipes = list(executor.map(add_image_to_recipe, recipes))

        print(f"[AI] Đã tạo {len(recipes)} công thức nấu ăn kèm ảnh")
        return recipes
        
    except json.JSONDecodeError as e:
        print(f"[AI] Lỗi parse JSON: {e}")
        print(f"[AI] Response gốc: {response_text}")
        # Trả về dữ liệu mẫu nếu parse lỗi
        return [
            {
                "title": f"Món ăn từ {ingredients_str}",
                "ingredients": ingredients,
                "available_ingredients": ingredients,
                "missing_ingredients": [],
                "readiness": "health_check",
                "instructions": "Xin lỗi, AI không thể phân tích và tạo công thức vào lúc này do định dạng phản hồi không hợp lệ. Vui lòng thử lại với nguyên liệu khác.",
                "prep_time": "N/A",
                "difficulty": "Không xác định",
                "calories": "N/A",
                "health_score": 0,
                "health_benefits": [],
                "health_warnings": ["Không có dữ liệu sức khỏe do quá trình phân tích thất bại."],
                "substitutions": [],
                "nutrition_detail": {},
                "tips": "Mẹo: Thử cung cấp rõ ràng hơn tên các nguyên liệu thực tế."
            }
        ]
    except Exception as e:
        print(f"[AI] Lỗi khi tạo công thức: {e}")
        return [
            {
                "title": "Lỗi kết nối AI",
                "ingredients": ingredients,
                "available_ingredients": ingredients,
                "missing_ingredients": [],
                "readiness": "health_check",
                "instructions": f"Lỗi: {str(e)}",
                "prep_time": "N/A",
                "difficulty": "N/A",
                "calories": "N/A",
                "health_score": 0,
                "health_benefits": [],
                "health_warnings": ["Lỗi hệ thống."],
                "substitutions": [],
                "nutrition_detail": {},
                "tips": "Vui lòng kiểm tra API key và thử lại."
            }
        ]
