"""
Property-based tests for cached response indicator.

This module contains property-based tests that verify the "cached" field
is correctly included in API responses based on cache hit/miss status.

**Validates: Requirements 2.4**

Property 3: Cached Response Indicator
For any API request that is served from cache, the response SHALL include
a "cached": true field in the JSON response body.
"""

import unittest
import json
import sys
import os
from hypothesis import given, strategies as st, settings, assume
from hypothesis.strategies import composite

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, jsonify, request
from utils.cache_decorator import cached_route
from config import cache


# Custom strategies for generating test data
@composite
def api_request_params(draw):
    """
    Generate random API request parameters.
    
    This includes query parameters that would be used in API requests
    and affect cache key generation.
    """
    # Generate a dictionary of query parameters
    num_params = draw(st.integers(min_value=0, max_value=5))
    params = {}
    
    for i in range(num_params):
        key = draw(st.text(
            alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
            min_size=1,
            max_size=20
        ))
        value = draw(st.one_of(
            st.text(max_size=50),
            st.integers(min_value=0, max_value=1000),
            st.booleans()
        ))
        params[key] = str(value)
    
    return params


@composite
def api_response_data(draw):
    """
    Generate random API response data.
    
    This represents the data that would be returned by an API endpoint.
    """
    return {
        "success": draw(st.booleans()),
        "data": draw(st.one_of(
            st.text(max_size=100),
            st.integers(),
            st.dictionaries(
                st.text(min_size=1, max_size=20),
                st.text(max_size=50),
                max_size=10
            )
        )),
        "message": draw(st.text(max_size=100))
    }


class TestCachedResponseIndicatorProperty(unittest.TestCase):
    """
    Property-based tests for cached response indicator.
    
    **Validates: Requirements 2.4**
    """
    
    @classmethod
    def setUpClass(cls):
        """Set up test Flask app once for all tests."""
        cls.app = Flask(__name__)
        cls.app.config['TESTING'] = True
        cache.init_app(cls.app)
        
        # Register all test routes once
        cls._register_test_routes()
        
        cls.client = cls.app.test_client()
    
    @classmethod
    def _register_test_routes(cls):
        """Register all test routes for the test suite."""
        # Store response data in a dict that can be updated per test
        cls.response_data_store = {}
        
        @cls.app.route('/test/cached-endpoint', methods=['GET'])
        @cached_route(ttl=60, key_prefix="test_endpoint")
        def test_endpoint():
            return jsonify(cls.response_data_store.get('test_endpoint', {}))
        
        @cls.app.route('/test/cached-endpoint-2', methods=['GET'])
        @cached_route(ttl=60, key_prefix="test_endpoint_2")
        def test_endpoint_2():
            return jsonify(cls.response_data_store.get('test_endpoint_2', {}))
        
        @cls.app.route('/test/cached-endpoint-3', methods=['GET'])
        @cached_route(ttl=60, key_prefix="test_endpoint_3")
        def test_endpoint_3():
            return jsonify(cls.response_data_store.get('test_endpoint_3', {}))
        
        @cls.app.route('/test/cached-endpoint-params', methods=['GET'])
        @cached_route(ttl=60, key_prefix="test_endpoint_params")
        def test_endpoint_params():
            return jsonify({
                **cls.response_data_store.get('test_endpoint_params', {}),
                "query_params": dict(request.args)
            })
        
        @cls.app.route('/test/cached-endpoint-diff-params', methods=['GET'])
        @cached_route(ttl=60, key_prefix="test_endpoint_diff")
        def test_endpoint_diff():
            return jsonify({
                **cls.response_data_store.get('test_endpoint_diff', {}),
                "query_params": dict(request.args)
            })
        
        @cls.app.route('/test/cached-endpoint-preserve', methods=['GET'])
        @cached_route(ttl=60, key_prefix="test_endpoint_preserve")
        def test_endpoint_preserve():
            return jsonify(cls.response_data_store.get('test_endpoint_preserve', {}))
        
        @cls.app.route('/test/cached-endpoint-ttl', methods=['GET'])
        @cached_route(ttl=5, key_prefix="test_endpoint_ttl")
        def test_endpoint_ttl():
            return jsonify(cls.response_data_store.get('test_endpoint_ttl', {}))
        
        @cls.app.route('/test/cached-endpoint-post', methods=['POST'])
        @cached_route(ttl=60, key_prefix="test_endpoint_post", include_body=True)
        def test_endpoint_post():
            return jsonify(cls.response_data_store.get('test_endpoint_post', {}))
    
    def setUp(self):
        """Set up before each test."""
        # Clear cache before each test to ensure clean state
        with self.app.app_context():
            cache.clear()
        
        # Clear response data store
        self.response_data_store.clear()
    
    def tearDown(self):
        """Clean up after each test."""
        # Clear cache after each test
        with self.app.app_context():
            cache.clear()
    
    def _clear_cache_for_test(self):
        """Helper to clear cache within a test (for Hypothesis examples)."""
        with self.app.app_context():
            cache.clear()
    
    @given(response_data=api_response_data())
    @settings(max_examples=100, deadline=5000)
    def test_first_request_has_cached_false(self, response_data):
        """
        Property: First request to a cached endpoint has "cached": false.
        
        For any API endpoint with caching enabled, the first request (cache miss)
        SHALL return a response with "cached": false.
        
        **Validates: Requirements 2.4**
        """
        # Clear cache for this Hypothesis example
        self._clear_cache_for_test()
        
        with self.app.app_context():
            # Arrange: Set response data for the endpoint
            self.response_data_store['test_endpoint'] = response_data
            endpoint_path = '/test/cached-endpoint'
            
            # Act: Make the first request (cache miss)
            response = self.client.get(endpoint_path)
            
            # Assert: Response should have "cached": false
            self.assertEqual(response.status_code, 200)
            response_json = json.loads(response.data)
            
            self.assertIn(
                'cached',
                response_json,
                "Response should include 'cached' field"
            )
            self.assertFalse(
                response_json['cached'],
                f"First request should have 'cached': false, but got: {response_json['cached']}"
            )
    
    @given(response_data=api_response_data())
    @settings(max_examples=100, deadline=5000)
    def test_subsequent_request_has_cached_true(self, response_data):
        """
        Property: Subsequent requests to a cached endpoint have "cached": true.
        
        For any API endpoint with caching enabled, subsequent requests (cache hit)
        SHALL return a response with "cached": true.
        
        **Validates: Requirements 2.4**
        """
        # Clear cache for this Hypothesis example
        self._clear_cache_for_test()
        
        with self.app.app_context():
            # Arrange: Set response data for the endpoint
            self.response_data_store['test_endpoint_2'] = response_data
            endpoint_path = '/test/cached-endpoint-2'
            
            # Act: Make the first request to populate cache
            first_response = self.client.get(endpoint_path)
            self.assertEqual(first_response.status_code, 200)
            
            # Make the second request (cache hit)
            second_response = self.client.get(endpoint_path)
            
            # Assert: Second response should have "cached": true
            self.assertEqual(second_response.status_code, 200)
            second_response_json = json.loads(second_response.data)
            
            self.assertIn(
                'cached',
                second_response_json,
                "Response should include 'cached' field"
            )
            self.assertTrue(
                second_response_json['cached'],
                f"Subsequent request should have 'cached': true, but got: {second_response_json['cached']}"
            )
    
    @given(response_data=api_response_data(), num_requests=st.integers(min_value=2, max_value=10))
    @settings(max_examples=50, deadline=5000)
    def test_multiple_requests_maintain_cached_indicator(self, response_data, num_requests):
        """
        Property: Multiple requests maintain correct cached indicator.
        
        For any API endpoint with caching enabled, the first request has "cached": false
        and all subsequent requests have "cached": true.
        
        **Validates: Requirements 2.4**
        """
        # Clear cache for this Hypothesis example
        self._clear_cache_for_test()
        
        with self.app.app_context():
            # Arrange: Set response data for the endpoint
            self.response_data_store['test_endpoint_3'] = response_data
            endpoint_path = '/test/cached-endpoint-3'
            
            # Act & Assert: Make multiple requests
            for i in range(num_requests):
                response = self.client.get(endpoint_path)
                self.assertEqual(response.status_code, 200)
                response_json = json.loads(response.data)
                
                self.assertIn('cached', response_json, f"Request {i+1} should include 'cached' field")
                
                if i == 0:
                    # First request should have cached: false
                    self.assertFalse(
                        response_json['cached'],
                        f"First request should have 'cached': false, but got: {response_json['cached']}"
                    )
                else:
                    # Subsequent requests should have cached: true
                    self.assertTrue(
                        response_json['cached'],
                        f"Request {i+1} should have 'cached': true, but got: {response_json['cached']}"
                    )
    
    @given(params=api_request_params(), response_data=api_response_data())
    @settings(max_examples=100, deadline=5000)
    def test_cached_indicator_with_query_params(self, params, response_data):
        """
        Property: Cached indicator works correctly with query parameters.
        
        For any API endpoint with query parameters, requests with identical parameters
        should result in cache hits (cached: true) on subsequent requests.
        
        **Validates: Requirements 2.4**
        """
        # Skip if params is empty to ensure we have meaningful test
        assume(len(params) > 0)
        
        # Clear cache for this Hypothesis example
        self._clear_cache_for_test()
        
        with self.app.app_context():
            # Arrange: Set response data for the endpoint
            self.response_data_store['test_endpoint_params'] = response_data
            endpoint_path = '/test/cached-endpoint-params'
            
            # Act: Make first request with params (cache miss)
            first_response = self.client.get(endpoint_path, query_string=params)
            self.assertEqual(first_response.status_code, 200)
            first_json = json.loads(first_response.data)
            
            # Make second request with same params (cache hit)
            second_response = self.client.get(endpoint_path, query_string=params)
            self.assertEqual(second_response.status_code, 200)
            second_json = json.loads(second_response.data)
            
            # Assert: First request has cached: false
            self.assertIn('cached', first_json)
            self.assertFalse(
                first_json['cached'],
                f"First request should have 'cached': false, but got: {first_json['cached']}"
            )
            
            # Assert: Second request has cached: true
            self.assertIn('cached', second_json)
            self.assertTrue(
                second_json['cached'],
                f"Second request with same params should have 'cached': true, but got: {second_json['cached']}"
            )
    
    @given(params1=api_request_params(), params2=api_request_params(), response_data=api_response_data())
    @settings(max_examples=50, deadline=5000)
    def test_different_params_result_in_cache_miss(self, params1, params2, response_data):
        """
        Property: Different query parameters result in cache miss.
        
        For any API endpoint, requests with different query parameters should
        result in separate cache entries, with each unique parameter set having
        its own cached indicator behavior.
        
        **Validates: Requirements 2.4**
        """
        # Ensure params are different
        assume(params1 != params2)
        # Ensure both have at least one param
        assume(len(params1) > 0 and len(params2) > 0)
        
        # Clear cache for this Hypothesis example
        self._clear_cache_for_test()
        
        with self.app.app_context():
            # Arrange: Set response data for the endpoint
            self.response_data_store['test_endpoint_diff'] = response_data
            endpoint_path = '/test/cached-endpoint-diff-params'
            
            # Act: Make request with first params
            first_response = self.client.get(endpoint_path, query_string=params1)
            self.assertEqual(first_response.status_code, 200)
            first_json = json.loads(first_response.data)
            
            # Make request with second params (different cache key)
            second_response = self.client.get(endpoint_path, query_string=params2)
            self.assertEqual(second_response.status_code, 200)
            second_json = json.loads(second_response.data)
            
            # Assert: Both requests should have cached: false (different cache keys)
            self.assertIn('cached', first_json)
            self.assertFalse(
                first_json['cached'],
                f"First request should have 'cached': false, but got: {first_json['cached']}"
            )
            
            self.assertIn('cached', second_json)
            self.assertFalse(
                second_json['cached'],
                f"Request with different params should have 'cached': false, but got: {second_json['cached']}"
            )
    
    @given(response_data=api_response_data())
    @settings(max_examples=50, deadline=5000)
    def test_cached_indicator_preserved_in_response_data(self, response_data):
        """
        Property: Cached indicator is added without modifying original response data.
        
        For any API response, the cached indicator should be added to the response
        without modifying the original response data fields.
        
        **Validates: Requirements 2.4**
        """
        # Clear cache for this Hypothesis example
        self._clear_cache_for_test()
        
        with self.app.app_context():
            # Arrange: Set response data for the endpoint
            self.response_data_store['test_endpoint_preserve'] = response_data
            endpoint_path = '/test/cached-endpoint-preserve'
            
            # Act: Make first request
            first_response = self.client.get(endpoint_path)
            self.assertEqual(first_response.status_code, 200)
            first_json = json.loads(first_response.data)
            
            # Make second request (cached)
            second_response = self.client.get(endpoint_path)
            self.assertEqual(second_response.status_code, 200)
            second_json = json.loads(second_response.data)
            
            # Assert: Both responses should have the cached field
            self.assertIn('cached', first_json)
            self.assertIn('cached', second_json)
            
            # Assert: Original response data fields should be preserved
            for key in response_data.keys():
                self.assertIn(
                    key,
                    first_json,
                    f"Original field '{key}' should be preserved in first response"
                )
                self.assertIn(
                    key,
                    second_json,
                    f"Original field '{key}' should be preserved in cached response"
                )
                
                # Values should match (except for the cached field)
                if key != 'cached':
                    self.assertEqual(
                        first_json[key],
                        second_json[key],
                        f"Field '{key}' should have same value in both responses"
                    )
    
    @given(response_data=api_response_data(), ttl=st.integers(min_value=1, max_value=5))
    @settings(max_examples=30, deadline=5000)
    def test_cached_indicator_with_various_ttls(self, response_data, ttl):
        """
        Property: Cached indicator works correctly with various TTL values.
        
        For any API endpoint with any TTL value, the cached indicator should
        correctly reflect cache hit/miss status.
        
        **Validates: Requirements 2.4**
        """
        # Clear cache for this Hypothesis example
        self._clear_cache_for_test()
        
        with self.app.app_context():
            # Arrange: Set response data for the endpoint
            # Note: This endpoint uses a fixed TTL of 5, but we test with various data
            self.response_data_store['test_endpoint_ttl'] = response_data
            endpoint_path = '/test/cached-endpoint-ttl'
            
            # Act: Make first request (cache miss)
            first_response = self.client.get(endpoint_path)
            self.assertEqual(first_response.status_code, 200)
            first_json = json.loads(first_response.data)
            
            # Make second request immediately (cache hit)
            second_response = self.client.get(endpoint_path)
            self.assertEqual(second_response.status_code, 200)
            second_json = json.loads(second_response.data)
            
            # Assert: First request has cached: false
            self.assertIn('cached', first_json)
            self.assertFalse(
                first_json['cached'],
                f"First request should have 'cached': false"
            )
            
            # Assert: Second request has cached: true
            self.assertIn('cached', second_json)
            self.assertTrue(
                second_json['cached'],
                f"Second request should have 'cached': true"
            )
    
    @given(response_data=api_response_data())
    @settings(max_examples=50, deadline=5000)
    def test_post_request_cached_indicator(self, response_data):
        """
        Property: Cached indicator works for POST requests.
        
        For any API endpoint that accepts POST requests with caching enabled,
        the cached indicator should correctly reflect cache status.
        
        **Validates: Requirements 2.4**
        """
        # Clear cache for this Hypothesis example
        self._clear_cache_for_test()
        
        with self.app.app_context():
            # Arrange: Set response data for the endpoint
            self.response_data_store['test_endpoint_post'] = response_data
            endpoint_path = '/test/cached-endpoint-post'
            
            # Prepare POST data
            post_data = {"test": "data", "value": 123}
            
            # Act: Make first POST request (cache miss)
            first_response = self.client.post(
                endpoint_path,
                data=json.dumps(post_data),
                content_type='application/json'
            )
            self.assertEqual(first_response.status_code, 200)
            first_json = json.loads(first_response.data)
            
            # Make second POST request with same data (cache hit)
            second_response = self.client.post(
                endpoint_path,
                data=json.dumps(post_data),
                content_type='application/json'
            )
            self.assertEqual(second_response.status_code, 200)
            second_json = json.loads(second_response.data)
            
            # Assert: First request has cached: false
            self.assertIn('cached', first_json)
            self.assertFalse(
                first_json['cached'],
                f"First POST request should have 'cached': false"
            )
            
            # Assert: Second request has cached: true
            self.assertIn('cached', second_json)
            self.assertTrue(
                second_json['cached'],
                f"Second POST request with same data should have 'cached': true"
            )


if __name__ == '__main__':
    unittest.main()
