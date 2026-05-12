"""
Request/Response Logging Middleware
Logs all API requests and responses for monitoring and debugging.
"""

from functools import wraps
from flask import request, g
import time
import logging
import json
from typing import Any, Callable

logger = logging.getLogger(__name__)

def log_request_response(f: Callable) -> Callable:
    """
    Decorator to log request and response details.
    
    Logs:
    - Request method, path, headers, body
    - Response status, duration
    - User ID (if authenticated)
    - IP address
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Start timer
        g.start_time = time.time()
        
        # Log request
        log_request()
        
        # Execute endpoint
        response = f(*args, **kwargs)
        
        # Log response
        log_response(response)
        
        return response
    
    return decorated_function

def log_request():
    """Log incoming request details."""
    try:
        # Basic request info
        log_data = {
            "type": "request",
            "method": request.method,
            "path": request.path,
            "url": request.url,
            "remote_addr": request.remote_addr,
            "user_agent": request.headers.get('User-Agent', 'Unknown')[:100]
        }
        
        # Add user ID if available
        if hasattr(request, 'user_id'):
            log_data["user_id"] = request.user_id
        
        # Add query parameters
        if request.args:
            log_data["query_params"] = dict(request.args)
        
        # Add request body (for POST/PUT/PATCH)
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if request.is_json:
                    body = request.get_json(silent=True)
                    if body:
                        # Sanitize sensitive data
                        sanitized_body = sanitize_log_data(body)
                        log_data["body"] = sanitized_body
            except Exception:
                pass
        
        logger.info(f"Request: {json.dumps(log_data)}")
        
    except Exception as e:
        logger.error(f"Error logging request: {str(e)}")

def log_response(response):
    """Log response details."""
    try:
        # Calculate duration
        duration = time.time() - g.get('start_time', time.time())
        
        # Get status code
        if hasattr(response, 'status_code'):
            status_code = response.status_code
        elif isinstance(response, tuple):
            status_code = response[1] if len(response) > 1 else 200
        else:
            status_code = 200
        
        log_data = {
            "type": "response",
            "method": request.method,
            "path": request.path,
            "status_code": status_code,
            "duration_ms": round(duration * 1000, 2),
            "remote_addr": request.remote_addr
        }
        
        # Add user ID if available
        if hasattr(request, 'user_id'):
            log_data["user_id"] = request.user_id
        
        # Log level based on status code
        if status_code >= 500:
            logger.error(f"Response: {json.dumps(log_data)}")
        elif status_code >= 400:
            logger.warning(f"Response: {json.dumps(log_data)}")
        else:
            logger.info(f"Response: {json.dumps(log_data)}")
            
    except Exception as e:
        logger.error(f"Error logging response: {str(e)}")

def sanitize_log_data(data: Any) -> Any:
    """
    Sanitize sensitive data from logs.
    Removes passwords, tokens, API keys, etc.
    """
    if not isinstance(data, dict):
        return data
    
    sensitive_keys = [
        'password', 'token', 'api_key', 'secret', 'authorization',
        'credit_card', 'ssn', 'private_key', 'access_token', 'refresh_token'
    ]
    
    sanitized = {}
    for key, value in data.items():
        key_lower = key.lower()
        
        # Check if key contains sensitive information
        if any(sensitive in key_lower for sensitive in sensitive_keys):
            sanitized[key] = "***REDACTED***"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        elif isinstance(value, list):
            sanitized[key] = [sanitize_log_data(item) if isinstance(item, dict) else item for item in value]
        else:
            sanitized[key] = value
    
    return sanitized

def setup_request_logging(app):
    """
    Setup request logging for Flask app.
    Logs all requests before and after processing.
    """
    @app.before_request
    def before_request_logging():
        """Log before each request."""
        g.start_time = time.time()
        
        # Skip logging for health checks (optional)
        if request.path == '/api/health/' and not app.config.get('LOG_HEALTH_CHECKS', False):
            return
        
        log_request()
    
    @app.after_request
    def after_request_logging(response):
        """Log after each request."""
        # Skip logging for health checks (optional)
        if request.path == '/api/health/' and not app.config.get('LOG_HEALTH_CHECKS', False):
            return response
        
        try:
            duration = time.time() - g.get('start_time', time.time())
            
            log_data = {
                "type": "response",
                "method": request.method,
                "path": request.path,
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2),
                "remote_addr": request.remote_addr,
                "content_length": response.content_length
            }
            
            if hasattr(request, 'user_id'):
                log_data["user_id"] = request.user_id
            
            # Log level based on status code
            if response.status_code >= 500:
                logger.error(f"Response: {json.dumps(log_data)}")
            elif response.status_code >= 400:
                logger.warning(f"Response: {json.dumps(log_data)}")
            else:
                logger.info(f"Response: {json.dumps(log_data)}")
                
        except Exception as e:
            logger.error(f"Error in after_request logging: {str(e)}")
        
        return response
    
    logger.info("Request/Response logging middleware initialized")
