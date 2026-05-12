"""
Integration tests for AI endpoint caching.

This test suite validates the caching behavior for all AI endpoints:
- scan-ingredients (1 hour TTL)
- suggest-recipes (30 minutes TTL)
- analyze-meal (24 hours TTL)

Tests verify:
1. Cache hit rate for repeated AI requests
2. Cached responses include "cached": true
3. Cache expiration after TTL

Validates: Requirements 2.4, 2.5
"""

import unittest
import json
import io
import hashlib
import time
from unittest.mock import patch, MagicMock, Mock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from config import cache


class TestAIEndpointCachingIntegration(unittest.TestCase):
    """Integration tests for AI endpoint caching behavior."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client."""
        cls.client = app.test_client()
        cls.client.testing = True
        cls.headers = {'Authorization': 'Bearer local-token:test@example.com'}
    
    def setUp(self):
        """Clear cache before each test."""
        try:
            cache.clear()
        except Exception:
            pass
    
    def tearDown(self):
        """Clean up after each test."""
        try:
            cache.clear()
        except Exception:
            pass
    
    # ========================================================================
    # Test 1: Cache hit rate for repeated AI requests
    # ========================================================================
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_scan_ingredients_cache_hit_rate(self, mock_genai):
        """Test cache hit rate for repeated scan-ingredients requests."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ingredients": ["tomato", "onion", "garlic"]}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Create test image
        image_data = b'test_image_data_for_scanning'
        image_file = (io.BytesIO(image_data), 'test.jpg')
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # First request - should be cache miss
            response1 = self.client.post(
                '/api/v1/ai/scan-ingredients',
                headers=self.headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
            
            self.assertEqual(response1.status_code, 200)
            data1 = json.loads(response1.data)
            self.assertTrue(data1['success'])
            self.assertFalse(data1['cached'], "First request should not be cached")
            
            # Make 9 more requests with the same image
            cache_hits = 0
            for i in range(9):
                image_file = (io.BytesIO(image_data), 'test.jpg')
                response = self.client.post(
                    '/api/v1/ai/scan-ingredients',
                    headers=self.headers,
                    data={'image': image_file},
                    content_type='multipart/form-data'
                )
                
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.data)
                if data.get('cached', False):
                    cache_hits += 1
            
            # Calculate cache hit rate (9 out of 9 subsequent requests should be cached)
            cache_hit_rate = cache_hits / 9
            self.assertGreaterEqual(cache_hit_rate, 0.9, 
                f"Cache hit rate {cache_hit_rate:.2%} should be at least 90%")
            
            # Verify AI was only called once
            self.assertEqual(mock_model.generate_content.call_count, 1,
                "AI should only be called once for identical images")
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_suggest_recipes_cache_hit_rate(self, mock_genai):
        """Test cache hit rate for repeated suggest-recipes requests."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            'recipes': [
                {
                    'title': 'Tomato Pasta',
                    'ingredients': ['tomato', 'pasta'],
                    'instructions': ['Cook pasta', 'Add sauce'],
                    'prep_time': '20 minutes',
                    'difficulty': 'easy',
                    'calories': 400,
                    'health_score': 70,
                    'health_benefits': ['Quick meal'],
                    'health_warnings': [],
                    'missing_ingredients': [],
                    'available_ingredients': ['tomato', 'pasta']
                }
            ]
        })
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Test data
        request_data = {
            'ingredients': ['tomato', 'pasta', 'garlic'],
            'health_profile': {'diet': 'vegetarian'},
            'pantry_context': ['salt', 'pepper']
        }
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # First request - should be cache miss
            response1 = self.client.post(
                '/api/v1/ai/suggest-recipes',
                headers=self.headers,
                json=request_data,
                content_type='application/json'
            )
            
            self.assertEqual(response1.status_code, 200)
            data1 = json.loads(response1.data)
            self.assertTrue(data1['success'])
            self.assertFalse(data1['cached'], "First request should not be cached")
            
            # Make 9 more requests with the same data
            cache_hits = 0
            for i in range(9):
                response = self.client.post(
                    '/api/v1/ai/suggest-recipes',
                    headers=self.headers,
                    json=request_data,
                    content_type='application/json'
                )
                
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.data)
                if data.get('cached', False):
                    cache_hits += 1
            
            # Calculate cache hit rate
            cache_hit_rate = cache_hits / 9
            self.assertGreaterEqual(cache_hit_rate, 0.9,
                f"Cache hit rate {cache_hit_rate:.2%} should be at least 90%")
            
            # Verify AI was only called once
            self.assertEqual(mock_model.generate_content.call_count, 1,
                "AI should only be called once for identical requests")
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_analyze_meal_cache_hit_rate(self, mock_genai):
        """Test cache hit rate for repeated analyze-meal requests."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "dish_name": "Phở Bò",
            "calories": 450,
            "protein": 25,
            "carbs": 60,
            "fat": 12,
            "ingredients": ["beef", "rice noodles", "herbs"],
            "health_advice": "Balanced meal",
            "health_score": 85
        })
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Create test image
        image_data = b'test_meal_image_data'
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # First request - should be cache miss
            image_file = (io.BytesIO(image_data), 'meal.jpg')
            response1 = self.client.post(
                '/api/v1/ai/analyze-meal',
                headers=self.headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
            
            self.assertEqual(response1.status_code, 200)
            data1 = json.loads(response1.data)
            self.assertTrue(data1['success'])
            self.assertFalse(data1['cached'], "First request should not be cached")
            
            # Make 9 more requests with the same image
            cache_hits = 0
            for i in range(9):
                image_file = (io.BytesIO(image_data), 'meal.jpg')
                response = self.client.post(
                    '/api/v1/ai/analyze-meal',
                    headers=self.headers,
                    data={'image': image_file},
                    content_type='multipart/form-data'
                )
                
                self.assertEqual(response.status_code, 200)
                data = json.loads(response.data)
                if data.get('cached', False):
                    cache_hits += 1
            
            # Calculate cache hit rate
            cache_hit_rate = cache_hits / 9
            self.assertGreaterEqual(cache_hit_rate, 0.9,
                f"Cache hit rate {cache_hit_rate:.2%} should be at least 90%")
            
            # Verify AI was only called once
            self.assertEqual(mock_model.generate_content.call_count, 1,
                "AI should only be called once for identical images")
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_overall_cache_hit_rate_across_endpoints(self, mock_genai):
        """Test overall cache hit rate across all AI endpoints meets 60% target."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ingredients": ["test"]}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        total_requests = 0
        cache_hits = 0
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # Test scan-ingredients with 3 different images, each requested twice
            for i in range(3):
                image_data = f'image_data_{i}'.encode()
                
                # First request (cache miss)
                image_file = (io.BytesIO(image_data), f'test{i}.jpg')
                response = self.client.post(
                    '/api/v1/ai/scan-ingredients',
                    headers=self.headers,
                    data={'image': image_file},
                    content_type='multipart/form-data'
                )
                total_requests += 1
                data = json.loads(response.data)
                if data.get('cached', False):
                    cache_hits += 1
                
                # Second request (cache hit)
                image_file = (io.BytesIO(image_data), f'test{i}.jpg')
                response = self.client.post(
                    '/api/v1/ai/scan-ingredients',
                    headers=self.headers,
                    data={'image': image_file},
                    content_type='multipart/form-data'
                )
                total_requests += 1
                data = json.loads(response.data)
                if data.get('cached', False):
                    cache_hits += 1
            
            # Calculate overall cache hit rate
            overall_hit_rate = cache_hits / total_requests
            self.assertGreaterEqual(overall_hit_rate, 0.6,
                f"Overall cache hit rate {overall_hit_rate:.2%} should be at least 60% (Requirement 2.5)")
    
    # ========================================================================
    # Test 2: Verify cached responses include "cached": true
    # ========================================================================
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_scan_ingredients_cached_field_true(self, mock_genai):
        """Test that cached scan-ingredients responses include 'cached': true."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ingredients": ["tomato"]}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        image_data = b'test_image_for_cached_field'
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # First request - cache miss
            image_file = (io.BytesIO(image_data), 'test.jpg')
            response1 = self.client.post(
                '/api/v1/ai/scan-ingredients',
                headers=self.headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
            
            data1 = json.loads(response1.data)
            self.assertIn('cached', data1, "Response should include 'cached' field")
            self.assertFalse(data1['cached'], "First request should have cached=false")
            
            # Second request - cache hit
            image_file = (io.BytesIO(image_data), 'test.jpg')
            response2 = self.client.post(
                '/api/v1/ai/scan-ingredients',
                headers=self.headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
            
            data2 = json.loads(response2.data)
            self.assertIn('cached', data2, "Response should include 'cached' field")
            self.assertTrue(data2['cached'], "Second request should have cached=true (Requirement 2.4)")
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_suggest_recipes_cached_field_true(self, mock_genai):
        """Test that cached suggest-recipes responses include 'cached': true."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"recipes": []}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        request_data = {
            'ingredients': ['tomato'],
            'health_profile': {},
            'pantry_context': []
        }
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # First request - cache miss
            response1 = self.client.post(
                '/api/v1/ai/suggest-recipes',
                headers=self.headers,
                json=request_data,
                content_type='application/json'
            )
            
            data1 = json.loads(response1.data)
            self.assertIn('cached', data1, "Response should include 'cached' field")
            self.assertFalse(data1['cached'], "First request should have cached=false")
            
            # Second request - cache hit
            response2 = self.client.post(
                '/api/v1/ai/suggest-recipes',
                headers=self.headers,
                json=request_data,
                content_type='application/json'
            )
            
            data2 = json.loads(response2.data)
            self.assertIn('cached', data2, "Response should include 'cached' field")
            self.assertTrue(data2['cached'], "Second request should have cached=true (Requirement 2.4)")
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_analyze_meal_cached_field_true(self, mock_genai):
        """Test that cached analyze-meal responses include 'cached': true."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"dish_name": "Test Dish", "calories": 100}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        image_data = b'test_meal_for_cached_field'
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # First request - cache miss
            image_file = (io.BytesIO(image_data), 'meal.jpg')
            response1 = self.client.post(
                '/api/v1/ai/analyze-meal',
                headers=self.headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
            
            data1 = json.loads(response1.data)
            self.assertIn('cached', data1, "Response should include 'cached' field")
            self.assertFalse(data1['cached'], "First request should have cached=false")
            
            # Second request - cache hit
            image_file = (io.BytesIO(image_data), 'meal.jpg')
            response2 = self.client.post(
                '/api/v1/ai/analyze-meal',
                headers=self.headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
            
            data2 = json.loads(response2.data)
            self.assertIn('cached', data2, "Response should include 'cached' field")
            self.assertTrue(data2['cached'], "Second request should have cached=true (Requirement 2.4)")
    
    # ========================================================================
    # Test 3: Cache expiration after TTL
    # ========================================================================
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    @patch('routes.ai_analysis.cache')
    def test_scan_ingredients_cache_expiration(self, mock_cache, mock_genai):
        """Test that scan-ingredients cache expires after 1 hour TTL."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ingredients": ["tomato"]}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Mock cache behavior
        cache_storage = {}
        
        def mock_get(key):
            return cache_storage.get(key)
        
        def mock_set(key, value, timeout=None):
            cache_storage[key] = value
            # Verify TTL is 3600 seconds (1 hour)
            self.assertEqual(timeout, 3600, 
                "scan-ingredients cache TTL should be 3600 seconds (1 hour)")
        
        mock_cache.get.side_effect = mock_get
        mock_cache.set.side_effect = mock_set
        
        image_data = b'test_image_for_ttl'
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # First request - should set cache with correct TTL
            image_file = (io.BytesIO(image_data), 'test.jpg')
            response = self.client.post(
                '/api/v1/ai/scan-ingredients',
                headers=self.headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
            
            self.assertEqual(response.status_code, 200)
            # Verify cache.set was called with timeout=3600
            mock_cache.set.assert_called()
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    @patch('routes.ai_analysis.cache')
    def test_suggest_recipes_cache_expiration(self, mock_cache, mock_genai):
        """Test that suggest-recipes cache expires after 30 minutes TTL."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"recipes": []}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Track cache.set calls
        cache_set_calls = []
        
        def mock_set(key, value, timeout=None):
            cache_set_calls.append({'key': key, 'value': value, 'timeout': timeout})
        
        mock_cache.get.return_value = None
        mock_cache.set.side_effect = mock_set
        
        request_data = {
            'ingredients': ['tomato'],
            'health_profile': {},
            'pantry_context': []
        }
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # Make request - should set cache with correct TTL
            response = self.client.post(
                '/api/v1/ai/suggest-recipes',
                headers=self.headers,
                json=request_data,
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200)
            
            # Verify cache.set was called with timeout=1800 (30 minutes)
            self.assertTrue(len(cache_set_calls) > 0, "cache.set should have been called")
            ttl_found = any(call['timeout'] == 1800 for call in cache_set_calls)
            self.assertTrue(ttl_found, 
                "suggest-recipes cache TTL should be 1800 seconds (30 minutes)")
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    @patch('routes.ai_analysis.cache')
    def test_analyze_meal_cache_expiration(self, mock_cache, mock_genai):
        """Test that analyze-meal cache expires after 24 hours TTL."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"dish_name": "Test", "calories": 100}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Track cache.set calls
        cache_set_calls = []
        
        def mock_set(key, value, timeout=None):
            cache_set_calls.append({'key': key, 'value': value, 'timeout': timeout})
        
        mock_cache.get.return_value = None
        mock_cache.set.side_effect = mock_set
        
        image_data = b'test_meal_for_ttl'
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # Make request - should set cache with correct TTL
            image_file = (io.BytesIO(image_data), 'meal.jpg')
            response = self.client.post(
                '/api/v1/ai/analyze-meal',
                headers=self.headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
            
            self.assertEqual(response.status_code, 200)
            
            # Verify cache.set was called with timeout=86400 (24 hours)
            self.assertTrue(len(cache_set_calls) > 0, "cache.set should have been called")
            ttl_found = any(call['timeout'] == 86400 for call in cache_set_calls)
            self.assertTrue(ttl_found,
                "analyze-meal cache TTL should be 86400 seconds (24 hours)")
    
    @patch('routes.ai_analysis.genai.GenerativeModel')
    def test_cache_expiration_behavior_with_real_cache(self, mock_genai):
        """Test cache expiration behavior with real cache (short TTL for testing)."""
        # Mock AI response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ingredients": ["tomato"]}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.return_value = mock_model
        
        # Manually set a cache entry with very short TTL
        image_data = b'test_image_for_expiration'
        image_hash = hashlib.md5(image_data).hexdigest()
        cache_key = f"scan_ingredients_{image_hash}"
        
        # Set cache with 1 second TTL
        test_result = {"ingredients": ["cached_tomato"]}
        cache.set(cache_key, test_result, timeout=1)
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # Immediate request should hit cache
            image_file = (io.BytesIO(image_data), 'test.jpg')
            response1 = self.client.post(
                '/api/v1/ai/scan-ingredients',
                headers=self.headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
            
            data1 = json.loads(response1.data)
            self.assertTrue(data1.get('cached', False), 
                "Immediate request should hit cache")
            self.assertEqual(data1['data']['ingredients'], ["cached_tomato"])
            
            # Wait for cache to expire
            time.sleep(2)
            
            # Request after expiration should miss cache
            image_file = (io.BytesIO(image_data), 'test.jpg')
            response2 = self.client.post(
                '/api/v1/ai/scan-ingredients',
                headers=self.headers,
                data={'image': image_file},
                content_type='multipart/form-data'
            )
            
            data2 = json.loads(response2.data)
            self.assertFalse(data2.get('cached', False),
                "Request after TTL expiration should miss cache")
            # Should get fresh data from AI
            self.assertEqual(data2['data']['ingredients'], ["tomato"])


if __name__ == '__main__':
    unittest.main()
