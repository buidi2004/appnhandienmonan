# 🔄 API Versioning & Request Logging - v1.4.0

**Ngày triển khai**: 10/05/2026  
**Version**: 1.3.0 → 1.4.0  
**Status**: ✅ **COMPLETED**

---

## 📊 Tổng Quan

Backend đã được nâng cấp với 2 tính năng quan trọng:

### 1. **API Versioning** 🔄
- Hỗ trợ multiple API versions
- Backward compatibility với legacy endpoints
- Dễ dàng upgrade và maintain

### 2. **Request/Response Logging** 📝
- Log tất cả requests và responses
- Performance monitoring
- Security audit trail
- Debugging support

---

## 🎯 API Versioning

### URL Structure

**New (Versioned):**
```
/api/v1/health
/api/v1/ai/scan-ingredients
/api/v1/recipes/search
/api/v1/community/feed
```

**Legacy (Backward Compatible):**
```
/api/health
/api/ai/scan-ingredients
/api/recipes/search
/api/community/feed
```

### Version Information Endpoint

**GET /**
```json
{
  "message": "Welcome to AI Cooking App API!",
  "status": "online",
  "version": "1.4.0",
  "api_versions": {
    "v1": {
      "status": "stable",
      "base_url": "/api/v1",
      "endpoints": [...]
    },
    "legacy": {
      "status": "deprecated",
      "base_url": "/api",
      "note": "Use /api/v1 for new integrations"
    }
  },
  "features": {
    "rate_limiting": true,
    "caching": true,
    "request_logging": true,
    "api_versioning": true
  }
}
```

**GET /api/v1**
```json
{
  "version": "1.0",
  "status": "stable",
  "endpoints": {
    "health": "/api/v1/health",
    "ai": {
      "scan_ingredients": "/api/v1/ai/scan-ingredients",
      "suggest_recipes": "/api/v1/ai/suggest-recipes",
      "analyze_meal": "/api/v1/ai/analyze-meal"
    },
    "recipes": {...},
    "community": {...},
    "pantry": "/api/v1/pantry",
    "user": {...}
  }
}
```

### Migration Guide

**For Frontend Developers:**

```javascript
// Old (Legacy)
const API_BASE = 'http://localhost:5000/api';

// New (Versioned)
const API_BASE = 'http://localhost:5000/api/v1';

// Example usage
fetch(`${API_BASE}/recipes/search?q=chicken`)
  .then(res => res.json())
  .then(data => console.log(data));
```

**Backward Compatibility:**
- Legacy endpoints (`/api/*`) still work
- No breaking changes for existing clients
- Gradual migration recommended

---

## 📝 Request/Response Logging

### What Gets Logged

#### Request Logs
```json
{
  "type": "request",
  "method": "POST",
  "path": "/api/v1/ai/suggest-recipes",
  "url": "http://localhost:5000/api/v1/ai/suggest-recipes",
  "remote_addr": "127.0.0.1",
  "user_agent": "Mozilla/5.0...",
  "user_id": "user_123",
  "query_params": {"category": "dinner"},
  "body": {"ingredients": ["chicken", "rice"]}
}
```

#### Response Logs
```json
{
  "type": "response",
  "method": "POST",
  "path": "/api/v1/ai/suggest-recipes",
  "status_code": 200,
  "duration_ms": 245.67,
  "remote_addr": "127.0.0.1",
  "user_id": "user_123",
  "content_length": 1024
}
```

### Log Levels

| Status Code | Log Level | Example |
|-------------|-----------|---------|
| 200-299 | INFO | Successful requests |
| 400-499 | WARNING | Client errors (404, 429) |
| 500-599 | ERROR | Server errors |

### Sensitive Data Protection

**Automatically Redacted:**
- Passwords
- Tokens (access_token, refresh_token)
- API keys
- Credit card numbers
- Private keys
- Authorization headers

**Example:**
```json
// Original request body
{
  "email": "user@example.com",
  "password": "secret123",
  "api_key": "sk_live_abc123"
}

// Logged (sanitized)
{
  "email": "user@example.com",
  "password": "***REDACTED***",
  "api_key": "***REDACTED***"
}
```

### Log Files

**Location:**
```
backend/app.log
```

**Format:**
```
2026-05-10 14:30:45,123 - __main__ - INFO - Request: {"type":"request",...}
2026-05-10 14:30:45,368 - __main__ - INFO - Response: {"type":"response",...}
```

**Log Rotation (Recommended):**
```python
# In production, use RotatingFileHandler
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'app.log',
    maxBytes=10485760,  # 10MB
    backupCount=10
)
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Request/Response Logging
ENABLE_REQUEST_LOGGING=true
LOG_HEALTH_CHECKS=false  # Don't log health checks (reduce noise)

# Flask Environment
FLASK_ENV=development  # or production
```

### Disable Logging (If Needed)

```env
ENABLE_REQUEST_LOGGING=false
```

### Log Health Checks

```env
LOG_HEALTH_CHECKS=true
```

---

## 📊 Monitoring & Analysis

### View Logs

**Real-time:**
```bash
# Windows
type app.log

# Linux/Mac
tail -f app.log
```

**Filter by type:**
```bash
# Requests only
findstr "\"type\":\"request\"" app.log

# Responses only
findstr "\"type\":\"response\"" app.log

# Errors only
findstr "ERROR" app.log
```

### Analyze Performance

**Slow requests (>1000ms):**
```bash
findstr "duration_ms" app.log | findstr /R "duration_ms\":[1-9][0-9][0-9][0-9]"
```

**Failed requests:**
```bash
findstr "status_code\":5" app.log
```

**Rate limited requests:**
```bash
findstr "status_code\":429" app.log
```

### Log Analysis Tools

**Python script:**
```python
import json

# Parse logs
with open('app.log', 'r') as f:
    for line in f:
        if '"type":"response"' in line:
            # Extract JSON
            start = line.find('{"type"')
            if start != -1:
                log_data = json.loads(line[start:])
                
                # Analyze
                if log_data['duration_ms'] > 1000:
                    print(f"Slow request: {log_data['path']} - {log_data['duration_ms']}ms")
```

---

## 🔍 Use Cases

### 1. Performance Monitoring

**Track slow endpoints:**
```bash
# Find requests taking >500ms
findstr "duration_ms" app.log | findstr /R "duration_ms\":[5-9][0-9][0-9]"
```

**Average response time per endpoint:**
```python
from collections import defaultdict
import json

durations = defaultdict(list)

with open('app.log', 'r') as f:
    for line in f:
        if '"type":"response"' in line:
            start = line.find('{"type"')
            if start != -1:
                data = json.loads(line[start:])
                durations[data['path']].append(data['duration_ms'])

for path, times in durations.items():
    avg = sum(times) / len(times)
    print(f"{path}: {avg:.2f}ms average")
```

### 2. Security Auditing

**Track failed authentication:**
```bash
findstr "status_code\":401" app.log
```

**Track rate limit violations:**
```bash
findstr "status_code\":429" app.log
```

**Track suspicious activity:**
```bash
# Multiple failed requests from same IP
findstr "remote_addr" app.log | findstr "status_code\":4"
```

### 3. Debugging

**Trace user requests:**
```bash
# Find all requests from specific user
findstr "user_id\":\"user_123\"" app.log
```

**Trace specific request:**
```bash
# Find request and response for specific path
findstr "/api/v1/ai/suggest-recipes" app.log
```

### 4. Usage Analytics

**Most popular endpoints:**
```python
from collections import Counter
import json

endpoints = []

with open('app.log', 'r') as f:
    for line in f:
        if '"type":"request"' in line:
            start = line.find('{"type"')
            if start != -1:
                data = json.loads(line[start:])
                endpoints.append(data['path'])

popular = Counter(endpoints).most_common(10)
for path, count in popular:
    print(f"{path}: {count} requests")
```

---

## 🚀 Best Practices

### 1. Log Rotation

**Setup log rotation to prevent disk space issues:**

```python
# config.py or app.py
from logging.handlers import RotatingFileHandler
import logging

handler = RotatingFileHandler(
    'app.log',
    maxBytes=10 * 1024 * 1024,  # 10MB
    backupCount=10  # Keep 10 backup files
)
handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))

logger = logging.getLogger()
logger.addHandler(handler)
```

### 2. Structured Logging

**Use JSON format for easy parsing:**
- ✅ Already implemented
- ✅ Easy to parse with tools
- ✅ Machine-readable

### 3. Sensitive Data

**Never log:**
- Passwords
- API keys
- Tokens
- Credit card numbers
- Personal identifiable information (PII)

**Already protected by sanitize_log_data()**

### 4. Performance

**Disable health check logging:**
```env
LOG_HEALTH_CHECKS=false
```

**Use async logging (production):**
```python
from logging.handlers import QueueHandler
import queue

log_queue = queue.Queue()
queue_handler = QueueHandler(log_queue)
```

---

## 🔧 Advanced Configuration

### Custom Log Format

```python
# app.py
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### Separate Log Files

```python
# Separate files for different log levels
error_handler = logging.FileHandler('error.log')
error_handler.setLevel(logging.ERROR)

info_handler = logging.FileHandler('info.log')
info_handler.setLevel(logging.INFO)

logger.addHandler(error_handler)
logger.addHandler(info_handler)
```

### External Logging Services

**Send logs to external services:**

```python
# Example: Send to Loggly, Papertrail, etc.
import requests

class ExternalLogHandler(logging.Handler):
    def emit(self, record):
        log_entry = self.format(record)
        requests.post('https://logs.example.com/api', json={
            'message': log_entry,
            'level': record.levelname
        })

logger.addHandler(ExternalLogHandler())
```

---

## 📈 Metrics to Track

### Performance Metrics
- Average response time per endpoint
- P50, P95, P99 latencies
- Slow requests (>1s)
- Cache hit rate

### Error Metrics
- 4xx error rate
- 5xx error rate
- Most common errors
- Error trends over time

### Usage Metrics
- Requests per endpoint
- Requests per user
- Peak traffic times
- Geographic distribution (from IP)

### Security Metrics
- Failed authentication attempts
- Rate limit violations
- Suspicious patterns
- Unusual access patterns

---

## 🐛 Troubleshooting

### Issue: Logs not appearing

**Check:**
1. `ENABLE_REQUEST_LOGGING=true` in .env
2. File permissions for app.log
3. Logging configuration in app.py

**Solution:**
```bash
# Check if logging is enabled
curl http://localhost:5000/ | findstr "request_logging"

# Check log file
type app.log
```

### Issue: Log file too large

**Solution:**
```python
# Implement log rotation
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler('app.log', maxBytes=10485760, backupCount=10)
```

### Issue: Sensitive data in logs

**Solution:**
- Check `sanitize_log_data()` function
- Add more sensitive keywords if needed
- Review logs regularly

---

## 🎉 Summary

### What We Implemented

1. **API Versioning**
   - ✅ `/api/v1/*` endpoints
   - ✅ Backward compatibility
   - ✅ Version information endpoints
   - ✅ Easy migration path

2. **Request/Response Logging**
   - ✅ Comprehensive logging
   - ✅ Sensitive data protection
   - ✅ Performance tracking
   - ✅ Security auditing
   - ✅ Configurable logging

### Benefits

**For Developers:**
- 🔍 Better debugging
- 📊 Performance insights
- 🔒 Security monitoring
- 📝 Audit trail

**For Operations:**
- 📈 Usage analytics
- ⚠️ Error tracking
- 🚨 Alert triggers
- 📊 Capacity planning

**For Business:**
- 📊 Usage patterns
- 💰 Cost optimization
- 🎯 Feature prioritization
- 📈 Growth tracking

---

## 🔜 Next Steps

### Short Term
- [ ] Setup log rotation
- [ ] Create log analysis dashboard
- [ ] Setup alerts for errors
- [ ] Document API v1 endpoints

### Long Term
- [ ] Implement API v2 (if needed)
- [ ] External logging service integration
- [ ] Real-time monitoring dashboard
- [ ] Automated log analysis

---

**Thực hiện bởi**: Kiro AI  
**Ngày**: 10/05/2026  
**Version**: 1.3.0 → 1.4.0  
**Status**: ✅ **PRODUCTION READY**
