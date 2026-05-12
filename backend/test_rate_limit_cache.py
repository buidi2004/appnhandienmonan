"""
Test script for Rate Limiting and Caching functionality.
Run this after starting the backend server.
"""

import requests
import time
import json
from typing import Dict, Any

BASE_URL = "http://localhost:5000"
TEST_TOKEN = "local-token:test@example.com"
HEADERS = {"Authorization": f"Bearer {TEST_TOKEN}"}

def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_rate_limiting():
    """Test rate limiting on AI endpoints."""
    print_section("TEST 1: Rate Limiting")
    
    endpoint = f"{BASE_URL}/api/ai/suggest-recipes"
    data = {"ingredients": ["chicken", "rice"]}
    
    print(f"\nTesting endpoint: {endpoint}")
    print(f"Rate limit: 10 requests per minute")
    print("\nSending 12 requests rapidly...\n")
    
    success_count = 0
    rate_limited_count = 0
    
    for i in range(12):
        try:
            response = requests.post(endpoint, json=data, headers=HEADERS, timeout=5)
            
            if response.status_code == 200:
                success_count += 1
                print(f"Request {i+1}: ✅ Success (200)")
            elif response.status_code == 429:
                rate_limited_count += 1
                print(f"Request {i+1}: 🛑 Rate Limited (429)")
                print(f"  Response: {response.json()}")
            else:
                print(f"Request {i+1}: ⚠️  Unexpected status {response.status_code}")
                
        except requests.exceptions.Timeout:
            print(f"Request {i+1}: ⏱️  Timeout")
        except Exception as e:
            print(f"Request {i+1}: ❌ Error: {str(e)}")
        
        time.sleep(0.1)  # Small delay between requests
    
    print(f"\n📊 Results:")
    print(f"  Success: {success_count}")
    print(f"  Rate Limited: {rate_limited_count}")
    print(f"  Expected: First 10 success, last 2 rate limited")
    
    if rate_limited_count > 0:
        print("\n✅ Rate limiting is working!")
    else:
        print("\n⚠️  Rate limiting may not be working properly")

def test_caching():
    """Test caching functionality."""
    print_section("TEST 2: Caching")
    
    endpoint = f"{BASE_URL}/api/ai/suggest-recipes"
    data = {"ingredients": ["tomato", "pasta", "garlic"]}
    
    print(f"\nTesting endpoint: {endpoint}")
    print(f"Data: {json.dumps(data)}")
    
    # First request (cache miss)
    print("\n1️⃣  First request (should be cache MISS)...")
    start_time = time.time()
    try:
        response1 = requests.post(endpoint, json=data, headers=HEADERS, timeout=10)
        duration1 = time.time() - start_time
        
        if response1.status_code == 200:
            result1 = response1.json()
            cached1 = result1.get('cached', False)
            print(f"  ✅ Status: {response1.status_code}")
            print(f"  ⏱️  Duration: {duration1:.2f}s")
            print(f"  💾 Cached: {cached1}")
        else:
            print(f"  ❌ Failed with status {response1.status_code}")
            return
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return
    
    # Wait a bit
    time.sleep(1)
    
    # Second request (cache hit)
    print("\n2️⃣  Second request (should be cache HIT)...")
    start_time = time.time()
    try:
        response2 = requests.post(endpoint, json=data, headers=HEADERS, timeout=10)
        duration2 = time.time() - start_time
        
        if response2.status_code == 200:
            result2 = response2.json()
            cached2 = result2.get('cached', False)
            print(f"  ✅ Status: {response2.status_code}")
            print(f"  ⏱️  Duration: {duration2:.2f}s")
            print(f"  💾 Cached: {cached2}")
        else:
            print(f"  ❌ Failed with status {response2.status_code}")
            return
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return
    
    # Analysis
    print(f"\n📊 Results:")
    print(f"  First request: {duration1:.2f}s (cached: {cached1})")
    print(f"  Second request: {duration2:.2f}s (cached: {cached2})")
    
    if duration2 < duration1 * 0.5:  # Second request should be at least 2x faster
        speedup = duration1 / duration2
        print(f"  🚀 Speedup: {speedup:.1f}x faster")
        print("\n✅ Caching is working!")
    else:
        print("\n⚠️  Caching may not be working properly")

def test_redis_connection():
    """Test Redis connection."""
    print_section("TEST 3: Redis Connection")
    
    try:
        import redis
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        
        print(f"\nConnecting to: {redis_url}")
        
        client = redis.from_url(redis_url, decode_responses=True)
        response = client.ping()
        
        if response:
            print("✅ Redis connection successful!")
            
            # Get some info
            info = client.info('server')
            print(f"\n📊 Redis Info:")
            print(f"  Version: {info.get('redis_version', 'unknown')}")
            print(f"  Uptime: {info.get('uptime_in_seconds', 0)} seconds")
            
            # Check cache keys
            keys = client.keys('appnauan_*')
            print(f"  Cache keys: {len(keys)}")
            
        else:
            print("❌ Redis ping failed")
            
    except ImportError:
        print("⚠️  Redis module not installed")
        print("   Run: pip install redis")
    except Exception as e:
        print(f"❌ Redis connection failed: {str(e)}")
        print("\n💡 Make sure Redis is running:")
        print("   Windows: redis-server.exe")
        print("   Linux: sudo systemctl start redis")
        print("   Mac: brew services start redis")

def test_health_endpoint():
    """Test health endpoint to check features."""
    print_section("TEST 4: Health Check")
    
    endpoint = f"{BASE_URL}/"
    
    print(f"\nChecking: {endpoint}")
    
    try:
        response = requests.get(endpoint, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ API is online")
            print(f"  Version: {data.get('version', 'unknown')}")
            
            features = data.get('features', {})
            print(f"\n📋 Features:")
            print(f"  Rate Limiting: {'✅' if features.get('rate_limiting') else '❌'}")
            print(f"  Caching: {'✅' if features.get('caching') else '❌'}")
        else:
            print(f"❌ Health check failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\n💡 Make sure the backend server is running:")
        print("   python app.py")

def main():
    """Run all tests."""
    print("\n" + "🧪 RATE LIMITING & CACHING TEST SUITE ".center(60, "="))
    print("\nThis script will test:")
    print("  1. Rate limiting functionality")
    print("  2. Caching performance")
    print("  3. Redis connection")
    print("  4. Health check")
    
    input("\nPress Enter to start tests...")
    
    # Run tests
    test_health_endpoint()
    test_redis_connection()
    test_caching()
    test_rate_limiting()
    
    print("\n" + "="*60)
    print("  TESTS COMPLETED")
    print("="*60)
    print("\n💡 Tips:")
    print("  - Check RATE_LIMITING_CACHING.md for detailed documentation")
    print("  - Monitor Redis: redis-cli MONITOR")
    print("  - View cache keys: redis-cli KEYS appnauan_*")
    print("  - Clear cache: redis-cli FLUSHDB")
    print()

if __name__ == "__main__":
    main()
