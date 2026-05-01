import urllib.request
import urllib.parse
import re
import json

def get_image_url_from_bing(query: str) -> str:
    """
    Tìm kiếm và lấy URL ảnh đầu tiên từ Bing Images.
    Dùng để lấy ảnh món ăn chân thực 100%.
    Có fallback strategy nếu phương pháp chính thất bại.
    """
    try:
        query_quoted = urllib.parse.quote(query)
        url = f'https://www.bing.com/images/search?q={query_quoted}&form=HDRSC2'
        
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        response = urllib.request.urlopen(req, timeout=10)
        html = response.read().decode('utf-8', errors='ignore')
        
        # Strategy 1: Tìm URL ảnh qua murl pattern
        matches = re.findall(r'murl&quot;:&quot;(http.*?)&quot;', html)
        
        for match in matches:
            if not match.endswith(('.svg', '.gif')) and 'bing.com' not in match:
                return match
        
        # Strategy 2: Tìm qua thẻ img src  
        img_matches = re.findall(r'src="(https?://[^"]+\.(?:jpg|jpeg|png|webp))', html)
        for match in img_matches:
            if 'bing.com' not in match and 'microsoft.com' not in match:
                return match
                
        return None
    except Exception as e:
        print(f"[IMAGE-SEARCH] Lỗi khi tìm ảnh cho '{query}': {e}")
        return None
