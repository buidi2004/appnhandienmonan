# PowerShell script to start Celery worker on Windows
# Usage: .\start_celery_worker.ps1

Write-Host "Starting Celery worker for Recipe App..." -ForegroundColor Green
Write-Host ""

# Check if Redis is running
Write-Host "Checking Redis connection..." -ForegroundColor Yellow
try {
    $redisTest = redis-cli ping 2>&1
    if ($redisTest -eq "PONG") {
        Write-Host "✓ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "✗ Redis is not responding. Please start Redis first." -ForegroundColor Red
        Write-Host "  See QUICKSTART_REDIS.md for instructions" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Redis CLI not found or Redis is not running" -ForegroundColor Red
    Write-Host "  Please install and start Redis first" -ForegroundColor Yellow
    Write-Host "  See QUICKSTART_REDIS.md for instructions" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting Celery worker..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the worker" -ForegroundColor Cyan
Write-Host ""

# Start Celery worker with Windows-compatible settings
celery -A celery_app worker --loglevel=info --pool=solo
