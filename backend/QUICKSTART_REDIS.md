# ⚡ Quick Start: Redis Setup for Windows

Hướng dẫn nhanh cài đặt Redis cho backend trên Windows.

---

## 🎯 Mục Tiêu

Sau khi hoàn thành guide này, bạn sẽ có:
- ✅ Redis server chạy trên Windows
- ✅ Backend với rate limiting và caching hoạt động
- ✅ Test script verify mọi thứ hoạt động đúng

**Thời gian**: ~10 phút

---

## 📦 Option 1: Docker (Khuyến Nghị)

### Bước 1: Cài Docker Desktop
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Cài đặt và khởi động Docker Desktop
3. Verify: Mở CMD và chạy `docker --version`

### Bước 2: Chạy Redis Container
```bash
docker run -d --name redis-appnauan -p 6379:6379 redis:latest
```

### Bước 3: Verify Redis
```bash
docker exec -it redis-appnauan redis-cli ping
# Should return: PONG
```

### Quản Lý Container
```bash
# Stop Redis
docker stop redis-appnauan

# Start Redis
docker start redis-appnauan

# View logs
docker logs redis-appnauan

# Remove container
docker rm -f redis-appnauan
```

---

## 📦 Option 2: Native Windows Install

### Bước 1: Download Redis
1. Truy cập: https://github.com/microsoftarchive/redis/releases
2. Download file: `Redis-x64-3.0.504.zip` (hoặc version mới nhất)
3. Extract vào thư mục (ví dụ: `C:\Redis`)

### Bước 2: Chạy Redis Server
```bash
# Mở CMD trong thư mục Redis
cd C:\Redis
redis-server.exe
```

**Lưu ý**: Giữ cửa sổ CMD này mở. Redis đang chạy ở đây.

### Bước 3: Verify Redis (Cửa sổ CMD mới)
```bash
cd C:\Redis
redis-cli.exe ping
# Should return: PONG
```

### Chạy Redis như Windows Service (Optional)
```bash
# Mở CMD as Administrator
cd C:\Redis
redis-server.exe --service-install
redis-server.exe --service-start

# Verify service
sc query Redis
```

---

## 🔧 Setup Backend

### Bước 1: Install Dependencies
```bash
cd d:\appnauan\backend
pip install -r requirements.txt
```

### Bước 2: Update .env
Thêm vào file `.env`:
```env
REDIS_URL=redis://localhost:6379/0
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

RATELIMIT_STORAGE_URL=redis://localhost:6379/1
RATELIMIT_ENABLED=true
```

### Bước 3: Start Backend
```bash
python app.py
```

Bạn sẽ thấy log:
```
INFO - Redis connected successfully
INFO - Gemini AI configured successfully
INFO - Firebase connected successfully
```

---

## 🧪 Test Everything

### Bước 1: Run Test Script
```bash
# Trong terminal mới (giữ backend chạy)
cd d:\appnauan\backend
python test_rate_limit_cache.py
```

### Bước 2: Verify Output
Bạn sẽ thấy:
```
✅ API is online
✅ Redis connection successful!
✅ Caching is working!
✅ Rate limiting is working!
```

### Bước 3: Manual Test (Optional)

**Test Health Check:**
```bash
curl http://localhost:5000/
```

Expected response:
```json
{
  "message": "Welcome to AI Cooking App API!",
  "status": "online",
  "version": "1.3.0",
  "features": {
    "rate_limiting": true,
    "caching": true
  }
}
```

**Test Caching:**
```bash
# First request (slow)
curl -X POST http://localhost:5000/api/ai/suggest-recipes ^
  -H "Authorization: Bearer local-token:test@example.com" ^
  -H "Content-Type: application/json" ^
  -d "{\"ingredients\":[\"chicken\",\"rice\"]}"

# Second request (fast, cached)
curl -X POST http://localhost:5000/api/ai/suggest-recipes ^
  -H "Authorization: Bearer local-token:test@example.com" ^
  -H "Content-Type: application/json" ^
  -d "{\"ingredients\":[\"chicken\",\"rice\"]}"
```

---

## 🔍 Monitoring Redis

### View Cache Keys
```bash
redis-cli KEYS appnauan_*
```

### Monitor Real-time Activity
```bash
redis-cli MONITOR
```

### Check Memory Usage
```bash
redis-cli INFO memory
```

### Clear All Cache
```bash
redis-cli FLUSHDB
```

---

## 🚨 Troubleshooting

### Problem: "Redis connection failed"

**Solution 1**: Check Redis is running
```bash
# Docker
docker ps | findstr redis

# Native
tasklist | findstr redis-server
```

**Solution 2**: Check port 6379 is not in use
```bash
netstat -ano | findstr :6379
```

**Solution 3**: Restart Redis
```bash
# Docker
docker restart redis-appnauan

# Native
# Close redis-server.exe window and restart
```

### Problem: "Module 'redis' not found"

**Solution**: Install dependencies
```bash
pip install redis Flask-Limiter Flask-Caching
```

### Problem: Backend starts but no Redis logs

**Solution**: Check .env file
```bash
# Make sure these lines exist in .env
REDIS_URL=redis://localhost:6379/0
RATELIMIT_ENABLED=true
```

### Problem: Rate limiting not working

**Solution**: Check RATELIMIT_ENABLED
```bash
# In .env, make sure:
RATELIMIT_ENABLED=true

# Restart backend after changing .env
```

---

## 📊 Verify Everything Works

### Checklist
- [ ] Redis server is running
- [ ] `redis-cli ping` returns PONG
- [ ] Backend starts without errors
- [ ] Health check shows features enabled
- [ ] Test script passes all tests
- [ ] Cache keys visible in Redis
- [ ] Rate limiting triggers after limit

### Expected Logs
```
INFO - Redis connected successfully
INFO - Gemini AI configured successfully
INFO - Firebase connected successfully
 * Running on http://0.0.0.0:5000
```

---

## 🎉 Success!

Nếu tất cả tests pass, bạn đã setup thành công:
- ✅ Redis server
- ✅ Rate limiting (bảo vệ API)
- ✅ Caching (tăng tốc 10-60x)

### Next Steps
1. Read `RATE_LIMITING_CACHING.md` for detailed docs
2. Monitor cache hit rates
3. Adjust TTLs if needed
4. Setup Redis persistence for production

---

## 📚 Additional Resources

- **Detailed Documentation**: `RATE_LIMITING_CACHING.md`
- **Upgrade Summary**: `UPGRADE_SUMMARY.md`
- **Test Script**: `test_rate_limit_cache.py`
- **Redis Commands**: https://redis.io/commands

---

## 💡 Tips

### Development
- Use Docker for easy start/stop
- Monitor Redis with `redis-cli MONITOR`
- Clear cache when testing: `redis-cli FLUSHDB`

### Production
- Set Redis password
- Enable Redis persistence
- Monitor memory usage
- Setup Redis backup

### Performance
- Adjust TTLs based on data freshness needs
- Monitor cache hit rates (target: >70%)
- Scale Redis if needed (Redis Cluster)

---

**Need Help?**
- Check troubleshooting section above
- Run test script: `python test_rate_limit_cache.py`
- Check logs: `python app.py` output
- Verify Redis: `redis-cli ping`

---

**Created by**: Kiro AI  
**Date**: 2026-05-10  
**Version**: 1.3.0
