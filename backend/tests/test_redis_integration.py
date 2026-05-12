"""
Integration tests for Redis configuration with Flask application.
Tests the complete setup including cache initialization and operations.
"""

import unittest
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


class TestRedisIntegration(unittest.TestCase):
    """Integration tests for Redis with Flask application."""
    
    def setUp(self):
        """Set up test Flask application."""
        from flask import Flask
        from config import cache
        
        self.app = Flask(__name__)
        cache.init_app(self.app)
        self.cache = cache
        self.client = self.app.test_client()
    
    def test_cache_initialization(self):
        """Test that cache is properly initialized."""
        self.assertIsNotNone(self.cache)
    
    def test_cache_basic_operations(self):
        """Test basic cache set, get, and delete operations."""
        with self.app.app_context():
            # Test set and get
            self.cache.set('test_key', 'test_value')
            value = self.cache.get('test_key')
            self.assertEqual(value, 'test_value')
            
            # Test delete
            self.cache.delete('test_key')
            value = self.cache.get('test_key')
            self.assertIsNone(value)
    
    def test_cache_with_timeout(self):
        """Test cache operations with timeout."""
        with self.app.app_context():
            # Set value with 60 second timeout
            self.cache.set('timeout_key', 'timeout_value', timeout=60)
            value = self.cache.get('timeout_key')
            self.assertEqual(value, 'timeout_value')
    
    def test_cache_with_complex_data(self):
        """Test caching complex data structures."""
        with self.app.app_context():
            # Test with dictionary
            test_dict = {
                'name': 'Test Recipe',
                'ingredients': ['flour', 'sugar', 'eggs'],
                'servings': 4
            }
            self.cache.set('recipe_key', test_dict)
            cached_dict = self.cache.get('recipe_key')
            self.assertEqual(cached_dict, test_dict)
            
            # Test with list
            test_list = [1, 2, 3, 4, 5]
            self.cache.set('list_key', test_list)
            cached_list = self.cache.get('list_key')
            self.assertEqual(cached_list, test_list)
    
    def test_cache_key_prefix(self):
        """Test that cache keys use the configured prefix."""
        from config import cache_config
        
        if cache_config.get('CACHE_TYPE') == 'redis':
            self.assertEqual(cache_config.get('CACHE_KEY_PREFIX'), 'appnauan_')
    
    def test_redis_availability_check(self):
        """Test the is_redis_available helper function."""
        from config import is_redis_available
        
        # Function should return a boolean
        result = is_redis_available()
        self.assertIsInstance(result, bool)
    
    def test_cache_fallback_configuration(self):
        """Test that cache configuration includes fallback settings."""
        from config import cache_config
        
        # Should have a cache type
        self.assertIn('CACHE_TYPE', cache_config)
        self.assertIn(cache_config['CACHE_TYPE'], ['redis', 'simple'])
        
        # Should have default timeout
        self.assertEqual(cache_config['CACHE_DEFAULT_TIMEOUT'], 300)
    
    def test_cache_multiple_keys(self):
        """Test caching multiple keys simultaneously."""
        with self.app.app_context():
            # Set multiple keys
            keys_values = {
                'key1': 'value1',
                'key2': 'value2',
                'key3': 'value3'
            }
            
            for key, value in keys_values.items():
                self.cache.set(key, value)
            
            # Verify all keys
            for key, expected_value in keys_values.items():
                cached_value = self.cache.get(key)
                self.assertEqual(cached_value, expected_value)
            
            # Clean up
            for key in keys_values.keys():
                self.cache.delete(key)


class TestRedisConnectionPooling(unittest.TestCase):
    """Test Redis connection pooling configuration."""
    
    def test_connection_pool_exists(self):
        """Test that connection pool is created when Redis is available."""
        from config import redis_client, redis_pool
        
        if redis_client is not None:
            self.assertIsNotNone(redis_pool)
    
    def test_redis_client_configuration(self):
        """Test that Redis client is properly configured."""
        from config import redis_client
        
        if redis_client is not None:
            # Test that client can perform basic operations
            try:
                redis_client.ping()
                self.assertTrue(True)
            except Exception:
                self.fail("Redis client ping failed")


class TestEnvironmentVariables(unittest.TestCase):
    """Test environment variable configuration."""
    
    def test_redis_env_vars_defaults(self):
        """Test that Redis environment variables have proper defaults."""
        # These should not raise exceptions
        redis_host = os.getenv('REDIS_HOST', 'localhost')
        redis_port = os.getenv('REDIS_PORT', '6379')
        redis_db = os.getenv('REDIS_DB', '0')
        
        self.assertIsNotNone(redis_host)
        self.assertIsNotNone(redis_port)
        self.assertIsNotNone(redis_db)


if __name__ == '__main__':
    unittest.main()
