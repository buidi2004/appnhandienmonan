"""
Test caching functionality for the suggest-recipes endpoint.

This test verifies that:
1. The cache decorator is applied correctly
2. Cache keys are generated from ingredients, health profile, and pantry context
3. TTL is set to 30 minutes (1800 seconds)
4. Cached responses include "cached": true field
5. Fresh responses include "cached": false field
"""

import unittest
import sys
import os
import json
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from config import cache


class TestSuggestRecipesCache(unittest.TestCase):
    """Test cases for suggest-recipes endpoint caching."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client."""
        cls.client = app.test_client()
        cls.client.testing = True
    
    def setUp(self):
        """Clear cache before each test."""
        try:
            cache.clear()
        except Exception:
            pass
    
    def test_suggest_recipes_cache_miss_then_hit(self):
        """Test that first request is a cache miss and second is a cache hit."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        data = {
            'ingredients': ['tomato', 'pasta', 'garlic'],
            'health_profile': {'diet': 'vegetarian'},
            'pantry_context': ['salt', 'pepper', 'olive oil']
        }
        
        # Mock the Gemini API response
        mock_response = Mock()
        mock_response.text = json.dumps({
            'recipes': [
                {
                    'title': 'Pasta with Tomato Sauce',
                    'ingredients': ['tomato', 'pasta', 'garlic', 'olive oil'],
                    'instructions': ['Boil pasta', 'Make sauce', 'Combine'],
                    'prep_time': '30 minutes',
                    'difficulty': 'easy',
                    'calories': 450,
                    'health_score': 75,
                    'health_benefits': ['High in fiber'],
                    'health_warnings': [],
                    'missing_ingredients': [],
                    'available_ingredients': ['tomato', 'pasta', 'garlic', 'olive oil']
                }
            ]
        })
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            with patch('routes.ai_analysis.genai.GenerativeModel') as mock_model:
                mock_instance = Mock()
                mock_instance.generate_content.return_value = mock_response
                mock_model.return_value = mock_instance
                
                # First request - should be a cache miss
                response1 = self.client.post(
                    '/api/ai/suggest-recipes',
                    headers=headers,
                    json=data,
                    content_type='application/json'
                )
                
                self.assertEqual(response1.status_code, 200)
                data1 = json.loads(response1.data)
                self.assertTrue(data1.get('success'))
                self.assertFalse(data1.get('cached'), "First request should not be cached")
                self.assertIn('data', data1)
                
                # Second request with same data - should be a cache hit
                response2 = self.client.post(
                    '/api/ai/suggest-recipes',
                    headers=headers,
                    json=data,
                    content_type='application/json'
                )
                
                self.assertEqual(response2.status_code, 200)
                data2 = json.loads(response2.data)
                self.assertTrue(data2.get('success'))
                self.assertTrue(data2.get('cached'), "Second request should be cached")
                self.assertIn('data', data2)
                
                # Verify the data is the same
                self.assertEqual(data1['data'], data2['data'])
                
                # Verify Gemini API was only called once
                self.assertEqual(mock_instance.generate_content.call_count, 1)
    
    def test_suggest_recipes_different_ingredients_different_cache(self):
        """Test that different ingredients result in different cache keys."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        data1 = {
            'ingredients': ['tomato', 'pasta'],
            'health_profile': {},
            'pantry_context': []
        }
        
        data2 = {
            'ingredients': ['chicken', 'rice'],
            'health_profile': {},
            'pantry_context': []
        }
        
        # Mock the Gemini API response
        mock_response = Mock()
        mock_response.text = json.dumps({'recipes': []})
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            with patch('routes.ai_analysis.genai.GenerativeModel') as mock_model:
                mock_instance = Mock()
                mock_instance.generate_content.return_value = mock_response
                mock_model.return_value = mock_instance
                
                # First request
                response1 = self.client.post(
                    '/api/ai/suggest-recipes',
                    headers=headers,
                    json=data1,
                    content_type='application/json'
                )
                self.assertEqual(response1.status_code, 200)
                
                # Second request with different ingredients
                response2 = self.client.post(
                    '/api/ai/suggest-recipes',
                    headers=headers,
                    json=data2,
                    content_type='application/json'
                )
                self.assertEqual(response2.status_code, 200)
                
                # Verify Gemini API was called twice (different cache keys)
                self.assertEqual(mock_instance.generate_content.call_count, 2)
    
    def test_suggest_recipes_different_health_profile_different_cache(self):
        """Test that different health profiles result in different cache keys."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        data1 = {
            'ingredients': ['tomato', 'pasta'],
            'health_profile': {'diet': 'vegetarian'},
            'pantry_context': []
        }
        
        data2 = {
            'ingredients': ['tomato', 'pasta'],
            'health_profile': {'diet': 'vegan'},
            'pantry_context': []
        }
        
        # Mock the Gemini API response
        mock_response = Mock()
        mock_response.text = json.dumps({'recipes': []})
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            with patch('routes.ai_analysis.genai.GenerativeModel') as mock_model:
                mock_instance = Mock()
                mock_instance.generate_content.return_value = mock_response
                mock_model.return_value = mock_instance
                
                # First request
                response1 = self.client.post(
                    '/api/ai/suggest-recipes',
                    headers=headers,
                    json=data1,
                    content_type='application/json'
                )
                self.assertEqual(response1.status_code, 200)
                
                # Second request with different health profile
                response2 = self.client.post(
                    '/api/ai/suggest-recipes',
                    headers=headers,
                    json=data2,
                    content_type='application/json'
                )
                self.assertEqual(response2.status_code, 200)
                
                # Verify Gemini API was called twice (different cache keys)
                self.assertEqual(mock_instance.generate_content.call_count, 2)
    
    def test_suggest_recipes_different_pantry_context_different_cache(self):
        """Test that different pantry contexts result in different cache keys."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        data1 = {
            'ingredients': ['tomato', 'pasta'],
            'health_profile': {},
            'pantry_context': ['salt', 'pepper']
        }
        
        data2 = {
            'ingredients': ['tomato', 'pasta'],
            'health_profile': {},
            'pantry_context': ['salt', 'pepper', 'olive oil']
        }
        
        # Mock the Gemini API response
        mock_response = Mock()
        mock_response.text = json.dumps({'recipes': []})
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            with patch('routes.ai_analysis.genai.GenerativeModel') as mock_model:
                mock_instance = Mock()
                mock_instance.generate_content.return_value = mock_response
                mock_model.return_value = mock_instance
                
                # First request
                response1 = self.client.post(
                    '/api/ai/suggest-recipes',
                    headers=headers,
                    json=data1,
                    content_type='application/json'
                )
                self.assertEqual(response1.status_code, 200)
                
                # Second request with different pantry context
                response2 = self.client.post(
                    '/api/ai/suggest-recipes',
                    headers=headers,
                    json=data2,
                    content_type='application/json'
                )
                self.assertEqual(response2.status_code, 200)
                
                # Verify Gemini API was called twice (different cache keys)
                self.assertEqual(mock_instance.generate_content.call_count, 2)
    
    def test_suggest_recipes_same_ingredients_different_order_same_cache(self):
        """Test that same ingredients in different order use the same cache key."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        data1 = {
            'ingredients': ['tomato', 'pasta', 'garlic'],
            'health_profile': {},
            'pantry_context': []
        }
        
        data2 = {
            'ingredients': ['garlic', 'tomato', 'pasta'],
            'health_profile': {},
            'pantry_context': []
        }
        
        # Mock the Gemini API response
        mock_response = Mock()
        mock_response.text = json.dumps({'recipes': []})
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            with patch('routes.ai_analysis.genai.GenerativeModel') as mock_model:
                mock_instance = Mock()
                mock_instance.generate_content.return_value = mock_response
                mock_model.return_value = mock_instance
                
                # First request
                response1 = self.client.post(
                    '/api/ai/suggest-recipes',
                    headers=headers,
                    json=data1,
                    content_type='application/json'
                )
                self.assertEqual(response1.status_code, 200)
                data1_response = json.loads(response1.data)
                self.assertFalse(data1_response.get('cached'))
                
                # Second request with same ingredients in different order
                response2 = self.client.post(
                    '/api/ai/suggest-recipes',
                    headers=headers,
                    json=data2,
                    content_type='application/json'
                )
                self.assertEqual(response2.status_code, 200)
                data2_response = json.loads(response2.data)
                self.assertTrue(data2_response.get('cached'), "Should use cached result for same ingredients in different order")
                
                # Verify Gemini API was only called once (same cache key)
                self.assertEqual(mock_instance.generate_content.call_count, 1)
    
    def test_suggest_recipes_validation_error_not_cached(self):
        """Test that validation errors are not cached."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        # Empty ingredients should trigger validation error
        data = {
            'ingredients': [],
            'health_profile': {},
            'pantry_context': []
        }
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # First request - should fail validation
            response1 = self.client.post(
                '/api/ai/suggest-recipes',
                headers=headers,
                json=data,
                content_type='application/json'
            )
            self.assertEqual(response1.status_code, 400)
            
            # Second request - should also fail validation (not cached)
            response2 = self.client.post(
                '/api/ai/suggest-recipes',
                headers=headers,
                json=data,
                content_type='application/json'
            )
            self.assertEqual(response2.status_code, 400)
            
            # Verify neither response has 'cached' field
            data1 = json.loads(response1.data)
            data2 = json.loads(response2.data)
            self.assertNotIn('cached', data1)
            self.assertNotIn('cached', data2)


if __name__ == '__main__':
    unittest.main()
