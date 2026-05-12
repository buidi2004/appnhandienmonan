"""
Property-based tests for cache round-trip preservation.

This module contains property-based tests that verify cache operations
maintain data integrity across store and retrieve operations.

**Validates: Requirements 1.4**

Property 1: Cache Round-Trip Preservation
For any cache key and data value, storing the data with a TTL and retrieving it
before expiration SHALL return the same data value.
"""

import unittest
import json
import time
import sys
import os
from hypothesis import given, strategies as st, settings, assume
from hypothesis.strategies import composite

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import cache, redis_client


# Custom strategies for generating test data
@composite
def cache_keys(draw):
    """
    Generate valid cache keys.
    
    Cache keys should be non-empty strings that can be used as Redis keys.
    """
    # Generate alphanumeric strings with underscores and hyphens
    key = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), whitelist_characters='_-'),
        min_size=1,
        max_size=100
    ))
    # Ensure key is not empty after stripping
    assume(len(key.strip()) > 0)
    return key


@composite
def json_serializable_data(draw):
    """
    Generate JSON-serializable data values.
    
    This includes strings, numbers, booleans, lists, and dictionaries
    that can be serialized to JSON and deserialized back.
    """
    return draw(st.recursive(
        st.one_of(
            st.none(),
            st.booleans(),
            st.integers(min_value=-1000000, max_value=1000000),
            st.floats(allow_nan=False, allow_infinity=False, width=32),
            st.text(max_size=1000),
        ),
        lambda children: st.one_of(
            st.lists(children, max_size=20),
            st.dictionaries(
                st.text(alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')), min_size=1, max_size=50),
                children,
                max_size=20
            )
        ),
        max_leaves=50
    ))


@composite
def binary_data(draw):
    """
    Generate binary data (bytes).
    
    This represents binary data like images or files that might be cached.
    """
    return draw(st.binary(min_size=0, max_size=10000))


class TestCacheRoundTripProperty(unittest.TestCase):
    """
    Property-based tests for cache round-trip preservation.
    
    **Validates: Requirements 1.4**
    """
    
    def setUp(self):
        """Set up test environment before each test."""
        from flask import Flask
        
        # Create Flask app and initialize cache
        self.app = Flask(__name__)
        cache.init_app(self.app)
        self.cache = cache
        
        # Clear cache before each test to ensure clean state
        with self.app.app_context():
            self.cache.clear()
    
    def tearDown(self):
        """Clean up after each test."""
        # Clear cache after each test
        with self.app.app_context():
            self.cache.clear()
    
    @given(key=cache_keys(), value=st.text(max_size=10000))
    @settings(max_examples=100, deadline=5000)
    def test_cache_roundtrip_string_data(self, key, value):
        """
        Property: String data stored in cache can be retrieved identically.
        
        For any cache key and string value, storing the value with a TTL
        and retrieving it before expiration returns the same string value.
        
        **Validates: Requirements 1.4**
        """
        with self.app.app_context():
            # Arrange: Use a TTL of 60 seconds (sufficient for test)
            ttl = 60
            cache_key = f"test_string_{key}"
            
            # Act: Store value in cache
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Retrieve value from cache
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be identical to stored value
            self.assertEqual(
                retrieved_value,
                value,
                f"Cache round-trip failed for string data. Expected: {value!r}, Got: {retrieved_value!r}"
            )
    
    @given(key=cache_keys(), value=json_serializable_data())
    @settings(max_examples=100, deadline=5000)
    def test_cache_roundtrip_json_data(self, key, value):
        """
        Property: JSON-serializable data stored in cache can be retrieved identically.
        
        For any cache key and JSON-serializable value (dict, list, etc.),
        storing the value with a TTL and retrieving it before expiration
        returns the same data structure.
        
        **Validates: Requirements 1.4**
        """
        with self.app.app_context():
            # Arrange: Use a TTL of 60 seconds
            ttl = 60
            cache_key = f"test_json_{key}"
            
            # Act: Store value in cache (Flask-Caching handles JSON serialization)
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Retrieve value from cache
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be identical to stored value
            self.assertEqual(
                retrieved_value,
                value,
                f"Cache round-trip failed for JSON data. Expected: {value!r}, Got: {retrieved_value!r}"
            )
    
    @given(key=cache_keys(), value=binary_data())
    @settings(max_examples=50, deadline=5000)
    def test_cache_roundtrip_binary_data(self, key, value):
        """
        Property: Binary data stored in cache can be retrieved identically.
        
        For any cache key and binary value (bytes), storing the value with a TTL
        and retrieving it before expiration returns the same binary data.
        
        **Validates: Requirements 1.4**
        """
        with self.app.app_context():
            # Arrange: Use a TTL of 60 seconds
            ttl = 60
            cache_key = f"test_binary_{key}"
            
            # Act: Store binary value in cache
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Retrieve value from cache
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be identical to stored value
            self.assertEqual(
                retrieved_value,
                value,
                f"Cache round-trip failed for binary data. Expected {len(value)} bytes, Got {len(retrieved_value) if retrieved_value else 0} bytes"
            )
    
    @given(key=cache_keys(), value=st.integers(min_value=-1000000, max_value=1000000))
    @settings(max_examples=100, deadline=5000)
    def test_cache_roundtrip_integer_data(self, key, value):
        """
        Property: Integer data stored in cache can be retrieved identically.
        
        For any cache key and integer value, storing the value with a TTL
        and retrieving it before expiration returns the same integer value.
        
        **Validates: Requirements 1.4**
        """
        with self.app.app_context():
            # Arrange: Use a TTL of 60 seconds
            ttl = 60
            cache_key = f"test_int_{key}"
            
            # Act: Store value in cache
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Retrieve value from cache
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be identical to stored value
            self.assertEqual(
                retrieved_value,
                value,
                f"Cache round-trip failed for integer data. Expected: {value}, Got: {retrieved_value}"
            )
    
    @given(key=cache_keys(), value=st.floats(allow_nan=False, allow_infinity=False, width=32))
    @settings(max_examples=100, deadline=5000)
    def test_cache_roundtrip_float_data(self, key, value):
        """
        Property: Float data stored in cache can be retrieved identically.
        
        For any cache key and float value, storing the value with a TTL
        and retrieving it before expiration returns the same float value.
        
        **Validates: Requirements 1.4**
        """
        with self.app.app_context():
            # Arrange: Use a TTL of 60 seconds
            ttl = 60
            cache_key = f"test_float_{key}"
            
            # Act: Store value in cache
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Retrieve value from cache
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be identical to stored value
            # Use assertAlmostEqual for float comparison to handle floating-point precision
            if retrieved_value is not None:
                self.assertAlmostEqual(
                    retrieved_value,
                    value,
                    places=5,
                    msg=f"Cache round-trip failed for float data. Expected: {value}, Got: {retrieved_value}"
                )
            else:
                self.fail(f"Cache returned None for float value {value}")
    
    @given(key=cache_keys(), value=st.booleans())
    @settings(max_examples=50, deadline=5000)
    def test_cache_roundtrip_boolean_data(self, key, value):
        """
        Property: Boolean data stored in cache can be retrieved identically.
        
        For any cache key and boolean value, storing the value with a TTL
        and retrieving it before expiration returns the same boolean value.
        
        **Validates: Requirements 1.4**
        """
        with self.app.app_context():
            # Arrange: Use a TTL of 60 seconds
            ttl = 60
            cache_key = f"test_bool_{key}"
            
            # Act: Store value in cache
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Retrieve value from cache
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be identical to stored value
            self.assertEqual(
                retrieved_value,
                value,
                f"Cache round-trip failed for boolean data. Expected: {value}, Got: {retrieved_value}"
            )
    
    @given(
        key=cache_keys(),
        value=st.dictionaries(
            st.text(min_size=1, max_size=50),
            st.one_of(st.text(max_size=100), st.integers(), st.booleans()),
            min_size=1,
            max_size=20
        )
    )
    @settings(max_examples=100, deadline=5000)
    def test_cache_roundtrip_complex_dict(self, key, value):
        """
        Property: Complex dictionary data stored in cache can be retrieved identically.
        
        For any cache key and complex dictionary value, storing the value with a TTL
        and retrieving it before expiration returns the same dictionary structure.
        
        **Validates: Requirements 1.4**
        """
        with self.app.app_context():
            # Arrange: Use a TTL of 60 seconds
            ttl = 60
            cache_key = f"test_dict_{key}"
            
            # Act: Store value in cache
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Retrieve value from cache
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be identical to stored value
            self.assertEqual(
                retrieved_value,
                value,
                f"Cache round-trip failed for dictionary data. Expected: {value!r}, Got: {retrieved_value!r}"
            )
    
    @given(
        key=cache_keys(),
        value=st.lists(
            st.one_of(st.text(max_size=100), st.integers(), st.booleans()),
            min_size=0,
            max_size=50
        )
    )
    @settings(max_examples=100, deadline=5000)
    def test_cache_roundtrip_list_data(self, key, value):
        """
        Property: List data stored in cache can be retrieved identically.
        
        For any cache key and list value, storing the value with a TTL
        and retrieving it before expiration returns the same list with
        the same order and elements.
        
        **Validates: Requirements 1.4**
        """
        with self.app.app_context():
            # Arrange: Use a TTL of 60 seconds
            ttl = 60
            cache_key = f"test_list_{key}"
            
            # Act: Store value in cache
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Retrieve value from cache
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be identical to stored value
            self.assertEqual(
                retrieved_value,
                value,
                f"Cache round-trip failed for list data. Expected: {value!r}, Got: {retrieved_value!r}"
            )
    
    @given(key=cache_keys(), value=st.text(max_size=1000), ttl=st.integers(min_value=1, max_value=10))
    @settings(max_examples=50, deadline=5000)
    def test_cache_roundtrip_with_various_ttls(self, key, value, ttl):
        """
        Property: Data stored with various TTL values can be retrieved before expiration.
        
        For any cache key, value, and TTL, storing the value and retrieving it
        before the TTL expires returns the same value.
        
        **Validates: Requirements 1.4**
        """
        with self.app.app_context():
            # Arrange
            cache_key = f"test_ttl_{key}"
            
            # Act: Store value in cache with specified TTL
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Retrieve value immediately (before expiration)
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be identical to stored value
            self.assertEqual(
                retrieved_value,
                value,
                f"Cache round-trip failed with TTL={ttl}. Expected: {value!r}, Got: {retrieved_value!r}"
            )
    
    @given(key=cache_keys(), value=st.text(min_size=1, max_size=1000))
    @settings(max_examples=20, deadline=10000)
    def test_cache_expiration_after_ttl(self, key, value):
        """
        Property: Data stored in cache expires after TTL.
        
        For any cache key and value, storing the value with a short TTL
        and retrieving it after expiration returns None.
        
        **Validates: Requirements 1.4** (implicit - verifies TTL behavior)
        """
        with self.app.app_context():
            # Arrange: Use a very short TTL (1 second)
            ttl = 1
            cache_key = f"test_expire_{key}"
            
            # Act: Store value in cache
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Wait for TTL to expire
            time.sleep(ttl + 0.5)
            
            # Retrieve value after expiration
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be None after expiration
            self.assertIsNone(
                retrieved_value,
                f"Cache did not expire after TTL. Expected: None, Got: {retrieved_value!r}"
            )
    
    @given(key=cache_keys(), value=st.text(max_size=1000))
    @settings(max_examples=50, deadline=5000)
    def test_cache_overwrite_preserves_latest_value(self, key, value):
        """
        Property: Overwriting a cache key preserves the latest value.
        
        For any cache key, storing multiple values sequentially and retrieving
        the key returns the most recently stored value.
        
        **Validates: Requirements 1.4**
        """
        with self.app.app_context():
            # Arrange
            ttl = 60
            cache_key = f"test_overwrite_{key}"
            old_value = "old_value_12345"
            
            # Act: Store old value
            self.cache.set(cache_key, old_value, timeout=ttl)
            
            # Overwrite with new value
            self.cache.set(cache_key, value, timeout=ttl)
            
            # Retrieve value
            retrieved_value = self.cache.get(cache_key)
            
            # Assert: Retrieved value should be the latest value
            self.assertEqual(
                retrieved_value,
                value,
                f"Cache overwrite failed. Expected latest value: {value!r}, Got: {retrieved_value!r}"
            )
            self.assertNotEqual(
                retrieved_value,
                old_value,
                f"Cache returned old value instead of latest value"
            )


if __name__ == '__main__':
    unittest.main()
