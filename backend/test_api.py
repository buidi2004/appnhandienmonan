import requests
import os

def test_scan_and_suggest():
    url = "http://127.0.0.1:5000/api/scan-and-suggest"
    image_path = "uploads/photo.jpg" # Sử dụng ảnh có sẵn trong folder uploads
    
    if not os.path.exists(image_path):
        print(f"Lỗi: Không tìm thấy file {image_path}. Hãy quét thử 1 lần trên app trước.")
        return

    print(f"Sending request to {url}...")
    files = {'image': open(image_path, 'rb')}
    
    try:
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Success!")
            print(f"Ingredients: {data.get('ingredients')}")
            print(f"Recipes count: {len(data.get('recipes', []))}")
        else:
            print(f"Failed: {response.text}")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    test_scan_and_suggest()
