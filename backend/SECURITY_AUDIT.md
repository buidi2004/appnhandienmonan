# Báo Cáo Kiểm Tra Bảo Mật & Chất Lượng Code Backend

## Tổng Quan
- **Ngày kiểm tra**: 2026-05-10
- **Tổng số file kiểm tra**: 12 files Python
- **Mức độ nghiêm trọng**: TRUNG BÌNH - CAO

---

## 🔴 CÁC VẤN ĐỀ NGHIÊM TRỌNG (CRITICAL)

### 1. **Security: Local Token Bypass trong Auth Middleware**
**File**: `backend/middleware/auth_middleware.py`
**Dòng**: 13-16, 30-33

**Vấn đề**:
```python
if id_token.startswith("local-token:"):
    parts = id_token.split(":")
    email = parts[1] if len(parts) > 1 else "unknown"
    user_id = email.replace(".", "_").replace("@", "_")
```

**Rủi ro**:
- Cho phép bypass authentication bằng cách gửi token dạng `local-token:email@example.com`
- Không có validation email format
- Có thể giả mạo user_id bất kỳ
- **Mức độ**: CRITICAL - Có thể dẫn đến unauthorized access

**Khuyến nghị**:
```python
# Chỉ cho phép local token trong development mode
if id_token.startswith("local-token:"):
    if os.getenv("FLASK_ENV") != "development":
        return jsonify({"error": "Local tokens not allowed in production"}), 401
    # Thêm validation email
    import re
    parts = id_token.split(":")
    if len(parts) < 2:
        return jsonify({"error": "Invalid local token format"}), 401
    email = parts[1]
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return jsonify({"error": "Invalid email format"}), 401
    user_id = email.replace(".", "_").replace("@", "_")
```

---

### 2. **Security: Missing Input Validation**
**Files**: Tất cả routes

**Vấn đề**:
- Không validate input data từ `request.json`
- Không kiểm tra data types
- Không sanitize user input trước khi lưu vào database
- Có thể dẫn đến NoSQL injection hoặc data corruption

**Ví dụ lỗi** (`routes/pantry.py`):
```python
item_data = {
    "name": data.get('name'),  # Không validate
    "quantity": data.get('quantity'),  # Không check type
    "unit": data.get('unit'),
    "expiry_date": data.get('expiry_date'),  # Không validate date format
}
```

**Khuyến nghị**:
```python
from datetime import datetime

def validate_pantry_item(data):
    if not data.get('name') or not isinstance(data.get('name'), str):
        raise ValueError("Invalid name")
    if not isinstance(data.get('quantity'), (int, float)) or data.get('quantity') <= 0:
        raise ValueError("Invalid quantity")
    if data.get('expiry_date'):
        try:
            datetime.fromisoformat(data.get('expiry_date'))
        except:
            raise ValueError("Invalid date format")
    return True

# Trong route:
try:
    validate_pantry_item(data)
except ValueError as e:
    return jsonify({"error": str(e)}), 400
```

---

### 3. **Security: Sensitive Data Exposure**
**File**: `backend/config.py`

**Vấn đề**:
```python
print(f"[ERROR] Firebase init failed: {e}")
print("[WARNING] GEMINI_API_KEY not found!")
```

**Rủi ro**:
- Log có thể chứa thông tin nhạy cảm (stack traces, credentials)
- Trong production, logs có thể bị exposed

**Khuyến nghị**:
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Thay vì print:
logger.error("Firebase init failed", exc_info=False)  # Không log full exception
logger.warning("GEMINI_API_KEY not configured")
```

---

## 🟠 CÁC VẤN ĐỀ QUAN TRỌNG (HIGH)

### 4. **Performance: N+1 Query Problem**
**File**: `backend/routes/community.py`

**Vấn đề**:
```python
posts_docs = db.collection('community_posts').order_by('created_at', direction=firestore.Query.DESCENDING).limit(50).stream()
posts = []
for doc in posts_docs:
    d = doc.to_dict()
    d['id'] = doc.id
    d['is_liked'] = user_id in d.get('liked_by', [])  # Kiểm tra trong Python thay vì query
    posts.append(d)
```

**Vấn đề**:
- Lấy tất cả 50 posts với toàn bộ `liked_by` array
- Nếu mỗi post có 1000 likes, sẽ tải 50,000 user IDs không cần thiết

**Khuyến nghị**:
```python
# Tạo index riêng cho user likes
# Hoặc sử dụng subcollection:
# /community_posts/{postId}/likes/{userId}

# Query hiệu quả hơn:
posts_docs = db.collection('community_posts').order_by('created_at', direction=firestore.Query.DESCENDING).limit(50).stream()
post_ids = [doc.id for doc in posts_docs]

# Batch check likes
user_likes = db.collection('user_likes').where('user_id', '==', user_id).where('post_id', 'in', post_ids).stream()
liked_post_ids = {doc.to_dict()['post_id'] for doc in user_likes}

# Rebuild posts with is_liked
for post in posts:
    post['is_liked'] = post['id'] in liked_post_ids
```

---

### 5. **Error Handling: Overly Broad Exception Catching**
**Files**: Tất cả routes

**Vấn đề**:
```python
except Exception as e:
    return jsonify({"error": str(e)}), 500
```

**Rủi ro**:
- Catch tất cả exceptions, kể cả system errors
- Expose internal error messages cho client
- Khó debug vì không log đầy đủ

**Khuyến nghị**:
```python
import traceback
import logging

logger = logging.getLogger(__name__)

try:
    # ... code
except ValueError as e:
    return jsonify({"error": "Invalid input", "details": str(e)}), 400
except PermissionError as e:
    return jsonify({"error": "Permission denied"}), 403
except Exception as e:
    logger.error(f"Unexpected error in {request.endpoint}", exc_info=True)
    # Không expose internal error
    return jsonify({"error": "Internal server error"}), 500
```

---

### 6. **Race Condition: Concurrent Like Updates**
**File**: `backend/routes/community.py`

**Vấn đề**:
```python
liked_by = post_doc.to_dict().get('liked_by', [])
if user_id in liked_by:
    post_ref.update({
        "likes": firestore.Increment(-1),
        "liked_by": firestore.ArrayRemove([user_id])
    })
```

**Rủi ro**:
- Nếu 2 requests cùng lúc, có thể:
  - User like 2 lần
  - Likes count không khớp với liked_by array

**Khuyến nghị**:
```python
# Sử dụng transaction
from firebase_admin import firestore

@firestore.transactional
def toggle_like(transaction, post_ref, user_id):
    snapshot = post_ref.get(transaction=transaction)
    liked_by = snapshot.get('liked_by') or []
    
    if user_id in liked_by:
        transaction.update(post_ref, {
            'likes': firestore.Increment(-1),
            'liked_by': firestore.ArrayRemove([user_id])
        })
    else:
        transaction.update(post_ref, {
            'likes': firestore.Increment(1),
            'liked_by': firestore.ArrayUnion([user_id])
        })

# Trong route:
transaction = db.transaction()
toggle_like(transaction, post_ref, user_id)
```

---

## 🟡 CÁC VẤN ĐỀ TRUNG BÌNH (MEDIUM)

### 7. **Code Quality: Missing Type Hints**
**Files**: Tất cả files

**Vấn đề**:
- Không có type hints cho function parameters và return types
- Khó maintain và debug

**Khuyến nghị**:
```python
from typing import List, Dict, Optional

def suggest_substitutions(ingredient: str) -> List[str]:
    """Gợi ý nguyên liệu thay thế."""
    pass

def generate_recipes(ingredients: List[str], health_profile: Optional[Dict] = None) -> List[Dict]:
    """Tạo công thức nấu ăn."""
    pass
```

---

### 8. **Resource Management: Missing File Cleanup**
**File**: `backend/routes/ai_analysis.py`

**Vấn đề**:
```python
file = request.files['image']
image_data = file.read()
```

**Rủi ro**:
- File được upload nhưng không được cleanup
- Memory leak nếu file lớn

**Khuyến nghị**:
```python
import tempfile
import os

try:
    file = request.files['image']
    # Lưu vào temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name
    
    # Process file
    image_data = open(tmp_path, 'rb').read()
    
    # ... xử lý
    
finally:
    # Cleanup
    if os.path.exists(tmp_path):
        os.remove(tmp_path)
```

---

### 9. **API Design: Inconsistent Response Format**
**Files**: Tất cả routes

**Vấn đề**:
- Một số endpoint trả về `{"status": "success"}`
- Một số trả về `{"message": "Success"}`
- Một số trả về data trực tiếp

**Khuyến nghị**:
```python
# Chuẩn hóa response format
def success_response(data=None, message="Success", status_code=200):
    response = {"success": True, "message": message}
    if data is not None:
        response["data"] = data
    return jsonify(response), status_code

def error_response(message, status_code=400, details=None):
    response = {"success": False, "error": message}
    if details:
        response["details"] = details
    return jsonify(response), status_code
```

---

### 10. **Configuration: Hardcoded Values**
**Files**: Multiple

**Vấn đề**:
```python
MAX_BATCH = 5  # Hardcoded
IMAGE_CACHE_TTL_SECONDS = 21600  # Hardcoded
```

**Khuyến nghị**:
```python
# Trong config.py
MAX_BATCH_SIZE = int(os.getenv('MAX_BATCH_SIZE', '5'))
IMAGE_CACHE_TTL = int(os.getenv('IMAGE_CACHE_TTL', '21600'))
UPLOAD_MAX_SIZE = int(os.getenv('UPLOAD_MAX_SIZE', '10485760'))  # 10MB
```

---

## 🟢 CÁC VẤN ĐỀ NHỎ (LOW)

### 11. **Code Style: Inconsistent Naming**
- Một số biến dùng snake_case
- Một số dùng camelCase
- Không tuân thủ PEP 8

### 12. **Documentation: Missing Docstrings**
- Hầu hết functions không có docstring
- Khó hiểu logic và parameters

### 13. **Testing: No Unit Tests**
- Không có test files
- Không có test coverage

---

## 📋 KHUYẾN NGHỊ ƯU TIÊN

### Ưu tiên 1 (Ngay lập tức):
1. ✅ Fix local token bypass security issue
2. ✅ Add input validation cho tất cả routes
3. ✅ Implement proper error logging

### Ưu tiên 2 (Tuần này):
4. ✅ Fix race condition trong like feature
5. ✅ Optimize N+1 query problem
6. ✅ Add file cleanup logic

### Ưu tiên 3 (Tháng này):
7. ✅ Add type hints
8. ✅ Standardize API responses
9. ✅ Move hardcoded values to config
10. ✅ Write unit tests

---

## 🛠️ CÔNG CỤ ĐỀ XUẤT

### Linting & Formatting:
```bash
pip install black flake8 pylint mypy
black backend/
flake8 backend/ --max-line-length=120
mypy backend/
```

### Security Scanning:
```bash
pip install bandit safety
bandit -r backend/
safety check
```

### Testing:
```bash
pip install pytest pytest-cov
pytest backend/tests/ --cov=backend
```

---

## 📊 TỔNG KẾT

| Mức độ | Số lượng | Đã fix | Còn lại |
|--------|----------|--------|---------|
| 🔴 Critical | 3 | 0 | 3 |
| 🟠 High | 3 | 0 | 3 |
| 🟡 Medium | 4 | 0 | 4 |
| 🟢 Low | 3 | 0 | 3 |
| **Tổng** | **13** | **0** | **13** |

**Khuyến nghị**: Nên fix ít nhất các vấn đề Critical và High trước khi deploy production.
