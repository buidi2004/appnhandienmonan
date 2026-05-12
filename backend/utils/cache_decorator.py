"""
Cache decorator for Flask route handlers.

This module provides a decorator for caching route handler responses with configurable TTL.
The decorator automatically generates cache keys, checks cache before executing handlers,
stores results in cache, and includes a "cached" field in responses.
"""

import functools
import logging
from typing import Callable, Optional, Any, Dict
from flask import request, jsonify, Response
import json
import hashlib

from config import cache, is_redis_available
from utils.cache_utils import generate_cache_key_from_request

logger = logging.getLogger(__name__)


def cached_route(
    ttl: int = 300,
    key_prefix: Optional[str] = None,
    include_user_id: bool = False,
    include_body: bool = False,
    cache_condition: Optional[Callable[[Any], bool]] = None
):
    """
    Decorator for caching Flask route handler responses.
    
    This decorator provides automatic caching for route handlers with the following features:
    - Generates cache keys from request parameters (method, path, query params, body)
    - Checks cache before executing the handler
    - Stores handler results in cache with configurable TTL
    - Includes "cached": true/false field in JSON responses
    - Supports conditional caching based on response content
    - Handles cache failures gracefully
    
    Args:
        ttl: Time-to-live for cached data in seconds (default: 300 = 5 minutes)
        key_prefix: Optional prefix for cache keys (e.g., "scan_ingredients")
        include_user_id: Whether to include user_id in cache key generation (default: False)
        include_body: Whether to include request body in cache key (default: False)
        cache_condition: Optional function to determine if response should be cached
                        Takes response data and returns True to cache, False to skip
    
    Returns:
        Decorated function that implements caching logic
    
    Example:
        @ai_bp.route('/scan-ingredients', methods=['POST'])
        @token_required
        @cached_route(ttl=3600, key_prefix="scan_ingredients", include_user_id=True)
        def scan_ingredients(user_id):
            # Handler logic here
            return jsonify({"success": True, "data": result})
    
    Requirements:
        - Validates: Requirements 1.4 (Cache check and storage)
        - Validates: Requirements 2.4 (Cached response indicator)
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Extract user_id from kwargs if available
            user_id = kwargs.get('user_id') if include_user_id else None
            
            # Generate cache key
            try:
                cache_key = generate_cache_key_from_request(
                    request=request,
                    user_id=user_id,
                    include_body=include_body
                )
                
                # Add prefix if provided
                if key_prefix:
                    cache_key = f"{key_prefix}_{cache_key}"
                
                logger.debug(f"Generated cache key: {cache_key}")
            except Exception as e:
                logger.warning(f"Failed to generate cache key: {str(e)}")
                # If cache key generation fails, execute handler without caching
                return func(*args, **kwargs)
            
            # Try to get from cache
            try:
                cached_result = cache.get(cache_key)
                if cached_result is not None:
                    logger.info(f"Cache hit for key: {cache_key}")
                    
                    # Add "cached": true to the response
                    response_data = _add_cached_field(cached_result, cached=True)
                    
                    # Return cached response
                    return jsonify(response_data)
            except Exception as e:
                logger.warning(f"Cache read failed: {str(e)}")
                # Continue to execute handler if cache read fails
            
            # Cache miss - execute the handler
            logger.debug(f"Cache miss for key: {cache_key}")
            result = func(*args, **kwargs)
            
            # Try to cache the result
            try:
                # Extract response data for caching
                response_data = _extract_response_data(result)
                
                if response_data is not None:
                    # Check cache condition if provided
                    should_cache = True
                    if cache_condition is not None:
                        try:
                            should_cache = cache_condition(response_data)
                        except Exception as e:
                            logger.warning(f"Cache condition check failed: {str(e)}")
                            should_cache = False
                    
                    if should_cache:
                        # Store in cache
                        cache.set(cache_key, response_data, timeout=ttl)
                        logger.info(f"Cached result for key: {cache_key} with TTL: {ttl}s")
                    else:
                        logger.debug(f"Skipping cache for key: {cache_key} (condition not met)")
                    
                    # Add "cached": false to the response
                    response_data = _add_cached_field(response_data, cached=False)
                    
                    # Return modified response
                    return jsonify(response_data)
            except Exception as e:
                logger.warning(f"Cache write failed: {str(e)}")
                # Continue and return the original result even if caching fails
            
            # Return original result if caching failed
            return result
        
        return wrapper
    return decorator


def _extract_response_data(result: Any) -> Optional[Dict]:
    """
    Extract response data from Flask response object or tuple.
    
    Args:
        result: Flask response (Response object, dict, tuple, etc.)
    
    Returns:
        Dictionary containing response data, or None if extraction fails
    """
    try:
        # Handle tuple responses (data, status_code)
        if isinstance(result, tuple):
            data = result[0]
            if isinstance(data, Response):
                # Extract JSON from Response object
                return json.loads(data.get_data(as_text=True))
            elif isinstance(data, dict):
                return data
            else:
                return None
        
        # Handle Response objects
        elif isinstance(result, Response):
            return json.loads(result.get_data(as_text=True))
        
        # Handle dict responses
        elif isinstance(result, dict):
            return result
        
        else:
            logger.warning(f"Unsupported response type for caching: {type(result)}")
            return None
    except Exception as e:
        logger.warning(f"Failed to extract response data: {str(e)}")
        return None


def _add_cached_field(data: Dict, cached: bool) -> Dict:
    """
    Add "cached" field to response data.
    
    Args:
        data: Response data dictionary
        cached: Whether the response was served from cache
    
    Returns:
        Modified response data with "cached" field
    """
    if isinstance(data, dict):
        # Create a copy to avoid modifying the original
        modified_data = data.copy()
        modified_data['cached'] = cached
        return modified_data
    else:
        return data


def cache_key_with_image_hash(image_data: bytes, prefix: str = "") -> str:
    """
    Generate a cache key from image data hash.
    
    This is a utility function for generating cache keys specifically for
    image-based operations where the image content is the primary identifier.
    
    Args:
        image_data: Raw image bytes
        prefix: Optional prefix for the cache key
    
    Returns:
        Cache key string
    
    Example:
        cache_key = cache_key_with_image_hash(image_data, prefix="scan_ingredients")
    """
    image_hash = hashlib.md5(image_data).hexdigest()
    if prefix:
        return f"{prefix}_{image_hash}"
    return image_hash


def should_not_cache_sensitive_data(response_data: Dict) -> bool:
    """
    Cache condition function to prevent caching of sensitive data.
    
    This function checks if the response contains sensitive fields that should
    not be cached (auth tokens, passwords, API keys, etc.).
    
    Args:
        response_data: Response data dictionary
    
    Returns:
        True if response should be cached, False if it contains sensitive data
    
    Example:
        @cached_route(ttl=300, cache_condition=should_not_cache_sensitive_data)
        def my_route():
            return jsonify({"data": "value"})
    
    Requirements:
        - Validates: Requirements 12.2 (No caching of sensitive responses)
    """
    sensitive_fields = [
        'token', 'access_token', 'refresh_token', 'auth_token',
        'password', 'api_key', 'secret', 'private_key',
        'authorization', 'credentials'
    ]
    
    # Check if any sensitive field exists in the response
    if isinstance(response_data, dict):
        for field in sensitive_fields:
            if field in response_data:
                logger.info(f"Skipping cache: sensitive field '{field}' detected")
                return False
        
        # Check nested data field
        if 'data' in response_data and isinstance(response_data['data'], dict):
            for field in sensitive_fields:
                if field in response_data['data']:
                    logger.info(f"Skipping cache: sensitive field '{field}' detected in data")
                    return False
    
    return True


def cached_image_route(
    ttl: int = 3600,
    key_prefix: str = "image",
    file_param: str = "image"
):
    """
    Decorator for caching Flask route handlers that process image uploads.
    
    This decorator provides automatic caching for image-based route handlers:
    - Generates cache keys from image content hash (MD5)
    - Checks cache before processing the image
    - Stores handler results in cache with configurable TTL
    - Includes "cached": true/false field in JSON responses
    - Handles cache failures gracefully
    
    Args:
        ttl: Time-to-live for cached data in seconds (default: 3600 = 1 hour)
        key_prefix: Prefix for cache keys (e.g., "analyze_meal", "scan_ingredients")
        file_param: Name of the file parameter in request.files (default: "image")
    
    Returns:
        Decorated function that implements image-based caching logic
    
    Example:
        @ai_bp.route('/analyze-meal', methods=['POST'])
        @token_required
        @cached_image_route(ttl=86400, key_prefix="analyze_meal")
        def analyze_meal(user_id):
            # Handler receives image_data as first positional argument
            # Handler logic here
            return jsonify({"success": True, "data": result})
    
    Requirements:
        - Validates: Requirements 2.3 (Meal analysis caching with 24-hour TTL)
        - Validates: Requirements 2.5 (60% cache hit rate for AI endpoints)
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                # Check if image file is present
                if file_param not in request.files:
                    return jsonify({"success": False, "error": "No image uploaded"}), 400
                
                file = request.files[file_param]
                
                # Read image data
                file.seek(0)
                image_data = file.read()
                file.seek(0)  # Reset for handler to use
                
                # Generate cache key from image hash
                image_hash = hashlib.md5(image_data).hexdigest()
                cache_key = f"{key_prefix}_{image_hash}"
                
                logger.debug(f"Generated image cache key: {cache_key}")
                
                # Try to get from cache
                try:
                    cached_result = cache.get(cache_key)
                    if cached_result is not None:
                        logger.info(f"Cache hit for key: {cache_key}")
                        
                        # Add "cached": true to the response
                        response_data = _add_cached_field(cached_result, cached=True)
                        
                        # Return cached response
                        return jsonify(response_data)
                except Exception as e:
                    logger.warning(f"Cache read failed: {str(e)}")
                    # Continue to execute handler if cache read fails
                
                # Cache miss - execute the handler
                logger.debug(f"Cache miss for key: {cache_key}")
                
                # Pass image_data to the handler
                result = func(*args, image_data=image_data, **kwargs)
                
                # Try to cache the result
                try:
                    # Extract response data for caching
                    response_data = _extract_response_data(result)
                    
                    if response_data is not None and response_data.get('success', False):
                        # Store in cache
                        data_to_cache = response_data.get('data', response_data)
                        cache.set(cache_key, data_to_cache, timeout=ttl)
                        logger.info(f"Cached result for key: {cache_key} with TTL: {ttl}s")
                        
                        # Add "cached": false to the response
                        response_data = _add_cached_field(response_data, cached=False)
                        
                        # Return modified response
                        return jsonify(response_data)
                except Exception as e:
                    logger.warning(f"Cache write failed: {str(e)}")
                    # Continue and return the original result even if caching fails
                
                # Return original result if caching failed
                return result
                
            except Exception as e:
                logger.error(f"Error in cached_image_route: {str(e)}")
                # If anything fails, execute handler without caching
                return func(*args, **kwargs)
        
        return wrapper
    return decorator
