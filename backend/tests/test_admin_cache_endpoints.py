"""
Integration tests for admin cache statistics endpoints.

Tests the /api/v1/admin/cache/stats endpoint functionality.
"""

import pytest
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import before creating app to avoid blueprint registration issues
from utils.cache_utils import reset_cache_statistics, record_cache_hit, record_cache_miss
import json

# Create a minimal test app
from flask import Flask
from routes.admin import admin_bp
from config import cache

def create_test_app():
    """Create a minimal Flask app for testing."""
    test_app = Flask(__name__)
    test_app.config['TESTING'] = True
    
    # Initialize cache for testing
    cache.init_app(test_app)
    
    test_app.register_blueprint(admin_bp, url_prefix='/api/v1/admin')
    return test_app


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app = create_test_app()
    with app.test_client() as client:
        yield client


@pytest.fixture(autouse=True)
def reset_stats():
    """Reset cache statistics before each test."""
    reset_cache_statistics()
    yield
    reset_cache_statistics()


class TestCacheStatsEndpoint:
    """Test suite for /api/v1/admin/cache/stats endpoint."""
    
    def test_get_cache_stats_initial_state(self, client):
        """Test getting cache stats with no recorded data."""
        response = client.get('/api/v1/admin/cache/stats')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['success'] is True
        assert 'data' in data
        assert 'global' in data['data']
        assert data['data']['global']['hits'] == 0
        assert data['data']['global']['misses'] == 0
        assert data['data']['global']['total_requests'] == 0
        assert data['data']['global']['hit_rate'] == 0.0
        assert data['data']['endpoints'] == {}
    
    def test_get_cache_stats_with_recorded_data(self, client):
        """Test getting cache stats after recording hits and misses."""
        # Record some cache hits and misses
        record_cache_hit()
        record_cache_hit()
        record_cache_hit()
        record_cache_miss()
        
        response = client.get('/api/v1/admin/cache/stats')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['success'] is True
        assert data['data']['global']['hits'] == 3
        assert data['data']['global']['misses'] == 1
        assert data['data']['global']['total_requests'] == 4
        assert data['data']['global']['hit_rate'] == 75.0
    
    def test_get_cache_stats_with_endpoint_data(self, client):
        """Test getting cache stats with endpoint-specific data."""
        endpoint1 = '/api/v1/recipes/search'
        endpoint2 = '/api/v1/ai/suggest-recipes'
        
        # Record data for endpoint1
        record_cache_hit(endpoint1)
        record_cache_hit(endpoint1)
        record_cache_miss(endpoint1)
        
        # Record data for endpoint2
        record_cache_hit(endpoint2)
        record_cache_miss(endpoint2)
        record_cache_miss(endpoint2)
        
        response = client.get('/api/v1/admin/cache/stats')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['success'] is True
        
        # Check global stats
        assert data['data']['global']['hits'] == 3
        assert data['data']['global']['misses'] == 3
        assert data['data']['global']['hit_rate'] == 50.0
        
        # Check endpoint1 stats
        assert endpoint1 in data['data']['endpoints']
        assert data['data']['endpoints'][endpoint1]['hits'] == 2
        assert data['data']['endpoints'][endpoint1]['misses'] == 1
        assert data['data']['endpoints'][endpoint1]['hit_rate'] == 66.67
        
        # Check endpoint2 stats
        assert endpoint2 in data['data']['endpoints']
        assert data['data']['endpoints'][endpoint2]['hits'] == 1
        assert data['data']['endpoints'][endpoint2]['misses'] == 2
        assert data['data']['endpoints'][endpoint2]['hit_rate'] == 33.33
    
    def test_get_cache_stats_for_specific_endpoint(self, client):
        """Test getting cache stats for a specific endpoint using query parameter."""
        endpoint = '/api/v1/recipes/search'
        
        # Record data for the endpoint
        record_cache_hit(endpoint)
        record_cache_hit(endpoint)
        record_cache_miss(endpoint)
        
        # Also record data for another endpoint (should not be included)
        record_cache_hit('/api/v1/ai/suggest-recipes')
        
        response = client.get(f'/api/v1/admin/cache/stats?endpoint={endpoint}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['success'] is True
        assert 'endpoint' in data['data']
        assert data['data']['endpoint'] == endpoint
        assert data['data']['hits'] == 2
        assert data['data']['misses'] == 1
        assert data['data']['total_requests'] == 3
        assert data['data']['hit_rate'] == 66.67
    
    def test_get_cache_stats_for_nonexistent_endpoint(self, client):
        """Test getting cache stats for an endpoint with no data."""
        endpoint = '/api/v1/nonexistent'
        
        response = client.get(f'/api/v1/admin/cache/stats?endpoint={endpoint}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['success'] is True
        assert data['data']['endpoint'] == endpoint
        assert data['data']['hits'] == 0
        assert data['data']['misses'] == 0
        assert data['data']['total_requests'] == 0
        assert data['data']['hit_rate'] == 0.0
    
    def test_cache_stats_includes_redis_availability(self, client):
        """Test that cache stats response includes Redis availability status."""
        response = client.get('/api/v1/admin/cache/stats')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'redis_available' in data
        assert isinstance(data['redis_available'], bool)
    
    def test_backward_compatibility_route(self, client):
        """Test that /api/admin/cache/stats also works (backward compatibility)."""
        # Note: This test is skipped because we're using a minimal test app
        # In the full app, backward compatibility routes are registered
        pytest.skip("Backward compatibility test requires full app setup")


class TestCacheClearEndpoint:
    """Test suite for /api/v1/admin/cache/clear endpoint."""
    
    def test_clear_all_cache(self, client):
        """Test clearing all cache."""
        response = client.post(
            '/api/v1/admin/cache/clear',
            data=json.dumps({'all': True}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['success'] is True
        assert 'message' in data
        assert 'cleared' in data['message'].lower()
    
    def test_clear_specific_key(self, client):
        """Test clearing a specific cache key."""
        cache_key = 'test_cache_key_123'
        
        response = client.post(
            '/api/v1/admin/cache/clear',
            data=json.dumps({'key': cache_key}),
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['success'] is True
        assert cache_key in data['message']
    
    def test_clear_cache_invalid_request(self, client):
        """Test clearing cache with invalid request (no parameters)."""
        response = client.post(
            '/api/v1/admin/cache/clear',
            data=json.dumps({}),
            content_type='application/json'
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        
        assert data['success'] is False
        assert 'error' in data


class TestCacheStatsResetEndpoint:
    """Test suite for /api/v1/admin/cache/stats/reset endpoint."""
    
    def test_reset_cache_statistics(self, client):
        """Test resetting cache statistics."""
        # Record some data
        record_cache_hit()
        record_cache_miss()
        
        # Verify data exists
        response = client.get('/api/v1/admin/cache/stats')
        data = json.loads(response.data)
        assert data['data']['global']['total_requests'] == 2
        
        # Reset statistics
        response = client.post('/api/v1/admin/cache/stats/reset')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['success'] is True
        
        # Verify statistics are reset
        response = client.get('/api/v1/admin/cache/stats')
        data = json.loads(response.data)
        assert data['data']['global']['total_requests'] == 0
        assert data['data']['global']['hits'] == 0
        assert data['data']['global']['misses'] == 0
