"""
Cache utility functions for generating cache keys and managing cache operations.

This module provides utilities for:
- MD5-based cache key generation from request parameters
- User-specific cache key generation
- Request parameter hashing for consistent cache keys
- Cache statistics tracking (hit/miss counters)
"""

import hashlib
import json
from typing import Any, Dict, Optional
from flask import Request
from threading import Lock


# Global cache statistics
class CacheStatistics:
    """
    Thread-safe cache statistics tracker.
    
    Tracks cache hits and misses globally and per endpoint.
    """
    def __init__(self):
        self._lock = Lock()
        self._global_hits = 0
        self._global_misses = 0
        self._endpoint_stats = {}  # {endpoint: {'hits': int, 'misses': int}}
    
    def record_hit(self, endpoint: Optional[str] = None):
        """
        Record a cache hit.
        
        Args:
            endpoint: Optional endpoint path for per-endpoint tracking
        """
        with self._lock:
            self._global_hits += 1
            if endpoint:
                if endpoint not in self._endpoint_stats:
                    self._endpoint_stats[endpoint] = {'hits': 0, 'misses': 0}
                self._endpoint_stats[endpoint]['hits'] += 1
    
    def record_miss(self, endpoint: Optional[str] = None):
        """
        Record a cache miss.
        
        Args:
            endpoint: Optional endpoint path for per-endpoint tracking
        """
        with self._lock:
            self._global_misses += 1
            if endpoint:
                if endpoint not in self._endpoint_stats:
                    self._endpoint_stats[endpoint] = {'hits': 0, 'misses': 0}
                self._endpoint_stats[endpoint]['misses'] += 1
    
    def get_global_stats(self) -> Dict[str, Any]:
        """
        Get global cache statistics.
        
        Returns:
            Dictionary containing:
            - hits: Total cache hits
            - misses: Total cache misses
            - total_requests: Total requests (hits + misses)
            - hit_rate: Cache hit rate as percentage (0-100)
        """
        with self._lock:
            total = self._global_hits + self._global_misses
            hit_rate = (self._global_hits / total * 100) if total > 0 else 0.0
            
            return {
                'hits': self._global_hits,
                'misses': self._global_misses,
                'total_requests': total,
                'hit_rate': round(hit_rate, 2)
            }
    
    def get_endpoint_stats(self, endpoint: Optional[str] = None) -> Dict[str, Any]:
        """
        Get cache statistics for a specific endpoint or all endpoints.
        
        Args:
            endpoint: Optional endpoint path. If None, returns stats for all endpoints.
        
        Returns:
            If endpoint is specified: Dictionary with hits, misses, total_requests, hit_rate
            If endpoint is None: Dictionary mapping endpoints to their stats
        """
        with self._lock:
            if endpoint:
                if endpoint not in self._endpoint_stats:
                    return {
                        'hits': 0,
                        'misses': 0,
                        'total_requests': 0,
                        'hit_rate': 0.0
                    }
                
                stats = self._endpoint_stats[endpoint]
                total = stats['hits'] + stats['misses']
                hit_rate = (stats['hits'] / total * 100) if total > 0 else 0.0
                
                return {
                    'hits': stats['hits'],
                    'misses': stats['misses'],
                    'total_requests': total,
                    'hit_rate': round(hit_rate, 2)
                }
            else:
                # Return stats for all endpoints
                result = {}
                for ep, stats in self._endpoint_stats.items():
                    total = stats['hits'] + stats['misses']
                    hit_rate = (stats['hits'] / total * 100) if total > 0 else 0.0
                    result[ep] = {
                        'hits': stats['hits'],
                        'misses': stats['misses'],
                        'total_requests': total,
                        'hit_rate': round(hit_rate, 2)
                    }
                return result
    
    def reset_stats(self):
        """Reset all cache statistics."""
        with self._lock:
            self._global_hits = 0
            self._global_misses = 0
            self._endpoint_stats = {}


# Global cache statistics instance
cache_stats = CacheStatistics()


def generate_cache_key(
    method: str,
    path: str,
    query_params: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    body_params: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generate a unique cache key using MD5 hashing from request parameters.
    
    This function creates a consistent cache key by hashing the combination of:
    - HTTP method (GET, POST, etc.)
    - Request path
    - Query parameters (sorted for consistency)
    - User ID (for user-specific caching)
    - Body parameters (for POST/PUT requests)
    
    Args:
        method: HTTP request method (e.g., 'GET', 'POST')
        path: Request path (e.g., '/api/v1/recipes/search')
        query_params: Dictionary of query parameters (optional)
        user_id: User ID for user-specific cache keys (optional)
        body_params: Dictionary of body parameters for POST/PUT requests (optional)
    
    Returns:
        str: MD5 hash string to be used as cache key
    
    Example:
        >>> generate_cache_key('GET', '/api/v1/recipes/search', {'q': 'pasta'}, 'user123')
        'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
    
    Requirements:
        - Validates: Requirements 1.5 (MD5-based key generation)
        - Validates: Requirements 12.1 (User-specific cache keys)
    """
    # Build a dictionary with all components
    key_components = {
        'method': method.upper(),
        'path': path,
        'query_params': _normalize_params(query_params) if query_params else {},
        'user_id': user_id if user_id else None,
        'body_params': _normalize_params(body_params) if body_params else {}
    }
    
    # Convert to JSON string with sorted keys for consistency
    key_string = json.dumps(key_components, sort_keys=True, separators=(',', ':'))
    
    # Generate MD5 hash
    hash_object = hashlib.md5(key_string.encode('utf-8'))
    cache_key = hash_object.hexdigest()
    
    return cache_key


def generate_cache_key_from_request(
    request: Request,
    user_id: Optional[str] = None,
    include_body: bool = False
) -> str:
    """
    Generate a cache key directly from a Flask Request object.
    
    This is a convenience function that extracts parameters from a Flask Request
    object and generates a cache key using generate_cache_key().
    
    Args:
        request: Flask Request object
        user_id: User ID for user-specific cache keys (optional)
        include_body: Whether to include request body in key generation (default: False)
    
    Returns:
        str: MD5 hash string to be used as cache key
    
    Example:
        >>> from flask import request
        >>> cache_key = generate_cache_key_from_request(request, user_id='user123')
    
    Requirements:
        - Validates: Requirements 1.5 (MD5-based key generation)
        - Validates: Requirements 12.1 (User-specific cache keys)
    """
    method = request.method
    path = request.path
    query_params = request.args.to_dict() if request.args else None
    
    body_params = None
    if include_body and request.is_json:
        try:
            body_params = request.get_json()
        except Exception:
            # If JSON parsing fails, don't include body in cache key
            body_params = None
    
    return generate_cache_key(
        method=method,
        path=path,
        query_params=query_params,
        user_id=user_id,
        body_params=body_params
    )


def generate_image_cache_key(image_hash: str, user_id: Optional[str] = None) -> str:
    """
    Generate a cache key for image-based operations (scanning, analysis).
    
    This function creates a cache key specifically for image processing operations
    where the image content hash is the primary identifier.
    
    Args:
        image_hash: Hash of the image content (e.g., MD5 or SHA256 of image bytes)
        user_id: User ID for user-specific cache keys (optional)
    
    Returns:
        str: MD5 hash string to be used as cache key
    
    Example:
        >>> generate_image_cache_key('abc123def456', 'user123')
        'x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6'
    
    Requirements:
        - Validates: Requirements 2.1, 2.3 (Image-based caching)
        - Validates: Requirements 12.1 (User-specific cache keys)
    """
    key_components = {
        'type': 'image',
        'image_hash': image_hash,
        'user_id': user_id if user_id else None
    }
    
    key_string = json.dumps(key_components, sort_keys=True, separators=(',', ':'))
    hash_object = hashlib.md5(key_string.encode('utf-8'))
    cache_key = hash_object.hexdigest()
    
    return cache_key


def generate_ai_suggestion_cache_key(
    ingredients: list,
    health_profile: Optional[Dict[str, Any]] = None,
    pantry_context: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None
) -> str:
    """
    Generate a cache key for AI recipe suggestion operations.
    
    This function creates a cache key for recipe suggestions based on ingredients,
    health profile, and pantry context.
    
    Args:
        ingredients: List of ingredient names or IDs
        health_profile: Dictionary containing health preferences and restrictions (optional)
        pantry_context: Dictionary containing pantry items and quantities (optional)
        user_id: User ID for user-specific cache keys (optional)
    
    Returns:
        str: MD5 hash string to be used as cache key
    
    Example:
        >>> generate_ai_suggestion_cache_key(
        ...     ['tomato', 'pasta', 'cheese'],
        ...     {'diet': 'vegetarian'},
        ...     {'pantry_items': ['salt', 'pepper']},
        ...     'user123'
        ... )
        'p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6'
    
    Requirements:
        - Validates: Requirements 2.2 (Recipe suggestion caching)
        - Validates: Requirements 12.1 (User-specific cache keys)
    """
    key_components = {
        'type': 'ai_suggestion',
        'ingredients': sorted(ingredients) if ingredients else [],
        'health_profile': _normalize_params(health_profile) if health_profile else {},
        'pantry_context': _normalize_params(pantry_context) if pantry_context else {},
        'user_id': user_id if user_id else None
    }
    
    key_string = json.dumps(key_components, sort_keys=True, separators=(',', ':'))
    hash_object = hashlib.md5(key_string.encode('utf-8'))
    cache_key = hash_object.hexdigest()
    
    return cache_key


def _normalize_params(params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Normalize parameters for consistent hashing.
    
    This internal function ensures that parameter dictionaries are normalized
    to produce consistent hash values. It handles:
    - Sorting dictionary keys
    - Converting lists to sorted tuples
    - Handling nested dictionaries
    
    Args:
        params: Dictionary of parameters to normalize
    
    Returns:
        Dict[str, Any]: Normalized parameter dictionary
    """
    if params is None:
        return {}
    
    normalized = {}
    for key, value in params.items():
        if isinstance(value, dict):
            # Recursively normalize nested dictionaries
            normalized[key] = _normalize_params(value)
        elif isinstance(value, list):
            # Sort lists for consistency (if items are sortable)
            try:
                normalized[key] = sorted(value)
            except TypeError:
                # If items are not sortable, keep original order
                normalized[key] = value
        else:
            normalized[key] = value
    
    return normalized


def get_cache_statistics(endpoint: Optional[str] = None) -> Dict[str, Any]:
    """
    Get cache statistics.
    
    Args:
        endpoint: Optional endpoint path. If None, returns global and all endpoint stats.
    
    Returns:
        Dictionary containing cache statistics
    
    Example:
        >>> get_cache_statistics()
        {
            'global': {'hits': 100, 'misses': 20, 'total_requests': 120, 'hit_rate': 83.33},
            'endpoints': {
                '/api/v1/recipes/search': {'hits': 50, 'misses': 10, 'total_requests': 60, 'hit_rate': 83.33},
                '/api/v1/ai/suggest-recipes': {'hits': 30, 'misses': 5, 'total_requests': 35, 'hit_rate': 85.71}
            }
        }
    
    Requirements:
        - Validates: Requirements 10.3 (Cache statistics)
        - Validates: Requirements 11.1 (Cache hit rate per endpoint)
    """
    if endpoint:
        return cache_stats.get_endpoint_stats(endpoint)
    else:
        return {
            'global': cache_stats.get_global_stats(),
            'endpoints': cache_stats.get_endpoint_stats()
        }


def reset_cache_statistics():
    """
    Reset all cache statistics.
    
    This function is primarily for testing purposes.
    """
    cache_stats.reset_stats()


def record_cache_hit(endpoint: Optional[str] = None):
    """
    Record a cache hit.
    
    Args:
        endpoint: Optional endpoint path for per-endpoint tracking
    
    Requirements:
        - Validates: Requirements 10.3 (Cache statistics tracking)
    """
    cache_stats.record_hit(endpoint)


def record_cache_miss(endpoint: Optional[str] = None):
    """
    Record a cache miss.
    
    Args:
        endpoint: Optional endpoint path for per-endpoint tracking
    
    Requirements:
        - Validates: Requirements 10.3 (Cache statistics tracking)
    """
    cache_stats.record_miss(endpoint)
