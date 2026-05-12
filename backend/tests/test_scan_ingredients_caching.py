"""
Unit tests for scan_ingredients endpoint caching.
Tests that the endpoint uses cache_key_with_image_hash utility and proper TTL.
"""

import unittest
import sys
import os
import hashlib
from unittest.mock import Mock, patch, MagicMock
from io import BytesIO

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestScanIngredientsCaching(unittest.TestCase):
    """Test cases for scan_ingredients endpoint caching."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Import here to avoid module loading issues
        from app import app
        self.client = app.test_client()
        self.client.testing = True
        
        # Test image data
        self.test_image_data = b"fake_image_data_for_testing"
        self.image_hash = hashlib.md5(self.test_image_data).hexdigest()
        self.expected_cache_key = f"scan_ingredients_{self.image_hash}"
    
    @patch('routes.ai_analysis.cache')
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_cache_key_generation_from_image_hash(self, mock_genai, mock_cache):
        """Test that cache key is generated from image hash using utility function."""
        # Mock cache to return None (cache miss)
        mock_cache.get.return_value = None
        
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ingredients": ["tomato", "onion"]}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Create test image file
        image_file = (BytesIO(self.test_image_data), 'test.jpg')
        
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/v1/ai/scan-ingredients',
                headers=headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
        
        # Verify cache.get was called with correct key
        mock_cache.get.assert_called()
        cache_key_used = mock_cache.get.call_args[0][0]
        self.assertEqual(cache_key_used, self.expected_cache_key)
    
    @patch('routes.ai_analysis.cache')
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_cache_set_with_correct_ttl(self, mock_genai, mock_cache):
        """Test that cache is set with 1 hour (3600 seconds) TTL."""
        # Mock cache to return None (cache miss)
        mock_cache.get.return_value = None
        
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ingredients": ["tomato", "onion"]}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Create test image file
        image_file = (BytesIO(self.test_image_data), 'test.jpg')
        
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/v1/ai/scan-ingredients',
                headers=headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
        
        # Verify cache.set was called with correct TTL
        mock_cache.set.assert_called()
        call_args = mock_cache.set.call_args
        
        # Check that timeout parameter is 3600 (1 hour)
        self.assertEqual(call_args[1]['timeout'], 3600)
    
    @patch('routes.ai_analysis.cache')
    def test_cache_hit_returns_cached_data(self, mock_cache):
        """Test that cache hit returns cached data with cached=true."""
        # Mock cache to return cached data
        cached_data = {"ingredients": ["cached_tomato", "cached_onion"]}
        mock_cache.get.return_value = cached_data
        
        # Create test image file
        image_file = (BytesIO(self.test_image_data), 'test.jpg')
        
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/v1/ai/scan-ingredients',
                headers=headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data'], cached_data)
        self.assertTrue(data['cached'])
    
    @patch('routes.ai_analysis.cache')
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_cache_miss_returns_fresh_data(self, mock_genai, mock_cache):
        """Test that cache miss returns fresh data with cached=false."""
        # Mock cache to return None (cache miss)
        mock_cache.get.return_value = None
        
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ingredients": ["fresh_tomato", "fresh_onion"]}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Create test image file
        image_file = (BytesIO(self.test_image_data), 'test.jpg')
        
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/v1/ai/scan-ingredients',
                headers=headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertFalse(data['cached'])
        self.assertEqual(data['data']['ingredients'], ["fresh_tomato", "fresh_onion"])


if __name__ == '__main__':
    unittest.main()
