"""
Admin Routes Blueprint
Provides administrative endpoints for cache management and system monitoring.
"""

from flask import Blueprint, jsonify, request
from utils.cache_utils import get_cache_statistics, reset_cache_statistics
from config import cache, is_redis_available
import logging

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/cache/stats', methods=['GET'])
def get_cache_stats():
    """
    Get cache statistics including hit rate, miss rate, and total requests.
    
    Query Parameters:
        endpoint (optional): Specific endpoint to get stats for
    
    Returns:
        JSON response with cache statistics:
        - If no endpoint specified: Returns global stats and per-endpoint stats
        - If endpoint specified: Returns stats for that specific endpoint
    
    Example Response (no endpoint):
        {
            "success": true,
            "data": {
                "global": {
                    "hits": 100,
                    "misses": 20,
                    "total_requests": 120,
                    "hit_rate": 83.33
                },
                "endpoints": {
                    "/api/v1/recipes/search": {
                        "hits": 50,
                        "misses": 10,
                        "total_requests": 60,
                        "hit_rate": 83.33
                    }
                }
            },
            "redis_available": true
        }
    
    Example Response (with endpoint):
        {
            "success": true,
            "data": {
                "endpoint": "/api/v1/recipes/search",
                "hits": 50,
                "misses": 10,
                "total_requests": 60,
                "hit_rate": 83.33
            },
            "redis_available": true
        }
    
    Requirements:
        - Validates: Requirements 10.3 (Cache statistics)
        - Validates: Requirements 11.1 (Cache hit rate per endpoint)
    """
    try:
        endpoint = request.args.get('endpoint')
        
        if endpoint:
            # Get stats for specific endpoint
            stats = get_cache_statistics(endpoint)
            response_data = {
                'endpoint': endpoint,
                **stats
            }
        else:
            # Get global and all endpoint stats
            response_data = get_cache_statistics()
        
        return jsonify({
            'success': True,
            'data': response_data,
            'redis_available': is_redis_available()
        }), 200
        
    except Exception as e:
        logger.error(f"Error retrieving cache statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve cache statistics',
            'message': str(e)
        }), 500


@admin_bp.route('/cache/clear', methods=['POST'])
def clear_cache():
    """
    Clear cache entries.
    
    Request Body (JSON):
        {
            "key": "specific_cache_key",  // Optional: Clear specific key
            "pattern": "cache_key_pattern*",  // Optional: Clear keys matching pattern
            "all": true  // Optional: Clear all cache
        }
    
    Returns:
        JSON response indicating success or failure
    
    Example Response:
        {
            "success": true,
            "message": "Cache cleared successfully",
            "cleared_count": 5
        }
    
    Requirements:
        - Validates: Requirements 10.4 (Cache clearing)
    """
    try:
        data = request.get_json() or {}
        
        if data.get('all'):
            # Clear all cache
            cache.clear()
            logger.info("All cache cleared by admin")
            return jsonify({
                'success': True,
                'message': 'All cache cleared successfully'
            }), 200
        
        elif 'key' in data:
            # Clear specific key
            key = data['key']
            cache.delete(key)
            logger.info(f"Cache key cleared by admin: {key}")
            return jsonify({
                'success': True,
                'message': f'Cache key cleared: {key}'
            }), 200
        
        elif 'pattern' in data:
            # Clear keys matching pattern (Redis only)
            if not is_redis_available():
                return jsonify({
                    'success': False,
                    'error': 'Pattern clearing requires Redis',
                    'message': 'Redis is not available. Pattern-based clearing is not supported with in-memory cache.'
                }), 400
            
            pattern = data['pattern']
            # Note: This requires direct Redis access
            from config import redis_client
            if redis_client:
                keys = redis_client.keys(f"appnauan_{pattern}")
                if keys:
                    redis_client.delete(*keys)
                    cleared_count = len(keys)
                else:
                    cleared_count = 0
                
                logger.info(f"Cache pattern cleared by admin: {pattern} ({cleared_count} keys)")
                return jsonify({
                    'success': True,
                    'message': f'Cache pattern cleared: {pattern}',
                    'cleared_count': cleared_count
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': 'Redis client not available'
                }), 500
        
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid request',
                'message': 'Must specify "key", "pattern", or "all" in request body'
            }), 400
    
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to clear cache',
            'message': str(e)
        }), 500


@admin_bp.route('/cache/stats/reset', methods=['POST'])
def reset_stats():
    """
    Reset cache statistics counters.
    
    This endpoint resets hit/miss counters to zero.
    Primarily used for testing and monitoring purposes.
    
    Returns:
        JSON response indicating success
    
    Example Response:
        {
            "success": true,
            "message": "Cache statistics reset successfully"
        }
    """
    try:
        reset_cache_statistics()
        logger.info("Cache statistics reset by admin")
        return jsonify({
            'success': True,
            'message': 'Cache statistics reset successfully'
        }), 200
    
    except Exception as e:
        logger.error(f"Error resetting cache statistics: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to reset cache statistics',
            'message': str(e)
        }), 500
