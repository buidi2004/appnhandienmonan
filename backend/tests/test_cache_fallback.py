"""
Unit tests for cache fallback mechanism.

Tests cover:
- Fallback to in-memory cache when Redis is unavailable
- Cache configuration with Redis
- Cache configuration with in-memory fallback
- Redis availability checking
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestCacheFallback(unittest.TestCase):
    """Test suite for cache fallback mechanism."""
    
    @patch('config.redis')
    @patch('config.os.getenv')
    def test_redis_connection_success(self, mock_getenv, mock_redis):
        """Test successful Redis connection configuration."""
        # Mock environment variables
        mock_getenv.side_effect = lambda key, default=None: {
            'REDIS_HOST': 'localhost',
            'REDIS_PORT': '6379',
            'REDIS_DB': '0',
            'REDIS_PASSWORD': None,
            'REDIS_URL': None
        }.get(key, default)
        
        # Mock Redis connection
        mock_pool = MagicMock()
        mock_client = MagicMock()
        mock_client.ping.return_value = True
        mock_redis.ConnectionPool.return_value = mock_pool
        mock_redis.Redis.return_value = mock_client
        
        # Import after mocking
        from config import create_redis_connection
        
        client, pool = create_redis_connection()
        
        # Verify connection was created
        self.assertIsNotNone(client)
        self.assertIsNotNone(pool)
        mock_client.ping.assert_called_once()
    
    @patch('config.redis.ConnectionPool')
    @patch('config.os.getenv')
    @patch('config.logger')
    def test_redis_connection_failure_fallback(self, mock_logger, mock_getenv, mock_pool):
        """Test fallback to in-memory cache when Redis connection fails."""
        # Mock environment variables
        mock_getenv.side_effect = lambda key, default=None: {
            'REDIS_HOST': 'localhost',
            'REDIS_PORT': '6379',
            'REDIS_DB': '0',
            'REDIS_PASSWORD': None,
            'REDIS_URL': None
        }.get(key, default)
        
        # Mock Redis connection failure - use a proper exception type
        import redis as redis_module
        mock_pool.side_effect = redis_module.ConnectionError("Connection refused")
        
        # Import after mocking
        from config import create_redis_connection
        
        client, pool = create_redis_connection()
        
        # Verify fallback occurred
        self.assertIsNone(client)
        self.assertIsNone(pool)
        
        # Verify warning was logged
        mock_logger.warning.assert_called()
    
    @patch('config.redis_client', None)
    def test_cache_config_with_redis_unavailable(self):
        """Test cache configuration when Redis is unavailable."""
        from config import get_cache_config
        
        cache_config = get_cache_config()
        
        # Verify in-memory cache configuration
        self.assertEqual(cache_config['CACHE_TYPE'], 'simple')
        self.assertIn('CACHE_DEFAULT_TIMEOUT', cache_config)
        self.assertIn('CACHE_THRESHOLD', cache_config)
    
    @patch('config.redis_client')
    def test_cache_config_with_redis_available(self, mock_redis_client):
        """Test cache configuration when Redis is available."""
        mock_redis_client.ping.return_value = True
        
        from config import get_cache_config
        
        cache_config = get_cache_config()
        
        # Verify Redis cache configuration
        self.assertEqual(cache_config['CACHE_TYPE'], 'redis')
        self.assertIn('CACHE_REDIS_URL', cache_config)
        self.assertIn('CACHE_KEY_PREFIX', cache_config)
    
    @patch('config.redis_client', None)
    def test_is_redis_available_returns_false_when_none(self):
        """Test that is_redis_available returns False when redis_client is None."""
        from config import is_redis_available
        
        result = is_redis_available()
        
        self.assertFalse(result)
    
    @patch('config.redis_client')
    def test_is_redis_available_returns_true_when_connected(self, mock_redis_client):
        """Test that is_redis_available returns True when Redis is connected."""
        mock_redis_client.ping.return_value = True
        
        from config import is_redis_available
        
        result = is_redis_available()
        
        self.assertTrue(result)
        mock_redis_client.ping.assert_called_once()
    
    @patch('config.redis_client')
    def test_is_redis_available_returns_false_on_ping_failure(self, mock_redis_client):
        """Test that is_redis_available returns False when ping fails."""
        mock_redis_client.ping.side_effect = Exception("Connection lost")
        
        from config import is_redis_available
        
        result = is_redis_available()
        
        self.assertFalse(result)
    
    @patch('config.os.getenv')
    def test_redis_connection_with_url(self, mock_getenv):
        """Test Redis connection using REDIS_URL."""
        # Mock environment variables with REDIS_URL
        mock_getenv.side_effect = lambda key, default=None: {
            'REDIS_URL': 'redis://localhost:6379/0',
            'REDIS_HOST': 'localhost',
            'REDIS_PORT': '6379',
            'REDIS_DB': '0',
            'REDIS_PASSWORD': None
        }.get(key, default)
        
        with patch('config.redis') as mock_redis:
            mock_pool = MagicMock()
            mock_client = MagicMock()
            mock_client.ping.return_value = True
            mock_redis.ConnectionPool.from_url.return_value = mock_pool
            mock_redis.Redis.return_value = mock_client
            
            from config import create_redis_connection
            
            client, pool = create_redis_connection()
            
            # Verify from_url was called
            mock_redis.ConnectionPool.from_url.assert_called_once()
            self.assertIsNotNone(client)
            self.assertIsNotNone(pool)
    
    @patch('config.os.getenv')
    def test_redis_connection_with_password(self, mock_getenv):
        """Test Redis connection with password authentication."""
        # Mock environment variables with password
        mock_getenv.side_effect = lambda key, default=None: {
            'REDIS_HOST': 'localhost',
            'REDIS_PORT': '6379',
            'REDIS_DB': '0',
            'REDIS_PASSWORD': 'secret_password',
            'REDIS_URL': None
        }.get(key, default)
        
        with patch('config.redis') as mock_redis:
            mock_pool = MagicMock()
            mock_client = MagicMock()
            mock_client.ping.return_value = True
            mock_redis.ConnectionPool.return_value = mock_pool
            mock_redis.Redis.return_value = mock_client
            
            from config import create_redis_connection
            
            client, pool = create_redis_connection()
            
            # Verify ConnectionPool was called with password
            call_kwargs = mock_redis.ConnectionPool.call_args[1]
            self.assertEqual(call_kwargs['password'], 'secret_password')
    
    def test_cache_default_timeout_configuration(self):
        """Test that cache has default timeout configured."""
        from config import cache_config
        
        self.assertIn('CACHE_DEFAULT_TIMEOUT', cache_config)
        self.assertIsInstance(cache_config['CACHE_DEFAULT_TIMEOUT'], int)
        self.assertGreater(cache_config['CACHE_DEFAULT_TIMEOUT'], 0)
    
    @patch('config.redis_client')
    def test_cache_key_prefix_configuration(self, mock_redis_client):
        """Test that cache has key prefix configured when using Redis."""
        mock_redis_client.ping.return_value = True
        
        from config import get_cache_config
        
        cache_config = get_cache_config()
        
        if cache_config['CACHE_TYPE'] == 'redis':
            self.assertIn('CACHE_KEY_PREFIX', cache_config)
            self.assertTrue(cache_config['CACHE_KEY_PREFIX'].startswith('appnauan'))
    
    def test_in_memory_cache_threshold_configuration(self):
        """Test that in-memory cache has threshold configured."""
        with patch('config.redis_client', None):
            from config import get_cache_config
            
            cache_config = get_cache_config()
            
            if cache_config['CACHE_TYPE'] == 'simple':
                self.assertIn('CACHE_THRESHOLD', cache_config)
                self.assertIsInstance(cache_config['CACHE_THRESHOLD'], int)
                self.assertGreater(cache_config['CACHE_THRESHOLD'], 0)


class TestCacheFallbackIntegration(unittest.TestCase):
    """Integration tests for cache fallback behavior."""
    
    def setUp(self):
        """Set up test Flask app."""
        from flask import Flask
        from config import cache
        
        self.app = Flask(__name__)
        cache.init_app(self.app)
        self.cache = cache
    
    def test_cache_set_and_get_operations(self):
        """Test basic cache set and get operations work with fallback."""
        with self.app.app_context():
            # Set a value
            self.cache.set('test_key', 'test_value', timeout=60)
            
            # Get the value
            result = self.cache.get('test_key')
            
            # Verify value was stored and retrieved
            self.assertEqual(result, 'test_value')
    
    def test_cache_delete_operation(self):
        """Test cache delete operation works with fallback."""
        with self.app.app_context():
            # Set a value
            self.cache.set('test_key', 'test_value', timeout=60)
            
            # Verify it exists
            self.assertIsNotNone(self.cache.get('test_key'))
            
            # Delete the value
            self.cache.delete('test_key')
            
            # Verify it's gone
            self.assertIsNone(self.cache.get('test_key'))
    
    def test_cache_clear_operation(self):
        """Test cache clear operation works with fallback."""
        with self.app.app_context():
            # Set multiple values
            self.cache.set('key1', 'value1', timeout=60)
            self.cache.set('key2', 'value2', timeout=60)
            
            # Clear cache
            self.cache.clear()
            
            # Verify all values are gone
            self.assertIsNone(self.cache.get('key1'))
            self.assertIsNone(self.cache.get('key2'))
    
    def test_cache_handles_none_values(self):
        """Test that cache can store and retrieve None values."""
        with self.app.app_context():
            # Set None value
            self.cache.set('test_key', None, timeout=60)
            
            # Get the value (should return None, not because it's missing)
            result = self.cache.get('test_key')
            
            # This is expected behavior - cache returns None for both missing and None values
            self.assertIsNone(result)
    
    def test_cache_handles_complex_data_types(self):
        """Test that cache can store and retrieve complex data types."""
        with self.app.app_context():
            # Test with dictionary
            test_dict = {'key': 'value', 'nested': {'inner': 123}}
            self.cache.set('dict_key', test_dict, timeout=60)
            result = self.cache.get('dict_key')
            self.assertEqual(result, test_dict)
            
            # Test with list
            test_list = [1, 2, 3, 'four', {'five': 5}]
            self.cache.set('list_key', test_list, timeout=60)
            result = self.cache.get('list_key')
            self.assertEqual(result, test_list)


if __name__ == '__main__':
    unittest.main()
