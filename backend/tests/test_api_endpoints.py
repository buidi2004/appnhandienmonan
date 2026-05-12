"""
API Endpoint Tests
Test all backend API endpoints for functionality, security, and error handling.
"""

import unittest
import sys
import os
import json
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from config import db


class TestAPIEndpoints(unittest.TestCase):
    """Test cases for API endpoints."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client."""
        cls.client = app.test_client()
        cls.client.testing = True
    
    def test_health_check(self):
        """Test health check endpoint."""
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
    
    def test_index_endpoint(self):
        """Test index endpoint."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertEqual(data['status'], 'online')
    
    def test_404_handler(self):
        """Test 404 error handler."""
        response = self.client.get('/nonexistent-endpoint')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('error', data)
    
    def test_missing_auth_header(self):
        """Test endpoints without auth header."""
        endpoints = [
            '/api/pantry/',
            '/api/community/feed',
            '/api/user/gamification',
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, 401, f"Failed for {endpoint}")
            data = json.loads(response.data)
            self.assertFalse(data.get('success', True))
    
    def test_invalid_auth_token(self):
        """Test endpoints with invalid auth token."""
        headers = {'Authorization': 'Bearer invalid_token_12345'}
        response = self.client.get('/api/pantry/', headers=headers)
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertFalse(data.get('success', True))
    
    def test_pantry_update_no_data(self):
        """Test pantry update without data."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        # Set environment to development for local token
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/pantry/update',
                headers=headers,
                json=None
            )
            self.assertEqual(response.status_code, 400)
            data = json.loads(response.data)
            self.assertFalse(data.get('success', True))
    
    def test_pantry_update_invalid_data(self):
        """Test pantry update with invalid data."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        invalid_data = {
            'name': '',  # Empty name
            'quantity': -5,  # Negative quantity
            'unit': 'invalid_unit'
        }
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/pantry/update',
                headers=headers,
                json=invalid_data,
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 400)
            data = json.loads(response.data)
            self.assertFalse(data.get('success', True))
    
    def test_community_post_no_data(self):
        """Test community post without data."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/community/post',
                headers=headers,
                json=None
            )
            self.assertEqual(response.status_code, 400)
    
    def test_community_post_invalid_data(self):
        """Test community post with invalid data."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        invalid_data = {
            'dish_name': '',  # Empty dish name
            'calories': -100  # Negative calories
        }
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/community/post',
                headers=headers,
                json=invalid_data,
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 400)
    
    def test_ai_scan_no_image(self):
        """Test AI scan without image."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/ai/scan-ingredients',
                headers=headers
            )
            self.assertEqual(response.status_code, 400)
            data = json.loads(response.data)
            self.assertFalse(data.get('success', True))
    
    def test_ai_suggest_no_data(self):
        """Test AI suggest without data."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/ai/suggest-recipes',
                headers=headers,
                json=None
            )
            self.assertEqual(response.status_code, 400)
    
    def test_ai_suggest_empty_ingredients(self):
        """Test AI suggest with empty ingredients."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        data = {'ingredients': []}
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/ai/suggest-recipes',
                headers=headers,
                json=data,
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 400)
    
    def test_local_token_in_production(self):
        """Test that local tokens are rejected in production."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        
        # Set environment to production
        with patch.dict(os.environ, {'FLASK_ENV': 'production'}):
            response = self.client.get('/api/pantry/', headers=headers)
            self.assertEqual(response.status_code, 401)
            data = json.loads(response.data)
            self.assertFalse(data.get('success', True))
    
    def test_local_token_invalid_email(self):
        """Test local token with invalid email format."""
        headers = {'Authorization': 'Bearer local-token:invalid-email'}
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.get('/api/pantry/', headers=headers)
            self.assertEqual(response.status_code, 401)
    
    def test_response_format_consistency(self):
        """Test that error responses follow consistent format."""
        # Test various error scenarios
        test_cases = [
            ('/api/pantry/', 'GET', None, None),
            ('/api/community/feed', 'GET', None, None),
            ('/nonexistent', 'GET', None, None),
        ]
        
        for endpoint, method, headers, data in test_cases:
            if method == 'GET':
                response = self.client.get(endpoint, headers=headers)
            else:
                response = self.client.post(endpoint, headers=headers, json=data)
            
            # All error responses should be JSON
            self.assertEqual(response.content_type, 'application/json')
            
            # Parse response
            response_data = json.loads(response.data)
            
            # Should have either 'success' or 'error' key
            self.assertTrue(
                'success' in response_data or 'error' in response_data,
                f"Response missing success/error key for {endpoint}"
            )


class TestSecurityFeatures(unittest.TestCase):
    """Test security features."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client."""
        cls.client = app.test_client()
        cls.client.testing = True
    
    def test_sql_injection_attempt(self):
        """Test SQL injection protection."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        malicious_data = {
            'name': "'; DROP TABLE pantry; --",
            'quantity': 1,
            'unit': 'kg'
        }
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/pantry/update',
                headers=headers,
                json=malicious_data,
                content_type='application/json'
            )
            # Should either validate and reject, or sanitize
            # Either way, should not crash
            self.assertIn(response.status_code, [200, 201, 400])
    
    def test_xss_attempt(self):
        """Test XSS protection."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        malicious_data = {
            'dish_name': '<script>alert("XSS")</script>',
            'description': '<img src=x onerror=alert("XSS")>',
            'calories': 100
        }
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            # Mock the database to avoid user not found error
            with patch('routes.community.db') as mock_db:
                mock_user_ref = Mock()
                mock_user_ref.exists = False
                mock_user_ref.to_dict.return_value = {}
                mock_db.collection.return_value.document.return_value.get.return_value = mock_user_ref
                mock_db.collection.return_value.add.return_value = (None, Mock(id='test_id'))
                mock_db.collection.return_value.document.return_value.update.return_value = None
                
                response = self.client.post(
                    '/api/community/post',
                    headers=headers,
                    json=malicious_data,
                    content_type='application/json'
                )
                # Should sanitize or reject, or succeed with sanitized data
                self.assertIn(response.status_code, [200, 201, 400])
    
    def test_oversized_input(self):
        """Test handling of oversized input."""
        headers = {'Authorization': 'Bearer local-token:test@example.com'}
        oversized_data = {
            'name': 'A' * 10000,  # Very long name
            'quantity': 1,
            'unit': 'kg'
        }
        
        with patch.dict(os.environ, {'FLASK_ENV': 'development'}):
            response = self.client.post(
                '/api/pantry/update',
                headers=headers,
                json=oversized_data,
                content_type='application/json'
            )
            # Should reject oversized input
            self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()
