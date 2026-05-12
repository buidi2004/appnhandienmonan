"""
Unit tests for cache utility functions.

Tests cover:
- Cache key generation with various inputs
- User-specific cache key generation
- Image-based cache key generation
- AI suggestion cache key generation
- Parameter normalization
- Consistency and uniqueness of cache keys
- Cache statistics tracking and calculation
"""

import unittest
from unittest.mock import Mock
from backend.utils.cache_utils import (
    generate_cache_key,
    generate_cache_key_from_request,
    generate_image_cache_key,
    generate_ai_suggestion_cache_key,
    _normalize_params,
    CacheStatistics,
    cache_stats,
    get_cache_statistics,
    reset_cache_statistics,
    record_cache_hit,
    record_cache_miss
)


class TestCacheKeyGeneration(unittest.TestCase):
    """Test cache key generation functions."""
    
    def test_generate_cache_key_basic(self):
        """Test basic cache key generation without optional parameters."""
        key = generate_cache_key('GET', '/api/v1/recipes')
        
        # Should return a 32-character MD5 hash
        self.assertEqual(len(key), 32)
        self.assertTrue(all(c in '0123456789abcdef' for c in key))
    
    def test_generate_cache_key_with_query_params(self):
        """Test cache key generation with query parameters."""
        key1 = generate_cache_key('GET', '/api/v1/recipes', {'q': 'pasta', 'category': 'italian'})
        key2 = generate_cache_key('GET', '/api/v1/recipes', {'q': 'pasta', 'category': 'italian'})
        
        # Same parameters should produce same key
        self.assertEqual(key1, key2)
    
    def test_generate_cache_key_with_user_id(self):
        """Test cache key generation with user ID."""
        key1 = generate_cache_key('GET', '/api/v1/recipes', user_id='user123')
        key2 = generate_cache_key('GET', '/api/v1/recipes', user_id='user456')
        
        # Different user IDs should produce different keys
        self.assertNotEqual(key1, key2)
    
    def test_generate_cache_key_consistency(self):
        """Test that identical parameters always produce the same key."""
        params = {'q': 'pasta', 'category': 'italian', 'limit': 10}
        
        key1 = generate_cache_key('GET', '/api/v1/recipes', params, 'user123')
        key2 = generate_cache_key('GET', '/api/v1/recipes', params, 'user123')
        key3 = generate_cache_key('GET', '/api/v1/recipes', params, 'user123')
        
        self.assertEqual(key1, key2)
        self.assertEqual(key2, key3)
    
    def test_generate_cache_key_uniqueness(self):
        """Test that different parameters produce different keys."""
        key1 = generate_cache_key('GET', '/api/v1/recipes', {'q': 'pasta'})
        key2 = generate_cache_key('GET', '/api/v1/recipes', {'q': 'pizza'})
        key3 = generate_cache_key('POST', '/api/v1/recipes', {'q': 'pasta'})
        key4 = generate_cache_key('GET', '/api/v1/users', {'q': 'pasta'})
        
        # All keys should be different
        keys = [key1, key2, key3, key4]
        self.assertEqual(len(keys), len(set(keys)))
    
    def test_generate_cache_key_with_body_params(self):
        """Test cache key generation with body parameters."""
        body = {'ingredients': ['tomato', 'pasta'], 'servings': 4}
        
        key1 = generate_cache_key('POST', '/api/v1/recipes', body_params=body)
        key2 = generate_cache_key('POST', '/api/v1/recipes', body_params=body)
        
        # Same body should produce same key
        self.assertEqual(key1, key2)
    
    def test_generate_cache_key_parameter_order_independence(self):
        """Test that parameter order doesn't affect cache key."""
        key1 = generate_cache_key('GET', '/api/v1/recipes', {'a': 1, 'b': 2, 'c': 3})
        key2 = generate_cache_key('GET', '/api/v1/recipes', {'c': 3, 'a': 1, 'b': 2})
        key3 = generate_cache_key('GET', '/api/v1/recipes', {'b': 2, 'c': 3, 'a': 1})
        
        # All keys should be identical regardless of parameter order
        self.assertEqual(key1, key2)
        self.assertEqual(key2, key3)
    
    def test_generate_cache_key_method_case_insensitive(self):
        """Test that HTTP method is case-insensitive."""
        key1 = generate_cache_key('get', '/api/v1/recipes')
        key2 = generate_cache_key('GET', '/api/v1/recipes')
        key3 = generate_cache_key('Get', '/api/v1/recipes')
        
        # All keys should be identical
        self.assertEqual(key1, key2)
        self.assertEqual(key2, key3)


class TestCacheKeyFromRequest(unittest.TestCase):
    """Test cache key generation from Flask Request objects."""
    
    def test_generate_cache_key_from_request_basic(self):
        """Test cache key generation from a basic request."""
        # Mock Flask request
        request = Mock()
        request.method = 'GET'
        request.path = '/api/v1/recipes'
        request.args = Mock()
        request.args.to_dict.return_value = {'q': 'pasta'}
        request.is_json = False
        
        key = generate_cache_key_from_request(request)
        
        # Should return a valid MD5 hash
        self.assertEqual(len(key), 32)
    
    def test_generate_cache_key_from_request_with_user(self):
        """Test cache key generation from request with user ID."""
        request = Mock()
        request.method = 'GET'
        request.path = '/api/v1/recipes'
        request.args = Mock()
        request.args.to_dict.return_value = {}
        request.is_json = False
        
        key1 = generate_cache_key_from_request(request, user_id='user123')
        key2 = generate_cache_key_from_request(request, user_id='user456')
        
        # Different users should produce different keys
        self.assertNotEqual(key1, key2)
    
    def test_generate_cache_key_from_request_with_body(self):
        """Test cache key generation from request with JSON body."""
        request = Mock()
        request.method = 'POST'
        request.path = '/api/v1/recipes'
        request.args = None
        request.is_json = True
        request.get_json.return_value = {'name': 'Pasta Recipe', 'servings': 4}
        
        key = generate_cache_key_from_request(request, include_body=True)
        
        # Should return a valid MD5 hash
        self.assertEqual(len(key), 32)
    
    def test_generate_cache_key_from_request_without_body(self):
        """Test that body is not included when include_body=False."""
        request = Mock()
        request.method = 'POST'
        request.path = '/api/v1/recipes'
        request.args = None
        request.is_json = True
        request.get_json.return_value = {'name': 'Pasta Recipe', 'servings': 4}
        
        key1 = generate_cache_key_from_request(request, include_body=False)
        key2 = generate_cache_key_from_request(request, include_body=False)
        
        # Should produce same key regardless of body content
        self.assertEqual(key1, key2)


class TestImageCacheKey(unittest.TestCase):
    """Test image-based cache key generation."""
    
    def test_generate_image_cache_key_basic(self):
        """Test basic image cache key generation."""
        key = generate_image_cache_key('abc123def456')
        
        # Should return a valid MD5 hash
        self.assertEqual(len(key), 32)
    
    def test_generate_image_cache_key_consistency(self):
        """Test that same image hash produces same key."""
        key1 = generate_image_cache_key('abc123def456')
        key2 = generate_image_cache_key('abc123def456')
        
        self.assertEqual(key1, key2)
    
    def test_generate_image_cache_key_uniqueness(self):
        """Test that different image hashes produce different keys."""
        key1 = generate_image_cache_key('abc123def456')
        key2 = generate_image_cache_key('xyz789ghi012')
        
        self.assertNotEqual(key1, key2)
    
    def test_generate_image_cache_key_with_user(self):
        """Test image cache key with user ID."""
        key1 = generate_image_cache_key('abc123def456', user_id='user123')
        key2 = generate_image_cache_key('abc123def456', user_id='user456')
        
        # Different users should produce different keys
        self.assertNotEqual(key1, key2)


class TestAISuggestionCacheKey(unittest.TestCase):
    """Test AI suggestion cache key generation."""
    
    def test_generate_ai_suggestion_cache_key_basic(self):
        """Test basic AI suggestion cache key generation."""
        ingredients = ['tomato', 'pasta', 'cheese']
        key = generate_ai_suggestion_cache_key(ingredients)
        
        # Should return a valid MD5 hash
        self.assertEqual(len(key), 32)
    
    def test_generate_ai_suggestion_cache_key_consistency(self):
        """Test that same parameters produce same key."""
        ingredients = ['tomato', 'pasta', 'cheese']
        health_profile = {'diet': 'vegetarian', 'allergies': ['nuts']}
        
        key1 = generate_ai_suggestion_cache_key(ingredients, health_profile)
        key2 = generate_ai_suggestion_cache_key(ingredients, health_profile)
        
        self.assertEqual(key1, key2)
    
    def test_generate_ai_suggestion_cache_key_ingredient_order_independence(self):
        """Test that ingredient order doesn't affect cache key."""
        key1 = generate_ai_suggestion_cache_key(['tomato', 'pasta', 'cheese'])
        key2 = generate_ai_suggestion_cache_key(['cheese', 'tomato', 'pasta'])
        key3 = generate_ai_suggestion_cache_key(['pasta', 'cheese', 'tomato'])
        
        # All keys should be identical (ingredients are sorted internally)
        self.assertEqual(key1, key2)
        self.assertEqual(key2, key3)
    
    def test_generate_ai_suggestion_cache_key_with_all_params(self):
        """Test AI suggestion cache key with all parameters."""
        ingredients = ['tomato', 'pasta']
        health_profile = {'diet': 'vegetarian'}
        pantry_context = {'pantry_items': ['salt', 'pepper']}
        
        key = generate_ai_suggestion_cache_key(
            ingredients,
            health_profile,
            pantry_context,
            user_id='user123'
        )
        
        # Should return a valid MD5 hash
        self.assertEqual(len(key), 32)
    
    def test_generate_ai_suggestion_cache_key_uniqueness(self):
        """Test that different parameters produce different keys."""
        key1 = generate_ai_suggestion_cache_key(['tomato', 'pasta'])
        key2 = generate_ai_suggestion_cache_key(['tomato', 'cheese'])
        key3 = generate_ai_suggestion_cache_key(['tomato', 'pasta'], {'diet': 'vegan'})
        
        # All keys should be different
        keys = [key1, key2, key3]
        self.assertEqual(len(keys), len(set(keys)))


class TestNormalizeParams(unittest.TestCase):
    """Test parameter normalization function."""
    
    def test_normalize_params_empty(self):
        """Test normalization of empty parameters."""
        result = _normalize_params(None)
        self.assertEqual(result, {})
        
        result = _normalize_params({})
        self.assertEqual(result, {})
    
    def test_normalize_params_simple(self):
        """Test normalization of simple parameters."""
        params = {'a': 1, 'b': 'test', 'c': True}
        result = _normalize_params(params)
        
        self.assertEqual(result, params)
    
    def test_normalize_params_with_list(self):
        """Test normalization of parameters with lists."""
        params = {'items': [3, 1, 2]}
        result = _normalize_params(params)
        
        # List should be sorted
        self.assertEqual(result['items'], [1, 2, 3])
    
    def test_normalize_params_with_nested_dict(self):
        """Test normalization of nested dictionaries."""
        params = {
            'outer': {
                'inner': {
                    'value': 123
                }
            }
        }
        result = _normalize_params(params)
        
        self.assertEqual(result['outer']['inner']['value'], 123)
    
    def test_normalize_params_with_unsortable_list(self):
        """Test normalization of lists with unsortable items."""
        params = {'items': [{'a': 1}, {'b': 2}]}
        result = _normalize_params(params)
        
        # Should keep original order for unsortable items
        self.assertEqual(result['items'], [{'a': 1}, {'b': 2}])


class TestCacheStatistics(unittest.TestCase):
    """Test cache statistics tracking and calculation."""
    
    def setUp(self):
        """Reset cache statistics before each test."""
        reset_cache_statistics()
    
    def tearDown(self):
        """Reset cache statistics after each test."""
        reset_cache_statistics()
    
    def test_initial_statistics_are_zero(self):
        """Test that initial statistics are all zero."""
        stats = get_cache_statistics()
        
        self.assertEqual(stats['global']['hits'], 0)
        self.assertEqual(stats['global']['misses'], 0)
        self.assertEqual(stats['global']['total_requests'], 0)
        self.assertEqual(stats['global']['hit_rate'], 0.0)
        self.assertEqual(stats['endpoints'], {})
    
    def test_record_cache_hit_increments_global_counter(self):
        """Test that recording a cache hit increments global counter."""
        record_cache_hit()
        
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['hits'], 1)
        self.assertEqual(stats['global']['misses'], 0)
        self.assertEqual(stats['global']['total_requests'], 1)
    
    def test_record_cache_miss_increments_global_counter(self):
        """Test that recording a cache miss increments global counter."""
        record_cache_miss()
        
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['hits'], 0)
        self.assertEqual(stats['global']['misses'], 1)
        self.assertEqual(stats['global']['total_requests'], 1)
    
    def test_record_cache_hit_with_endpoint(self):
        """Test that recording a cache hit with endpoint tracks per-endpoint stats."""
        endpoint = '/api/v1/recipes/search'
        record_cache_hit(endpoint)
        
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['hits'], 1)
        self.assertIn(endpoint, stats['endpoints'])
        self.assertEqual(stats['endpoints'][endpoint]['hits'], 1)
        self.assertEqual(stats['endpoints'][endpoint]['misses'], 0)
    
    def test_record_cache_miss_with_endpoint(self):
        """Test that recording a cache miss with endpoint tracks per-endpoint stats."""
        endpoint = '/api/v1/recipes/search'
        record_cache_miss(endpoint)
        
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['misses'], 1)
        self.assertIn(endpoint, stats['endpoints'])
        self.assertEqual(stats['endpoints'][endpoint]['hits'], 0)
        self.assertEqual(stats['endpoints'][endpoint]['misses'], 1)
    
    def test_calculate_hit_rate_with_no_requests(self):
        """Test that hit rate is 0.0 when there are no requests."""
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['hit_rate'], 0.0)
    
    def test_calculate_hit_rate_with_all_hits(self):
        """Test that hit rate is 100.0 when all requests are hits."""
        record_cache_hit()
        record_cache_hit()
        record_cache_hit()
        
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['hit_rate'], 100.0)
    
    def test_calculate_hit_rate_with_all_misses(self):
        """Test that hit rate is 0.0 when all requests are misses."""
        record_cache_miss()
        record_cache_miss()
        record_cache_miss()
        
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['hit_rate'], 0.0)
    
    def test_calculate_hit_rate_with_mixed_hits_and_misses(self):
        """Test that hit rate is calculated correctly with mixed hits and misses."""
        # 7 hits, 3 misses = 70% hit rate
        for _ in range(7):
            record_cache_hit()
        for _ in range(3):
            record_cache_miss()
        
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['total_requests'], 10)
        self.assertEqual(stats['global']['hit_rate'], 70.0)
    
    def test_calculate_endpoint_hit_rate(self):
        """Test that hit rate is calculated correctly per endpoint."""
        endpoint = '/api/v1/recipes/search'
        
        # 8 hits, 2 misses = 80% hit rate
        for _ in range(8):
            record_cache_hit(endpoint)
        for _ in range(2):
            record_cache_miss(endpoint)
        
        stats = get_cache_statistics()
        endpoint_stats = stats['endpoints'][endpoint]
        
        self.assertEqual(endpoint_stats['hits'], 8)
        self.assertEqual(endpoint_stats['misses'], 2)
        self.assertEqual(endpoint_stats['total_requests'], 10)
        self.assertEqual(endpoint_stats['hit_rate'], 80.0)
    
    def test_multiple_endpoints_tracked_separately(self):
        """Test that multiple endpoints are tracked separately."""
        endpoint1 = '/api/v1/recipes/search'
        endpoint2 = '/api/v1/ai/suggest-recipes'
        
        # Endpoint 1: 3 hits, 1 miss = 75% hit rate
        record_cache_hit(endpoint1)
        record_cache_hit(endpoint1)
        record_cache_hit(endpoint1)
        record_cache_miss(endpoint1)
        
        # Endpoint 2: 1 hit, 3 misses = 25% hit rate
        record_cache_hit(endpoint2)
        record_cache_miss(endpoint2)
        record_cache_miss(endpoint2)
        record_cache_miss(endpoint2)
        
        stats = get_cache_statistics()
        
        # Global stats: 4 hits, 4 misses = 50% hit rate
        self.assertEqual(stats['global']['hits'], 4)
        self.assertEqual(stats['global']['misses'], 4)
        self.assertEqual(stats['global']['hit_rate'], 50.0)
        
        # Endpoint 1 stats
        self.assertEqual(stats['endpoints'][endpoint1]['hit_rate'], 75.0)
        
        # Endpoint 2 stats
        self.assertEqual(stats['endpoints'][endpoint2]['hit_rate'], 25.0)
    
    def test_get_statistics_for_specific_endpoint(self):
        """Test getting statistics for a specific endpoint."""
        endpoint = '/api/v1/recipes/search'
        
        record_cache_hit(endpoint)
        record_cache_hit(endpoint)
        record_cache_miss(endpoint)
        
        endpoint_stats = get_cache_statistics(endpoint)
        
        self.assertEqual(endpoint_stats['hits'], 2)
        self.assertEqual(endpoint_stats['misses'], 1)
        self.assertEqual(endpoint_stats['total_requests'], 3)
        self.assertAlmostEqual(endpoint_stats['hit_rate'], 66.67, places=2)
    
    def test_get_statistics_for_nonexistent_endpoint(self):
        """Test getting statistics for an endpoint that hasn't been tracked."""
        endpoint = '/api/v1/nonexistent'
        
        endpoint_stats = get_cache_statistics(endpoint)
        
        self.assertEqual(endpoint_stats['hits'], 0)
        self.assertEqual(endpoint_stats['misses'], 0)
        self.assertEqual(endpoint_stats['total_requests'], 0)
        self.assertEqual(endpoint_stats['hit_rate'], 0.0)
    
    def test_reset_statistics_clears_all_data(self):
        """Test that reset clears all statistics."""
        endpoint = '/api/v1/recipes/search'
        
        # Record some statistics
        record_cache_hit(endpoint)
        record_cache_miss(endpoint)
        record_cache_hit()
        
        # Verify statistics exist
        stats = get_cache_statistics()
        self.assertGreater(stats['global']['total_requests'], 0)
        self.assertIn(endpoint, stats['endpoints'])
        
        # Reset statistics
        reset_cache_statistics()
        
        # Verify statistics are cleared
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['hits'], 0)
        self.assertEqual(stats['global']['misses'], 0)
        self.assertEqual(stats['global']['total_requests'], 0)
        self.assertEqual(stats['endpoints'], {})
    
    def test_cache_statistics_thread_safety(self):
        """Test that CacheStatistics is thread-safe."""
        import threading
        
        stats_obj = CacheStatistics()
        
        def record_hits():
            for _ in range(100):
                stats_obj.record_hit()
        
        def record_misses():
            for _ in range(100):
                stats_obj.record_miss()
        
        # Create multiple threads
        threads = []
        for _ in range(5):
            threads.append(threading.Thread(target=record_hits))
            threads.append(threading.Thread(target=record_misses))
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Verify total counts
        global_stats = stats_obj.get_global_stats()
        self.assertEqual(global_stats['hits'], 500)  # 5 threads * 100 hits
        self.assertEqual(global_stats['misses'], 500)  # 5 threads * 100 misses
        self.assertEqual(global_stats['total_requests'], 1000)
        self.assertEqual(global_stats['hit_rate'], 50.0)
    
    def test_hit_rate_rounded_to_two_decimals(self):
        """Test that hit rate is rounded to 2 decimal places."""
        # 1 hit, 3 misses = 25% hit rate
        record_cache_hit()
        record_cache_miss()
        record_cache_miss()
        record_cache_miss()
        
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['hit_rate'], 25.0)
        
        # Add more to get a decimal hit rate
        # 2 hits, 3 misses = 40% hit rate
        record_cache_hit()
        
        stats = get_cache_statistics()
        self.assertEqual(stats['global']['hit_rate'], 40.0)


if __name__ == '__main__':
    unittest.main()
