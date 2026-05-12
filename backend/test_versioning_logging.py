"""
Test script for API Versioning and Request Logging.
Run this after starting the backend server.
"""

import requests
import time
import json
from typing import Dict

BASE_URL = "http://localhost:5000"
TEST_TOKEN = "local-token:test@example.com"
HEADERS = {"Authorization": f"Bearer {TEST_TOKEN}"}

def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_api_versioning():
    """Test API versioning endpoints."""
    print_section("TEST 1: API Versioning")
    
    # Test root endpoint
    print("\n1️⃣  Testing root endpoint (/)...")
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Status: {response.status_code}")
            print(f"  📦 Version: {data.get('version')}")
            print(f"  🔄 API Versioning: {data.get('features', {}).get('api_versioning')}")
            
            # Check API versions
            api_versions = data.get('api_versions', {})
            print(f"\n  📋 Available API Versions:")
            for version, info in api_versions.items():
                print(f"    - {version}: {info.get('status')} ({info.get('base_url')})")
        else:
            print(f"  ❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    
    # Test v1 info endpoint
    print("\n2️⃣  Testing /api/v1 endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Status: {response.status_code}")
            print(f"  📦 Version: {data.get('version')}")
            print(f"  📋 Endpoints available: {len(data.get('endpoints', {}))}")
        else:
            print(f"  ❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    
    # Test versioned vs legacy endpoints
    print("\n3️⃣  Testing versioned vs legacy endpoints...")
    
    endpoints_to_test = [
        ("/api/v1/health/", "Versioned"),
        ("/api/health/", "Legacy")
    ]
    
    for endpoint, label in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"  ✅ {label} ({endpoint}): Working")
            else:
                print(f"  ❌ {label} ({endpoint}): Failed ({response.status_code})")
        except Exception as e:
            print(f"  ❌ {label} ({endpoint}): Error - {str(e)}")
    
    print("\n✅ API Versioning test completed!")

def test_request_logging():
    """Test request/response logging."""
    print_section("TEST 2: Request/Response Logging")
    
    print("\n📝 Making test requests to generate logs...")
    
    # Make various requests
    test_requests = [
        ("GET", "/api/v1/health/", None),
        ("GET", "/", None),
        ("GET", "/api/v1", None),
        ("GET", "/api/v1/recipes/recommendations", HEADERS),
    ]
    
    for method, endpoint, headers in test_requests:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
            
            print(f"  {method} {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"  {method} {endpoint}: Error - {str(e)}")
    
    print("\n📊 Checking log file...")
    try:
        with open('app.log', 'r') as f:
            lines = f.readlines()
            recent_logs = lines[-20:]  # Last 20 lines
            
            request_logs = [l for l in recent_logs if '"type":"request"' in l]
            response_logs = [l for l in recent_logs if '"type":"response"' in l]
            
            print(f"  📥 Request logs found: {len(request_logs)}")
            print(f"  📤 Response logs found: {len(response_logs)}")
            
            if request_logs and response_logs:
                print("\n  ✅ Logging is working!")
                
                # Show sample log
                print("\n  📄 Sample request log:")
                if request_logs:
                    sample = request_logs[-1]
                    start = sample.find('{"type"')
                    if start != -1:
                        log_data = json.loads(sample[start:])
                        print(f"    Method: {log_data.get('method')}")
                        print(f"    Path: {log_data.get('path')}")
                        print(f"    IP: {log_data.get('remote_addr')}")
                
                print("\n  📄 Sample response log:")
                if response_logs:
                    sample = response_logs[-1]
                    start = sample.find('{"type"')
                    if start != -1:
                        log_data = json.loads(sample[start:])
                        print(f"    Status: {log_data.get('status_code')}")
                        print(f"    Duration: {log_data.get('duration_ms')}ms")
            else:
                print("\n  ⚠️  No logs found. Check ENABLE_REQUEST_LOGGING in .env")
                
    except FileNotFoundError:
        print("  ⚠️  Log file not found (app.log)")
        print("  💡 Make sure the backend is running and logging is enabled")
    except Exception as e:
        print(f"  ❌ Error reading logs: {str(e)}")

def test_error_handling():
    """Test improved error handling."""
    print_section("TEST 3: Error Handling")
    
    # Test 404
    print("\n1️⃣  Testing 404 error...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/nonexistent", timeout=5)
        if response.status_code == 404:
            data = response.json()
            print(f"  ✅ 404 handled correctly")
            print(f"  📝 Error message: {data.get('error')}")
            print(f"  💡 Suggestion: {data.get('suggestion')}")
        else:
            print(f"  ⚠️  Unexpected status: {response.status_code}")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
    
    # Test 429 (rate limit)
    print("\n2️⃣  Testing 429 error (rate limit)...")
    print("  Sending 60 requests rapidly...")
    
    rate_limited = False
    for i in range(60):
        try:
            response = requests.get(f"{BASE_URL}/api/v1/health/", timeout=1)
            if response.status_code == 429:
                data = response.json()
                print(f"  ✅ Rate limit triggered at request {i+1}")
                print(f"  📝 Error: {data.get('error')}")
                print(f"  💡 Message: {data.get('message')}")
                rate_limited = True
                break
        except:
            pass
    
    if not rate_limited:
        print("  ⚠️  Rate limit not triggered (may need more requests)")

def test_sensitive_data_protection():
    """Test sensitive data protection in logs."""
    print_section("TEST 4: Sensitive Data Protection")
    
    print("\n🔒 Testing sensitive data redaction...")
    
    # Make request with sensitive data
    sensitive_data = {
        "email": "test@example.com",
        "password": "secret123",
        "api_key": "sk_live_abc123",
        "ingredients": ["chicken", "rice"]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/ai/suggest-recipes",
            json=sensitive_data,
            headers=HEADERS,
            timeout=10
        )
        print(f"  📤 Sent request with sensitive data")
        print(f"  📥 Response: {response.status_code}")
        
        # Check logs
        time.sleep(0.5)  # Wait for log to be written
        
        with open('app.log', 'r') as f:
            lines = f.readlines()
            recent_logs = lines[-10:]
            
            # Check if sensitive data is redacted
            found_redacted = False
            found_plain = False
            
            for line in recent_logs:
                if 'REDACTED' in line:
                    found_redacted = True
                if 'secret123' in line or 'sk_live_abc123' in line:
                    found_plain = True
            
            if found_redacted and not found_plain:
                print("  ✅ Sensitive data properly redacted!")
            elif found_plain:
                print("  ⚠️  WARNING: Sensitive data found in logs!")
            else:
                print("  ℹ️  No sensitive data in recent logs")
                
    except FileNotFoundError:
        print("  ⚠️  Log file not found")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")

def test_performance_logging():
    """Test performance logging."""
    print_section("TEST 5: Performance Logging")
    
    print("\n⏱️  Testing response time logging...")
    
    # Make a request
    start_time = time.time()
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/recipes/recommendations",
            headers=HEADERS,
            timeout=10
        )
        actual_duration = (time.time() - start_time) * 1000
        
        print(f"  📥 Response: {response.status_code}")
        print(f"  ⏱️  Actual duration: {actual_duration:.2f}ms")
        
        # Check log for duration
        time.sleep(0.5)
        
        with open('app.log', 'r') as f:
            lines = f.readlines()
            recent_logs = lines[-5:]
            
            for line in recent_logs:
                if '"type":"response"' in line and '/recipes/recommendations' in line:
                    start = line.find('{"type"')
                    if start != -1:
                        log_data = json.loads(line[start:])
                        logged_duration = log_data.get('duration_ms')
                        print(f"  📝 Logged duration: {logged_duration}ms")
                        
                        if abs(logged_duration - actual_duration) < 100:
                            print("  ✅ Duration logging accurate!")
                        break
                        
    except FileNotFoundError:
        print("  ⚠️  Log file not found")
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")

def main():
    """Run all tests."""
    print("\n" + "🧪 API VERSIONING & LOGGING TEST SUITE ".center(60, "="))
    print("\nThis script will test:")
    print("  1. API versioning endpoints")
    print("  2. Request/response logging")
    print("  3. Error handling improvements")
    print("  4. Sensitive data protection")
    print("  5. Performance logging")
    
    input("\nPress Enter to start tests...")
    
    # Run tests
    test_api_versioning()
    test_request_logging()
    test_error_handling()
    test_sensitive_data_protection()
    test_performance_logging()
    
    print("\n" + "="*60)
    print("  TESTS COMPLETED")
    print("="*60)
    print("\n💡 Tips:")
    print("  - Check app.log for detailed logs")
    print("  - Use /api/v1 for new integrations")
    print("  - Monitor logs for performance insights")
    print("  - Review API_VERSIONING_LOGGING.md for details")
    print()

if __name__ == "__main__":
    main()
