import requests
import re
import urllib.parse
import os
import time
import logging
from typing import Optional, Tuple, Dict

logger = logging.getLogger(__name__)

IMAGE_CACHE_TTL_SECONDS = int(os.getenv('IMAGE_CACHE_TTL_SECONDS', '21600'))
IMAGE_CACHE_MAX_SIZE = int(os.getenv('IMAGE_CACHE_MAX_SIZE', '200'))
_image_cache: Dict[str, Tuple[str, float]] = {}

def _get_cached_image(query: str) -> Optional[str]:
    key = query.strip().lower()
    if not key:
        return None
    cached = _image_cache.get(key)
    if not cached:
        return None
    url, timestamp = cached
    if time.time() - timestamp > IMAGE_CACHE_TTL_SECONDS:
        _image_cache.pop(key, None)
        return None
    return url

def _set_cached_image(query: str, url: str) -> None:
    key = query.strip().lower()
    if not key:
        return
    _image_cache[key] = (url, time.time())
    if len(_image_cache) <= IMAGE_CACHE_MAX_SIZE:
        return
    # Trim oldest entries to keep memory bounded
    oldest = sorted(_image_cache.items(), key=lambda item: item[1][1])
    for item in oldest[: max(1, IMAGE_CACHE_MAX_SIZE // 4)]:
        _image_cache.pop(item[0], None)

def get_image_url_from_bing(query: str) -> str:
    """
    Tìm kiếm và lấy URL ảnh đầu tiên từ Bing Images.
    Sử dụng đa chiến lược để đảm bảo luôn có ảnh thật.
    """
    try:
        cached = _get_cached_image(query)
        if cached:
            return cached

        query_quoted = urllib.parse.quote(query)
        url = f'https://www.bing.com/images/search?q={query_quoted}&first=1&scenario=ImageBasicHover'
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.bing.com/'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        html = response.text
        
        # Chiến thuật 1: Parse murl từ JSON bọc trong HTML entities
        patterns = [
            r'murl&quot;:&quot;(http.*?)&quot;',
            r'"murl":"(http.*?)"',
            r'murl":"(http.*?)"',
            r'mediaurl&quot;:&quot;(http.*?)&quot;'
        ]
        
        all_matches = []
        for pattern in patterns:
            matches = re.findall(pattern, html)
            all_matches.extend(matches)
            
        for match in all_matches:
            clean_url = match.replace('\\/', '/').replace('&amp;', '&')
            if any(ext in clean_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                if 'bing.com' not in clean_url and 'mm.bing.net' not in clean_url:
                    _set_cached_image(query, clean_url)
                    return clean_url
        
        # Chiến thuật 2: Tìm ảnh trong thẻ img trực tiếp
        img_src_matches = re.findall(r'src="(https?://[^"]+?\.(?:jpg|jpeg|png|webp))"', html)
        for src in img_src_matches:
            if 'bing.com' not in src and 'tse' not in src:
                _set_cached_image(query, src)
                return src

        # Chiến thuật 3: Fallback Unsplash ổn định
        fallback = f"https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop"
        if "phở" in query.lower() or "bún" in query.lower():
            fallback = "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=800&auto=format&fit=crop"
        elif "cơm" in query.lower():
            fallback = "https://images.unsplash.com/photo-1512058560366-cd2429bb5c63?q=80&w=800&auto=format&fit=crop"
            
        _set_cached_image(query, fallback)
        return fallback

    except Exception as e:
        print(f"[IMAGE-SERVICE] Lỗi: {e}")
        logger.error(f"Error getting image from Bing: {str(e)}", exc_info=True)
        return "https://images.unsplash.com/photo-1495195129352-aec325b55b65?q=80&w=800&auto=format&fit=crop"

