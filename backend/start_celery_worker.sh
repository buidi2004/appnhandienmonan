#!/bin/bash
# Bash script to start Celery worker on Linux/Mac
# Usage: ./start_celery_worker.sh

echo "Starting Celery worker for Recipe App..."
echo ""

# Check if Redis is running
echo "Checking Redis connection..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✓ Redis is running"
else
    echo "✗ Redis is not running. Please start Redis first."
    echo "  See QUICKSTART_REDIS.md for instructions"
    exit 1
fi

echo ""
echo "Starting Celery worker..."
echo "Press Ctrl+C to stop the worker"
echo ""

# Start Celery worker
celery -A celery_app worker --loglevel=info
