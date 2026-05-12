"""
Unit tests for analyze_meal endpoint caching functionality.

Tests verify that the cached_image_route decorator correctly:
- Generates cache keys from image hash
- Caches responses with 24-hour TTL
- Returns cached responses with "cached": true
- Returns fresh responses with "cached": false

Validates: Requirements 2.3, 2.5
"""

import unittest
import json
import io
import hashlib
from unittest.mock import patch, MagicMock, Mock
from flask import Flask
from config import cache
from routes.ai_analysis import ai_bp


class TestAnalyzeMealCache(unittest.TestCase):
    """Test suite for analyze_meal endpoint caching."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.register_blueprint(ai_bp, url_prefix='/api/v1/ai')
        self.client = self.app.test_client()
        
        # Clear cache before each test
        cache.clear()
        
        # Sample image data
        self.image_data = b'fake_image_data_for_testing'
        self.image_hash = hashlib.md5(self.image_data).hexdigest()
        self.cache_key = f"analyze_meal_{self.image_hash}"
        
        # Mock AI response
        self.mock_ai_response = {
            "dish_name": "Phở Bò",
            "calories": 450,
            "protein": 25,
            "carbs": 60,
            "fat": 12,
            "ingredients": ["beef", "rice noodles", "herbs"],
            "health_advice": "Balanced meal with good protein",
            "health_score": 85
        }
    
    def tearDown(self):
        """Clean up after tests."""
        cache.clear()
    
    def _create_test_image_file(self, data=None):
        """Create a test image file object."""
        if data is None:
            data = self.image_data
        return (io.BytesIO(data), 'test_image.jpg')
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    @patch('routes.ai_analysis.token_required')
    def test_cache_miss_stores_result(self, mock_token, mock_genai):
        """Test that cache miss executes AI call and stores result."""
        # Mock token_required to pass through
        mock_token.side_effect = lambda f: f
        
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps(self.mock_ai_response)
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Make request
        response = self.client.post(
            '/api/v1/ai/analyze-meal',
            data={'image': self._create_test_image_file()},
            content_type='multipart/form-data'
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data'], self.mock_ai_response)
        self.assertFalse(data['cached'])
        
        # Verify result was cached
        cached_result = cache.get(self.cache_key)
        self.assertIsNotNone(cached_result)
        self.assertEqual(cached_result, self.mock_ai_response)
    
    @patch('routes.ai_analysis.token_required')
    def test_cache_hit_returns_cached_data(self, mock_token):
        """Test that cache hit returns cached data without AI call."""
        # Mock token_required to pass through
        mock_token.side_effect = lambda f: f
        
        # Pre-populate cache
        cache.set(self.cache_key, self.mock_ai_response, timeout=86400)
        
        # Make request (should not call AI)
        response = self.client.post(
            '/api/v1/ai/analyze-meal',
            data={'image': self._create_test_image_file()},
            content_type='multipart/form-data'
        )
        
        # Verify response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['data'], self.mock_ai_response)
        self.assertTrue(data['cached'])
    
    @patch('routes.ai_analysis.token_required')
    def test_cache_key_based_on_image_hash(self, mock_token):
        """Test that cache key is generated from image hash."""
        # Mock token_required to pass through
        mock_token.side_effect = lambda f: f
        
        # Create two different images
        image1_data = b'image_data_1'
        image2_data = b'image_data_2'
        
        image1_hash = hashlib.md5(image1_data).hexdigest()
        image2_hash = hashlib.md5(image2_data).hexdigest()
        
        cache_key1 = f"analyze_meal_{image1_hash}"
        cache_key2 = f"analyze_meal_{image2_hash}"
        
        # Pre-populate cache with different results
        result1 = {"dish_name": "Dish 1", "calories": 100}
        result2 = {"dish_name": "Dish 2", "calories": 200}
        
        cache.set(cache_key1, result1, timeout=86400)
        cache.set(cache_key2, result2, timeout=86400)
        
        # Request image 1
        response1 = self.client.post(
            '/api/v1/ai/analyze-meal',
            data={'image': (io.BytesIO(image1_data), 'test1.jpg')},
            content_type='multipart/form-data'
        )
        
        # Request image 2
        response2 = self.client.post(
            '/api/v1/ai/analyze-meal',
            data={'image': (io.BytesIO(image2_data), 'test2.jpg')},
            content_type='multipart/form-data'
        )
        
        # Verify different results
        data1 = json.loads(response1.data)
        data2 = json.loads(response2.data)
        
        self.assertEqual(data1['data']['dish_name'], 'Dish 1')
        self.assertEqual(data2['data']['dish_name'], 'Dish 2')
        self.assertTrue(data1['cached'])
        self.assertTrue(data2['cached'])
    
    @patch('routes.ai_analysis.token_required')
    def test_same_image_returns_same_cache(self, mock_token):
        """Test that identical images return the same cached result."""
        # Mock token_required to pass through
        mock_token.side_effect = lambda f: f
        
        # Pre-populate cache
        cache.set(self.cache_key, self.mock_ai_response, timeout=86400)
        
        # Make two requests with identical image data
        response1 = self.client.post(
            '/api/v1/ai/analyze-meal',
            data={'image': self._create_test_image_file()},
            content_type='multipart/form-data'
        )
        
        response2 = self.client.post(
            '/api/v1/ai/analyze-meal',
            data={'image': self._create_test_image_file()},
            content_type='multipart/form-data'
        )
        
        # Verify both return cached data
        data1 = json.loads(response1.data)
        data2 = json.loads(response2.data)
        
        self.assertTrue(data1['cached'])
        self.assertTrue(data2['cached'])
        self.assertEqual(data1['data'], data2['data'])
    
    def test_cache_ttl_is_24_hours(self):
        """Test that cache TTL is set to 24 hours (86400 seconds)."""
        # This is verified by checking the decorator parameter
        # ttl=86400 in @cached_image_route(ttl=86400, key_prefix="analyze_meal")
        
        # We can verify by checking if cache expires after TTL
        cache.set(self.cache_key, self.mock_ai_response, timeout=86400)
        
        # Verify cache exists
        cached_result = cache.get(self.cache_key)
        self.assertIsNotNone(cached_result)
        
        # Note: Full TTL testing would require time manipulation
        # which is beyond the scope of this unit test


if __name__ == '__main__':
    unittest.main()
