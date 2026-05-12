# Celery Task Queue Setup Guide

This guide provides instructions for setting up and running Celery workers for asynchronous task processing in the Recipe App backend.

## Overview

Celery is used to process heavy operations asynchronously, including:
- AI ingredient scanning from images
- AI recipe suggestions based on ingredients and preferences
- AI meal nutritional analysis
- Image processing operations

## Prerequisites

1. **Redis** must be installed and running (see `QUICKSTART_REDIS.md`)
2. **Python dependencies** must be installed: `pip install -r requirements.txt`
3. **Environment variables** must be configured in `.env` file

## Environment Configuration

Add the following variables to your `.env` file:

```env
# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

If Redis is running on a different host or port, update the URLs accordingly.

## Starting Celery Workers

### Windows

Open a new terminal window and run:

```powershell
cd backend
celery -A celery_app worker --loglevel=info --pool=solo
```

**Note:** Windows requires the `--pool=solo` flag due to limitations with the default prefork pool.

### Linux/Mac

Open a new terminal window and run:

```bash
cd backend
celery -A celery_app worker --loglevel=info
```

### Running Multiple Workers

For better performance, you can run multiple worker processes:

```bash
# Linux/Mac
celery -A celery_app worker --loglevel=info --concurrency=4

# Windows (run multiple terminals with --pool=solo)
celery -A celery_app worker --loglevel=info --pool=solo
```

## Verifying Celery is Running

### Check Worker Status

```bash
celery -A celery_app inspect active
```

### Check Registered Tasks

```bash
celery -A celery_app inspect registered
```

### Monitor Tasks in Real-Time

```bash
celery -A celery_app events
```

Or use Flower (web-based monitoring tool):

```bash
pip install flower
celery -A celery_app flower
```

Then open http://localhost:5555 in your browser.

## Task Status Tracking

Task statuses are tracked in two places:

1. **Redis** - Stores task results and metadata (temporary, expires after 1 hour)
2. **Firestore** - Stores persistent task status records in the `tasks` collection

### Task Status Values

- `pending` - Task has been enqueued but not started
- `started` - Task is currently being processed
- `success` - Task completed successfully
- `failure` - Task failed with an error
- `retry` - Task is being retried after a failure

### Querying Task Status

Use the API endpoint:

```
GET /api/v1/tasks/{task_id}
```

Response:
```json
{
  "task_id": "abc123",
  "status": "success",
  "result": {
    "data": "..."
  },
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Task Configuration

Task settings are configured in `celery_app.py`:

- **Task time limit**: 5 minutes (hard limit)
- **Soft time limit**: 4 minutes (warning before hard limit)
- **Result expiration**: 1 hour
- **Worker prefetch**: 4 tasks per worker
- **Max tasks per worker**: 1000 (worker restarts after this)

## Troubleshooting

### Worker Not Starting

**Problem:** `celery: command not found`

**Solution:** Ensure Celery is installed:
```bash
pip install celery==5.3.4
```

### Connection Refused Error

**Problem:** `Error: Connection refused` when starting worker

**Solution:** Ensure Redis is running:
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start Redis
redis-server
```

### Tasks Not Being Processed

**Problem:** Tasks are enqueued but never complete

**Solution:** 
1. Check if worker is running: `celery -A celery_app inspect active`
2. Check worker logs for errors
3. Verify Redis connection: `redis-cli ping`
4. Restart the worker

### Import Errors

**Problem:** `ModuleNotFoundError` when starting worker

**Solution:** Ensure you're running the worker from the `backend` directory:
```bash
cd backend
celery -A celery_app worker --loglevel=info
```

### Firestore Connection Issues

**Problem:** Task status not updating in Firestore

**Solution:**
1. Verify Firebase credentials are configured in `.env` or `serviceAccountKey.json`
2. Check worker logs for Firestore errors
3. Tasks will still execute even if Firestore is unavailable

## Production Deployment

### Using Supervisor (Linux)

Create `/etc/supervisor/conf.d/celery.conf`:

```ini
[program:celery]
command=/path/to/venv/bin/celery -A celery_app worker --loglevel=info
directory=/path/to/backend
user=www-data
numprocs=1
stdout_logfile=/var/log/celery/worker.log
stderr_logfile=/var/log/celery/worker.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=600
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start celery
```

### Using systemd (Linux)

Create `/etc/systemd/system/celery.service`:

```ini
[Unit]
Description=Celery Worker
After=network.target redis.service

[Service]
Type=forking
User=www-data
Group=www-data
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/celery -A celery_app worker --loglevel=info --detach
ExecStop=/path/to/venv/bin/celery -A celery_app control shutdown
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable celery
sudo systemctl start celery
```

### Docker Deployment

Add to your `docker-compose.yml`:

```yaml
services:
  celery:
    build: .
    command: celery -A celery_app worker --loglevel=info
    volumes:
      - ./backend:/app
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - redis
```

## Health Checks

The API provides a health check endpoint that verifies Celery worker availability:

```
GET /api/v1/health
```

Response includes:
```json
{
  "status": "healthy",
  "celery": "available",
  "redis": "connected",
  "firestore": "connected"
}
```

## Best Practices

1. **Always run workers in production** - Don't rely on synchronous fallback
2. **Monitor worker health** - Use Flower or custom monitoring
3. **Set appropriate timeouts** - Adjust based on your task requirements
4. **Handle task failures gracefully** - Implement retry logic for transient errors
5. **Log task execution** - Enable INFO level logging for debugging
6. **Scale workers based on load** - Add more workers during peak times
7. **Use task priorities** - Prioritize critical tasks over background jobs

## Additional Resources

- [Celery Documentation](https://docs.celeryproject.org/)
- [Redis Documentation](https://redis.io/documentation)
- [Flower Monitoring Tool](https://flower.readthedocs.io/)
