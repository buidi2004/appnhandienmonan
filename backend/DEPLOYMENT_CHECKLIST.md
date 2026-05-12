# ✅ Deployment Checklist - Backend v1.3.0

Checklist để deploy backend với Rate Limiting và Redis Caching.

---

## 📋 Pre-Deployment

### 1. Code Review
- [ ] All code changes reviewed
- [ ] No hardcoded credentials
- [ ] Environment variables properly configured
- [ ] Error handling in place
- [ ] Logging configured correctly

### 2. Dependencies
- [ ] `requirements.txt` updated
- [ ] All dependencies installed locally
- [ ] No conflicting package versions
- [ ] Dependencies tested and working

### 3. Configuration
- [ ] `.env.example` updated with new variables
- [ ] Production `.env` file prepared
- [ ] Redis connection string configured
- [ ] Rate limiting enabled in config
- [ ] All secrets properly stored

### 4. Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Test script executed successfully
- [ ] Performance benchmarks met

---

## 🔧 Infrastructure Setup

### 1. Redis Server
- [ ] Redis server installed
- [ ] Redis running and accessible
- [ ] Redis password set (production)
- [ ] Redis persistence configured
- [ ] Redis backup strategy in place
- [ ] Redis monitoring setup

**Verify:**
```bash
redis-cli ping
# Should return: PONG
```

### 2. Application Server
- [ ] Python 3.8+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] Gunicorn configured (production)
- [ ] Process manager setup (systemd/supervisor)

### 3. Network & Security
- [ ] Firewall rules configured
- [ ] Redis port (6379) secured
- [ ] API rate limits tested
- [ ] HTTPS configured
- [ ] CORS settings verified

---

## 🚀 Deployment Steps

### Step 1: Backup
- [ ] Backup current code
- [ ] Backup database
- [ ] Backup Redis data (if applicable)
- [ ] Document rollback procedure

### Step 2: Deploy Code
- [ ] Pull latest code from repository
- [ ] Checkout correct branch/tag
- [ ] Verify file permissions
- [ ] Update `.env` file

### Step 3: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```
- [ ] Dependencies installed successfully
- [ ] No installation errors

### Step 4: Configure Environment
```bash
# Update .env with production values
FLASK_ENV=production
REDIS_URL=redis://:password@localhost:6379/0
RATELIMIT_ENABLED=true
```
- [ ] All environment variables set
- [ ] Redis connection string correct
- [ ] Secrets properly configured

### Step 5: Test Configuration
```bash
python -c "from config import redis_client; print(redis_client.ping())"
```
- [ ] Redis connection successful
- [ ] Firebase connection successful
- [ ] Gemini API configured

### Step 6: Run Tests
```bash
python test_rate_limit_cache.py
```
- [ ] All tests passing
- [ ] No errors in output

### Step 7: Start Application
```bash
# Development
python app.py

# Production (with Gunicorn)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```
- [ ] Application starts without errors
- [ ] Health check endpoint responding
- [ ] Features enabled in health check

---

## ✅ Post-Deployment Verification

### 1. Health Checks
```bash
curl http://localhost:5000/
```
- [ ] API responding
- [ ] Version shows 1.3.0
- [ ] Rate limiting enabled
- [ ] Caching enabled

### 2. Redis Verification
```bash
redis-cli INFO
redis-cli KEYS appnauan_*
```
- [ ] Redis connected
- [ ] Cache keys being created
- [ ] Memory usage normal

### 3. Rate Limiting Test
```bash
# Send multiple requests rapidly
for /L %i in (1,1,15) do curl http://localhost:5000/api/health/
```
- [ ] First requests succeed (200)
- [ ] Later requests rate limited (429)
- [ ] Rate limit message correct

### 4. Caching Test
```bash
# Make same request twice
curl -X POST http://localhost:5000/api/ai/suggest-recipes \
  -H "Authorization: Bearer local-token:test@example.com" \
  -d '{"ingredients":["chicken"]}'
```
- [ ] First request slower (cache miss)
- [ ] Second request faster (cache hit)
- [ ] Response includes "cached" field

### 5. Functional Tests
- [ ] AI scan ingredients working
- [ ] Recipe suggestions working
- [ ] Community feed loading
- [ ] User authentication working
- [ ] All endpoints responding

---

## 📊 Monitoring Setup

### 1. Application Monitoring
- [ ] Logging configured
- [ ] Log rotation setup
- [ ] Error tracking enabled
- [ ] Performance metrics collected

### 2. Redis Monitoring
- [ ] Redis INFO command accessible
- [ ] Memory usage monitored
- [ ] Cache hit rate tracked
- [ ] Alerts configured for issues

### 3. Rate Limiting Monitoring
- [ ] 429 responses tracked
- [ ] Rate limit violations logged
- [ ] Alerts for excessive violations

### 4. Performance Monitoring
- [ ] Response time metrics
- [ ] Cache hit rate metrics
- [ ] API call reduction tracked
- [ ] Cost savings calculated

---

## 🔒 Security Checklist

### 1. Redis Security
- [ ] Redis password set
- [ ] Redis bind to localhost only
- [ ] Redis protected mode enabled
- [ ] Redis commands renamed (if needed)

### 2. Application Security
- [ ] Debug mode disabled (production)
- [ ] Secret keys rotated
- [ ] CORS properly configured
- [ ] Input validation working
- [ ] Rate limiting active

### 3. Network Security
- [ ] Firewall rules applied
- [ ] Only necessary ports open
- [ ] HTTPS enforced
- [ ] Security headers configured

---

## 📝 Documentation

### 1. Update Documentation
- [ ] README.md updated
- [ ] API documentation current
- [ ] Changelog updated
- [ ] Deployment guide available

### 2. Team Communication
- [ ] Team notified of deployment
- [ ] New features documented
- [ ] Breaking changes communicated
- [ ] Support team briefed

### 3. Runbooks
- [ ] Deployment runbook updated
- [ ] Troubleshooting guide available
- [ ] Rollback procedure documented
- [ ] Monitoring guide available

---

## 🐛 Troubleshooting Checklist

### If Redis Connection Fails
- [ ] Check Redis is running: `redis-cli ping`
- [ ] Check Redis port: `netstat -ano | findstr :6379`
- [ ] Check Redis password in .env
- [ ] Check Redis logs for errors
- [ ] Restart Redis if needed

### If Rate Limiting Not Working
- [ ] Check RATELIMIT_ENABLED=true in .env
- [ ] Check Redis connection
- [ ] Check limiter initialization in logs
- [ ] Restart application

### If Caching Not Working
- [ ] Check Redis connection
- [ ] Check cache keys: `redis-cli KEYS appnauan_*`
- [ ] Check TTL values
- [ ] Check cache configuration in logs
- [ ] Clear cache and retry: `redis-cli FLUSHDB`

### If Application Won't Start
- [ ] Check Python version: `python --version`
- [ ] Check dependencies: `pip list`
- [ ] Check .env file exists
- [ ] Check logs for errors
- [ ] Check port 5000 not in use

---

## 🔄 Rollback Procedure

### If Issues Occur

**Step 1: Stop Application**
```bash
# Stop Gunicorn
pkill gunicorn

# Or stop service
systemctl stop appnauan-backend
```

**Step 2: Restore Previous Version**
```bash
git checkout v1.2.0
pip install -r requirements.txt
```

**Step 3: Update Configuration**
```bash
# Remove Redis config from .env
# Or set RATELIMIT_ENABLED=false
```

**Step 4: Restart Application**
```bash
python app.py
# Or
systemctl start appnauan-backend
```

**Step 5: Verify**
- [ ] Application running
- [ ] Health check passing
- [ ] Core functionality working

---

## 📈 Success Criteria

### Performance
- [ ] Response times improved (10-60x for cached)
- [ ] Cache hit rate >70%
- [ ] No performance degradation
- [ ] Memory usage acceptable

### Reliability
- [ ] No errors in logs
- [ ] All endpoints responding
- [ ] Rate limiting working
- [ ] Caching working

### Cost
- [ ] AI API calls reduced by 80%
- [ ] Cost savings visible
- [ ] No unexpected costs

### User Experience
- [ ] Faster response times
- [ ] No service interruptions
- [ ] All features working

---

## 🎉 Deployment Complete

### Final Checks
- [ ] All checklist items completed
- [ ] No critical issues
- [ ] Monitoring active
- [ ] Team notified
- [ ] Documentation updated

### Post-Deployment Tasks
- [ ] Monitor for 24 hours
- [ ] Review metrics daily
- [ ] Optimize TTLs if needed
- [ ] Gather user feedback
- [ ] Plan next improvements

---

## 📞 Support Contacts

### Technical Issues
- **Documentation**: See `RATE_LIMITING_CACHING.md`
- **Test Script**: Run `python test_rate_limit_cache.py`
- **Logs**: Check application logs
- **Redis**: Check `redis-cli INFO`

### Emergency Rollback
- **Procedure**: See "Rollback Procedure" above
- **Backup**: Restore from backup
- **Support**: Contact DevOps team

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Version**: 1.3.0  
**Status**: ⬜ In Progress | ⬜ Completed | ⬜ Rolled Back

---

**Notes:**
_Add any deployment-specific notes here_

---

**Sign-off:**
- [ ] Developer: _____________
- [ ] QA: _____________
- [ ] DevOps: _____________
- [ ] Product Owner: _____________
