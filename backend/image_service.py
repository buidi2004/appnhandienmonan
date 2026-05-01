import requests
import re
import urllib.parse

def get_image_url_from_bing(query: str) -> str:
    """
    Tìm kiếm và lấy URL ảnh đầu tiên từ Bing Images.
    Sử dụng requests để ổn định hơn trên môi trường Linux/Render.
    """
    try:
        query_quoted = urllib.parse.quote(query)
        # Thêm các tham số để Bing trả về kết quả tốt hơn
        url = f'https://www.bing.com/images/search?q={query_quoted}&first=1&scenario=ImageBasicHover'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.bing.com/'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        html = response.text
        
        # Strategy 1: Tìm murl trong data-bm (phổ biến nhất hiện nay)
        # Bing thường bọc JSON trong các thuộc tính HTML
        murl_matches = re.findall(r'murl&quot;:&quot;(http.*?)&quot;', html)
        if not murl_matches:
            # Thử regex không có entity encoding
            murl_matches = re.findall(r'"murl":"(http.*?)"', html)
            
        for match in murl_matches:
            # Loại bỏ các ảnh rác, icon hoặc ảnh của chính bing
            if any(ext in match.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                if 'bing.com' not in match and 'mm.bing.net' not in match:
                    return match
        
        # Strategy 2: Fallback tìm trực tiếp link ảnh trong thẻ img (thường là thumbnail nhưng vẫn thật hơn mock)
        img_matches = re.findall(r'src="(https?://[^"]+?\.(?:jpg|jpeg|png))"', html)
        for match in img_matches:
            if 'bing.com' not in match:
                return match
                
        # Strategy 3: Nếu vẫn không được, dùng Unsplash Source API (Real-time search)
        # Đây là cách cứu cánh để không bao giờ bị "hình ảnh mốc"
        return f"https://source.unsplash.com/800x600/?{query_quoted},food"

    except Exception as e:
        print(f"[IMAGE-SEARCH] Lỗi nghiêm trọng cho '{query}': {e}")
        # Trả về một ảnh Unsplash ngẫu nhiên theo chủ đề để tránh giao diện trống
        return f"https://source.unsplash.com/800x600/?vietnamese-food"
