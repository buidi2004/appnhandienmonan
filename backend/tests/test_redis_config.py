"""
Unit tests for Redis configuration and caching functionality.
Tests connection pooling, fallback behavior, and cache operations.
"""

import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


class TestRedisConfiguration(unittest.TestCase):
    """Test Redis configuration and connection pooling."""
    
    def setUp(self):
        """Set up test environment."""
        # Store original environment variables
        self.original_env = {
            'REDIS_URL': os.getenv('REDIS_URL'),
            'REDIS_HOST': os.getenv('REDIS_HOST'),
            'REDIS_PORT': os.getenv('REDIS_PORT'),
            'REDIS_DB': os.getenv('REDIS_DB'),
            'REDIS_PASSWORD': os.getenv('REDIS_PASSWORD'),
        }
    
    def tearDown(self):
        """Restore original environment variables."""
        for key, value in self.original_env.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value
    
    @patch('redis.Redis')
    @patch('redis.ConnectionPool.from_url')
    def test_redis_connection_with_url(self, mock_pool_from_url, mock_redis):
        """Test Redis connection using REDIS_URL."""
        # Set up environment
        os.environ['REDIS_URL'] = 'redis://localhost:6379/0'
        
        # Mock Redis client
        mock_client = MagicMock()
        mock_client.ping.return_value = True
        mock_redis.return_value = mock_client
        
        # Import after setting environment
        from config import create_redis_connection
        
        client, pool = create_redis_connection()
        
        # Verify connection pool was created from URL
        mock_pool_from_url.assert_called_once()
        self.assertIsNotNone(client)
        self.assertIsNotNone(pool)
    
    @patch('redis.Redis')
    @patch('redis.ConnectionPool')
    def test_redis_connection_with_individual_params(self, mock_pool, mock_redis):
        """Test Redis connection using individual parameters."""
        # Set up environment without REDIS_URL
        os.environ.pop('REDIS_URL', None)
        os.environ['REDIS_HOST'] = 'testhost'
        os.environ['REDIS_PORT'] = '6380'
        os.environ['REDIS_DB'] = '1'
        os.environ['REDIS_PASSWORD'] = 'testpass'
        
        # Mock Redis client
        mock_client = MagicMock()
        mock_client.ping.return_value = True
        mock_redis.return_value = mock_client
        
        # Import after setting environment
        from config import create_redis_connection
        
        client, pool = create_redis_connection()
        
        # Verify connection pool was created with correct parameters
        mock_pool.assert_called_once()
        call_kwargs = mock_pool.call_args[1]
        self.assertEqual(call_kwargs['host'], 'testhost')
        self.assertEqual(call_kwargs['port'], 6380)
        self.assertEqual(call_kwargs['db'], 1)
        self.assertEqual(call_kwargs['password'], 'testpass')
        self.assertEqual(call_kwargs['max_connections'], 50)
        self.assertTrue(call_kwargs['socket_keepalive'])
    
    @patch('redis.Redis')
    def test_redis_connection_failure_fallback(self, mock_redis):
        """Test fallback to None when Redis connection fails."""
        # Mock connection failure
        mock_client = MagicMock()
        mock_client.ping.side_effect = Exception("Connection failed")
        mock_redis.return_value = mock_client
        
        # Import after mocking
        from config import create_redis_connection
        
        client, pool = create_redis_connection()
        
        # Verify fallback to None
        self.assertIsNone(client)
        self.assertIsNone(pool)
    
    def test_cache_config_with_redis(self):
        """Test cache configuration when Redis is available."""
        with patch('config.redis_client', MagicMock()):
            from config import get_cache_config
            
            config = get_cache_config()
            
            self.assertEqual(config['CACHE_TYPE'], 'redis')
            self.assertEqual(config['CACHE_KEY_PREFIX'], 'appnauan_')
            self.assertEqual(config['CACHE_DEFAULT_TIMEOUT'], 300)
            self.assertIn('CACHE_REDIS_URL', config)
    
    def test_cache_config_without_redis(self):
        """Test cache configuration fallback when Redis is unavailable."""
        with patch('config.redis_client', None):
            from config import get_cache_config
            
            config = get_cache_config()
            
            self.assertEqual(config['CACHE_TYPE'], 'simple')
            self.assertEqual(config['CACHE_DEFAULT_TIMEOUT'], 300)
            self.assertEqual(config['CACHE_THRESHOLD'], 500)
    
    def test_is_redis_available_when_connected(self):
        """Test is_redis_available returns True when Redis is connected."""
        mock_client = MagicMock()
        mock_client.ping.return_value = True
        
        with patch('config.redis_client', mock_client):
            from config import is_redis_available
            
            self.assertTrue(is_redis_available())
    
    def test_is_redis_available_when_disconnected(self):
        """Test is_redis_available returns False when Redis is disconnected."""
        with patch('config.redis_client', None):
            from config import is_redis_available
            
            self.assertFalse(is_redis_available())
    
    def test_is_redis_available_when_ping_fails(self):
        """Test is_redis_available returns False when ping fails."""
        mock_client = MagicMock()
        mock_client.ping.side_effect = Exception("Ping failed")
        
        with patch('config.redis_client', mock_client):
            from config import is_redis_available
            
            self.assertFalse(is_redis_available())


class TestCacheOperations(unittest.TestCase):
    """Test cache operations with Redis and fallback."""
    
    def test_cache_set_and_get_with_redis(self):
        """Test setting and getting cache values with Redis."""
        from flask import Flask
        from config import cache
        
        app = Flask(__name__)
        cache.init_app(app)
        
        with app.app_context():
            # Set cache value
            cache.set('test_key', 'test_value', timeout=60)
            
            # Get cache value
            value = cache.get('test_key')
            
            # Verify value is retrieved correctly
            self.assertEqual(value, 'test_value')
    
    def test_cache_delete(self):
        """Test deleting cache values."""
        from flask import Flask
        from config import cache
        
        app = Flask(__name__)
        cache.init_app(app)
        
        with app.app_context():
            # Set cache value
            cache.set('test_key', 'test_value', timeout=60)
            
            # Delete cache value
            cache.delete('test_key')
            
            # Verify value is deleted
            value = cache.get('test_key')
            self.assertIsNone(value)
    
    def test_cache_expiration(self):
        """Test cache value expiration."""
        import time
        from flask import Flask
        from config import cache
        
        app = Flask(__name__)
        cache.init_app(app)
        
        with app.app_context():
            # Set cache value with 1 second timeout
            cache.set('test_key', 'test_value', timeout=1)
            
            # Verify value exists
            value = cache.get('test_key')
            self.assertEqual(value, 'test_value')
            
            # Wait for expiration
            time.sleep(2)
            
            # Verify value is expired
            value = cache.get('test_key')
            self.assertIsNone(value)


class TestConnectionPooling(unittest.TestCase):
    """Test Redis connection pooling configuration."""
    
    @patch('redis.ConnectionPool')
    def test_connection_pool_parameters(self, mock_pool):
        """Test connection pool is created with correct parameters."""
        os.environ.pop('REDIS_URL', None)
        os.environ['REDIS_HOST'] = 'localhost'
        os.environ['REDIS_PORT'] = '6379'
        
        from config import create_redis_connection
        
        # Mock successful connection
        mock_client = MagicMock()
        mock_client.ping.return_value = True
        
        with patch('redis.Redis', return_value=mock_client):
            create_redis_connection()
        
        # Verify pool was created with correct parameters
        mock_pool.assert_called_once()
        call_kwargs = mock_pool.call_args[1]
        
        self.assertEqual(call_kwargs['max_connections'], 50)
        self.assertEqual(call_kwargs['socket_timeout'], 5)
        self.assertEqual(call_kwargs['socket_connect_timeout'], 5)
        self.assertTrue(call_kwargs['socket_keepalive'])
        self.assertEqual(call_kwargs['health_check_interval'], 30)


if __name__ == '__main__':
    unittest.main()
