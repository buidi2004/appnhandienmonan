"""
Unit tests for cache decorator functionality.

This module tests the @cached_route decorator including:
- Cache key generation
- Cache hit/miss behavior
- Cached field in responses
- TTL configuration
- Cache condition functions
- Error handling and resilience
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, request
from utils.cache_decorator import (
    cached_route,
    cache_key_with_image_hash,
    should_not_cache_sensitive_data,
    _extract_response_data,
    _add_cached_field
)


class TestCacheDecorator(unittest.TestCase):
    """Test suite for cache decorator functionality."""
    
    def setUp(self):
        """Set up test Flask app and mock cache."""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        
        # Mock cache
        self.cache_data = {}
        self.cache_mock = Mock()
        self.cache_mock.get = Mock(side_effect=lambda key: self.cache_data.get(key))
        self.cache_mock.set = Mock(side_effect=lambda key, value, timeout: self.cache_data.update({key: value}))
    
    def tearDown(self):
        """Clean up after each test."""
        self.cache_data.clear()
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_cache_miss_executes_handler(self, mock_gen_key, mock_cache):
        """Test that cache miss executes the handler function."""
        mock_gen_key.return_value = "test_key_123"
        mock_cache.get.return_value = None
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=300)
            def test_handler():
                return jsonify({"success": True, "data": "test_data"})
            
            response = test_handler()
            response_data = json.loads(response.get_data(as_text=True))
            
            # Verify handler was executed
            self.assertTrue(response_data['success'])
            self.assertEqual(response_data['data'], 'test_data')
            self.assertFalse(response_data['cached'])
            
            # Verify cache was checked
            mock_cache.get.assert_called_once()
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_cache_hit_returns_cached_data(self, mock_gen_key, mock_cache):
        """Test that cache hit returns cached data without executing handler."""
        mock_gen_key.return_value = "test_key_123"
        cached_data = {"success": True, "data": "cached_data"}
        mock_cache.get.return_value = cached_data
        
        handler_executed = False
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=300)
            def test_handler():
                nonlocal handler_executed
                handler_executed = True
                return jsonify({"success": True, "data": "fresh_data"})
            
            response = test_handler()
            response_data = json.loads(response.get_data(as_text=True))
            
            # Verify cached data was returned
            self.assertTrue(response_data['success'])
            self.assertEqual(response_data['data'], 'cached_data')
            self.assertTrue(response_data['cached'])
            
            # Verify handler was NOT executed
            self.assertFalse(handler_executed)
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_cached_field_false_on_cache_miss(self, mock_gen_key, mock_cache):
        """Test that 'cached' field is False on cache miss."""
        mock_gen_key.return_value = "test_key_123"
        mock_cache.get.return_value = None
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=300)
            def test_handler():
                return jsonify({"success": True, "data": "test_data"})
            
            response = test_handler()
            response_data = json.loads(response.get_data(as_text=True))
            
            # Verify 'cached' field is False
            self.assertIn('cached', response_data)
            self.assertFalse(response_data['cached'])
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_cached_field_true_on_cache_hit(self, mock_gen_key, mock_cache):
        """Test that 'cached' field is True on cache hit."""
        mock_gen_key.return_value = "test_key_123"
        cached_data = {"success": True, "data": "cached_data"}
        mock_cache.get.return_value = cached_data
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=300)
            def test_handler():
                return jsonify({"success": True, "data": "fresh_data"})
            
            response = test_handler()
            response_data = json.loads(response.get_data(as_text=True))
            
            # Verify 'cached' field is True
            self.assertIn('cached', response_data)
            self.assertTrue(response_data['cached'])
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_cache_stores_result_with_ttl(self, mock_gen_key, mock_cache):
        """Test that cache stores result with correct TTL."""
        mock_gen_key.return_value = "test_key_123"
        mock_cache.get.return_value = None
        
        ttl = 600
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=ttl)
            def test_handler():
                return jsonify({"success": True, "data": "test_data"})
            
            response = test_handler()
            
            # Verify cache.set was called with correct TTL
            mock_cache.set.assert_called_once()
            call_args = mock_cache.set.call_args
            self.assertEqual(call_args[1]['timeout'], ttl)
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_key_prefix_added_to_cache_key(self, mock_gen_key, mock_cache):
        """Test that key_prefix is added to generated cache key."""
        mock_gen_key.return_value = "generated_key"
        mock_cache.get.return_value = None
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=300, key_prefix="test_prefix")
            def test_handler():
                return jsonify({"success": True, "data": "test_data"})
            
            response = test_handler()
            
            # Verify cache.get was called with prefixed key
            mock_cache.get.assert_called_once()
            call_args = mock_cache.get.call_args
            self.assertEqual(call_args[0][0], "test_prefix_generated_key")
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_cache_condition_prevents_caching(self, mock_gen_key, mock_cache):
        """Test that cache_condition can prevent caching."""
        mock_gen_key.return_value = "test_key_123"
        mock_cache.get.return_value = None
        
        # Cache condition that always returns False
        cache_condition = Mock(return_value=False)
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=300, cache_condition=cache_condition)
            def test_handler():
                return jsonify({"success": True, "data": "test_data"})
            
            response = test_handler()
            
            # Verify cache.set was NOT called
            mock_cache.set.assert_not_called()
            
            # Verify cache_condition was called
            cache_condition.assert_called_once()
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_cache_condition_allows_caching(self, mock_gen_key, mock_cache):
        """Test that cache_condition can allow caching."""
        mock_gen_key.return_value = "test_key_123"
        mock_cache.get.return_value = None
        
        # Cache condition that always returns True
        cache_condition = Mock(return_value=True)
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=300, cache_condition=cache_condition)
            def test_handler():
                return jsonify({"success": True, "data": "test_data"})
            
            response = test_handler()
            
            # Verify cache.set was called
            mock_cache.set.assert_called_once()
            
            # Verify cache_condition was called
            cache_condition.assert_called_once()
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_cache_read_failure_executes_handler(self, mock_gen_key, mock_cache):
        """Test that cache read failure executes handler gracefully."""
        mock_gen_key.return_value = "test_key_123"
        mock_cache.get.side_effect = Exception("Cache read error")
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=300)
            def test_handler():
                return jsonify({"success": True, "data": "test_data"})
            
            # Should not raise exception
            response = test_handler()
            response_data = json.loads(response.get_data(as_text=True))
            
            # Verify handler was executed
            self.assertTrue(response_data['success'])
            self.assertEqual(response_data['data'], 'test_data')
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_cache_write_failure_returns_result(self, mock_gen_key, mock_cache):
        """Test that cache write failure returns result gracefully."""
        mock_gen_key.return_value = "test_key_123"
        mock_cache.get.return_value = None
        mock_cache.set.side_effect = Exception("Cache write error")
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=300)
            def test_handler():
                return jsonify({"success": True, "data": "test_data"})
            
            # Should not raise exception
            response = test_handler()
            response_data = json.loads(response.get_data(as_text=True))
            
            # Verify handler result was returned
            self.assertTrue(response_data['success'])
            self.assertEqual(response_data['data'], 'test_data')
    
    @patch('utils.cache_decorator.cache')
    @patch('utils.cache_decorator.generate_cache_key_from_request')
    def test_include_user_id_in_cache_key(self, mock_gen_key, mock_cache):
        """Test that user_id is included in cache key when specified."""
        mock_gen_key.return_value = "test_key_123"
        mock_cache.get.return_value = None
        
        with self.app.test_request_context('/test'):
            @cached_route(ttl=300, include_user_id=True)
            def test_handler(user_id):
                return jsonify({"success": True, "user_id": user_id})
            
            response = test_handler(user_id="user_123")
            
            # Verify generate_cache_key_from_request was called with user_id
            mock_gen_key.assert_called_once()
            call_args = mock_gen_key.call_args
            self.assertEqual(call_args[1]['user_id'], 'user_123')


class TestCacheKeyWithImageHash(unittest.TestCase):
    """Test suite for image hash cache key generation."""
    
    def test_generates_consistent_hash(self):
        """Test that same image data generates same hash."""
        image_data = b"test_image_data"
        
        key1 = cache_key_with_image_hash(image_data)
        key2 = cache_key_with_image_hash(image_data)
        
        self.assertEqual(key1, key2)
    
    def test_different_images_different_hashes(self):
        """Test that different image data generates different hashes."""
        image_data1 = b"test_image_data_1"
        image_data2 = b"test_image_data_2"
        
        key1 = cache_key_with_image_hash(image_data1)
        key2 = cache_key_with_image_hash(image_data2)
        
        self.assertNotEqual(key1, key2)
    
    def test_prefix_added_to_hash(self):
        """Test that prefix is added to hash."""
        image_data = b"test_image_data"
        prefix = "scan_ingredients"
        
        key = cache_key_with_image_hash(image_data, prefix=prefix)
        
        self.assertTrue(key.startswith(prefix + "_"))


class TestShouldNotCacheSensitiveData(unittest.TestCase):
    """Test suite for sensitive data cache condition."""
    
    def test_allows_caching_normal_data(self):
        """Test that normal data is allowed to be cached."""
        response_data = {"success": True, "data": "normal_data"}
        
        result = should_not_cache_sensitive_data(response_data)
        
        self.assertTrue(result)
    
    def test_prevents_caching_token(self):
        """Test that responses with tokens are not cached."""
        response_data = {"success": True, "token": "secret_token"}
        
        result = should_not_cache_sensitive_data(response_data)
        
        self.assertFalse(result)
    
    def test_prevents_caching_password(self):
        """Test that responses with passwords are not cached."""
        response_data = {"success": True, "password": "secret_password"}
        
        result = should_not_cache_sensitive_data(response_data)
        
        self.assertFalse(result)
    
    def test_prevents_caching_api_key(self):
        """Test that responses with API keys are not cached."""
        response_data = {"success": True, "api_key": "secret_api_key"}
        
        result = should_not_cache_sensitive_data(response_data)
        
        self.assertFalse(result)
    
    def test_prevents_caching_nested_sensitive_data(self):
        """Test that nested sensitive data is detected."""
        response_data = {
            "success": True,
            "data": {
                "user": "john",
                "token": "secret_token"
            }
        }
        
        result = should_not_cache_sensitive_data(response_data)
        
        self.assertFalse(result)


class TestExtractResponseData(unittest.TestCase):
    """Test suite for response data extraction."""
    
    def test_extract_from_dict(self):
        """Test extracting data from dict response."""
        response = {"success": True, "data": "test"}
        
        result = _extract_response_data(response)
        
        self.assertEqual(result, response)
    
    def test_extract_from_tuple(self):
        """Test extracting data from tuple response."""
        response = ({"success": True, "data": "test"}, 200)
        
        result = _extract_response_data(response)
        
        self.assertEqual(result, {"success": True, "data": "test"})
    
    def test_extract_from_response_object(self):
        """Test extracting data from Flask Response object."""
        app = Flask(__name__)
        with app.test_request_context():
            response = jsonify({"success": True, "data": "test"})
            
            result = _extract_response_data(response)
            
            self.assertEqual(result['success'], True)
            self.assertEqual(result['data'], 'test')


class TestAddCachedField(unittest.TestCase):
    """Test suite for adding cached field to responses."""
    
    def test_adds_cached_true(self):
        """Test adding cached=True to response."""
        data = {"success": True, "data": "test"}
        
        result = _add_cached_field(data, cached=True)
        
        self.assertTrue(result['cached'])
        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'], 'test')
    
    def test_adds_cached_false(self):
        """Test adding cached=False to response."""
        data = {"success": True, "data": "test"}
        
        result = _add_cached_field(data, cached=False)
        
        self.assertFalse(result['cached'])
        self.assertEqual(result['success'], True)
        self.assertEqual(result['data'], 'test')
    
    def test_does_not_modify_original(self):
        """Test that original data is not modified."""
        data = {"success": True, "data": "test"}
        
        result = _add_cached_field(data, cached=True)
        
        # Original should not have 'cached' field
        self.assertNotIn('cached', data)
        # Result should have 'cached' field
        self.assertIn('cached', result)


if __name__ == '__main__':
    unittest.main()
