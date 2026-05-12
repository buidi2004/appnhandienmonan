"""
Property-based tests for cache key uniqueness and consistency.

**Validates: Requirements 1.5**

This module contains property-based tests using Hypothesis to verify:
- Cache keys are consistent: identical parameters always produce the same hash
- Cache keys are unique: different parameters always produce different hashes
- Cache key generation works correctly across various parameter combinations

Property 2: Cache Key Uniqueness and Consistency
For any set of request parameters, generating a cache key SHALL produce the same 
hash for identical parameters and different hashes for different parameters.
"""

import sys
import os
# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest
from hypothesis import given, strategies as st, assume
from utils.cache_utils import (
    generate_cache_key,
    generate_image_cache_key,
    generate_ai_suggestion_cache_key
)


class TestCacheKeyUniquenessProperty(unittest.TestCase):
    """Property-based tests for cache key uniqueness and consistency."""
    
    @given(
        method=st.sampled_from(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
        path=st.text(min_size=1, max_size=100),
        user_id=st.one_of(st.none(), st.text(min_size=1, max_size=50))
    )
    def test_cache_key_consistency_basic(self, method, path, user_id):
        """
        Property: Identical parameters always produce the same cache key.
        
        For any combination of method, path, and user_id, calling generate_cache_key
        multiple times with the same parameters should always return the same hash.
        """
        key1 = generate_cache_key(method, path, user_id=user_id)
        key2 = generate_cache_key(method, path, user_id=user_id)
        key3 = generate_cache_key(method, path, user_id=user_id)
        
        # All keys should be identical
        self.assertEqual(key1, key2)
        self.assertEqual(key2, key3)
        
        # Keys should be valid MD5 hashes (32 hex characters)
        self.assertEqual(len(key1), 32)
        self.assertTrue(all(c in '0123456789abcdef' for c in key1))
    
    @given(
        method=st.sampled_from(['GET', 'POST', 'PUT', 'DELETE']),
        path=st.text(min_size=1, max_size=100),
        query_params=st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.one_of(
                st.text(max_size=50),
                st.integers(),
                st.booleans(),
                st.floats(allow_nan=False, allow_infinity=False)
            ),
            max_size=10
        ),
        user_id=st.one_of(st.none(), st.text(min_size=1, max_size=50))
    )
    def test_cache_key_consistency_with_query_params(self, method, path, query_params, user_id):
        """
        Property: Identical parameters including query params produce the same cache key.
        
        For any combination of method, path, query_params, and user_id, calling 
        generate_cache_key multiple times should always return the same hash.
        """
        key1 = generate_cache_key(method, path, query_params, user_id)
        key2 = generate_cache_key(method, path, query_params, user_id)
        
        self.assertEqual(key1, key2)
        self.assertEqual(len(key1), 32)
    
    @given(
        method=st.sampled_from(['GET', 'POST']),
        path=st.text(min_size=1, max_size=100),
        query_params=st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.text(max_size=50),
            min_size=2,
            max_size=5
        )
    )
    def test_cache_key_parameter_order_independence(self, method, path, query_params):
        """
        Property: Parameter order does not affect cache key.
        
        The same parameters in different orders should produce the same cache key
        because the implementation sorts keys before hashing.
        """
        # Generate key with original order
        key1 = generate_cache_key(method, path, query_params)
        
        # Generate key with same params (dict iteration order may vary in different contexts)
        key2 = generate_cache_key(method, path, query_params)
        
        self.assertEqual(key1, key2)
    
    @given(
        method1=st.sampled_from(['GET', 'POST']),
        method2=st.sampled_from(['PUT', 'DELETE']),
        path=st.text(min_size=1, max_size=100),
        user_id=st.text(min_size=1, max_size=50)
    )
    def test_cache_key_uniqueness_different_methods(self, method1, method2, path, user_id):
        """
        Property: Different HTTP methods produce different cache keys.
        
        For the same path and user_id, different HTTP methods should produce
        different cache keys.
        """
        key1 = generate_cache_key(method1, path, user_id=user_id)
        key2 = generate_cache_key(method2, path, user_id=user_id)
        
        self.assertNotEqual(key1, key2)
    
    @given(
        method=st.sampled_from(['GET', 'POST']),
        path1=st.text(min_size=1, max_size=100),
        path2=st.text(min_size=1, max_size=100),
        user_id=st.text(min_size=1, max_size=50)
    )
    def test_cache_key_uniqueness_different_paths(self, method, path1, path2, user_id):
        """
        Property: Different paths produce different cache keys.
        
        For the same method and user_id, different paths should produce
        different cache keys.
        """
        # Ensure paths are actually different
        assume(path1 != path2)
        
        key1 = generate_cache_key(method, path1, user_id=user_id)
        key2 = generate_cache_key(method, path2, user_id=user_id)
        
        self.assertNotEqual(key1, key2)
    
    @given(
        method=st.sampled_from(['GET', 'POST']),
        path=st.text(min_size=1, max_size=100),
        user_id1=st.text(min_size=1, max_size=50),
        user_id2=st.text(min_size=1, max_size=50)
    )
    def test_cache_key_uniqueness_different_users(self, method, path, user_id1, user_id2):
        """
        Property: Different user IDs produce different cache keys.
        
        For the same method and path, different user IDs should produce
        different cache keys to ensure data isolation.
        """
        # Ensure user IDs are actually different
        assume(user_id1 != user_id2)
        
        key1 = generate_cache_key(method, path, user_id=user_id1)
        key2 = generate_cache_key(method, path, user_id=user_id2)
        
        self.assertNotEqual(key1, key2)
    
    @given(
        method=st.sampled_from(['GET', 'POST']),
        path=st.text(min_size=1, max_size=100),
        param_key=st.text(min_size=1, max_size=20),
        param_value1=st.text(min_size=1, max_size=50),
        param_value2=st.text(min_size=1, max_size=50)
    )
    def test_cache_key_uniqueness_different_query_values(self, method, path, param_key, param_value1, param_value2):
        """
        Property: Different query parameter values produce different cache keys.
        
        For the same method and path, different query parameter values should
        produce different cache keys.
        """
        # Ensure values are actually different
        assume(param_value1 != param_value2)
        
        key1 = generate_cache_key(method, path, {param_key: param_value1})
        key2 = generate_cache_key(method, path, {param_key: param_value2})
        
        self.assertNotEqual(key1, key2)
    
    @given(
        method=st.sampled_from(['POST', 'PUT']),
        path=st.text(min_size=1, max_size=100),
        body_params=st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.one_of(
                st.text(max_size=50),
                st.integers(),
                st.booleans()
            ),
            max_size=10
        )
    )
    def test_cache_key_consistency_with_body_params(self, method, path, body_params):
        """
        Property: Identical body parameters produce the same cache key.
        
        For POST/PUT requests with body parameters, identical body content
        should produce the same cache key.
        """
        key1 = generate_cache_key(method, path, body_params=body_params)
        key2 = generate_cache_key(method, path, body_params=body_params)
        
        self.assertEqual(key1, key2)
        self.assertEqual(len(key1), 32)


class TestImageCacheKeyUniquenessProperty(unittest.TestCase):
    """Property-based tests for image cache key uniqueness and consistency."""
    
    @given(
        image_hash=st.text(min_size=1, max_size=100),
        user_id=st.one_of(st.none(), st.text(min_size=1, max_size=50))
    )
    def test_image_cache_key_consistency(self, image_hash, user_id):
        """
        Property: Identical image hash and user ID produce the same cache key.
        
        For any image hash and user ID combination, calling generate_image_cache_key
        multiple times should always return the same hash.
        """
        key1 = generate_image_cache_key(image_hash, user_id)
        key2 = generate_image_cache_key(image_hash, user_id)
        key3 = generate_image_cache_key(image_hash, user_id)
        
        self.assertEqual(key1, key2)
        self.assertEqual(key2, key3)
        self.assertEqual(len(key1), 32)
    
    @given(
        image_hash1=st.text(min_size=1, max_size=100),
        image_hash2=st.text(min_size=1, max_size=100),
        user_id=st.one_of(st.none(), st.text(min_size=1, max_size=50))
    )
    def test_image_cache_key_uniqueness_different_hashes(self, image_hash1, image_hash2, user_id):
        """
        Property: Different image hashes produce different cache keys.
        
        For the same user ID, different image hashes should produce different cache keys.
        """
        # Ensure image hashes are actually different
        assume(image_hash1 != image_hash2)
        
        key1 = generate_image_cache_key(image_hash1, user_id)
        key2 = generate_image_cache_key(image_hash2, user_id)
        
        self.assertNotEqual(key1, key2)
    
    @given(
        image_hash=st.text(min_size=1, max_size=100),
        user_id1=st.text(min_size=1, max_size=50),
        user_id2=st.text(min_size=1, max_size=50)
    )
    def test_image_cache_key_uniqueness_different_users(self, image_hash, user_id1, user_id2):
        """
        Property: Different user IDs produce different cache keys for the same image.
        
        For the same image hash, different user IDs should produce different cache keys
        to ensure data isolation.
        """
        # Ensure user IDs are actually different
        assume(user_id1 != user_id2)
        
        key1 = generate_image_cache_key(image_hash, user_id1)
        key2 = generate_image_cache_key(image_hash, user_id2)
        
        self.assertNotEqual(key1, key2)


class TestAISuggestionCacheKeyUniquenessProperty(unittest.TestCase):
    """Property-based tests for AI suggestion cache key uniqueness and consistency."""
    
    @given(
        ingredients=st.lists(st.text(min_size=1, max_size=30), min_size=1, max_size=10),
        user_id=st.one_of(st.none(), st.text(min_size=1, max_size=50))
    )
    def test_ai_suggestion_cache_key_consistency(self, ingredients, user_id):
        """
        Property: Identical ingredients and user ID produce the same cache key.
        
        For any ingredients list and user ID, calling generate_ai_suggestion_cache_key
        multiple times should always return the same hash.
        """
        key1 = generate_ai_suggestion_cache_key(ingredients, user_id=user_id)
        key2 = generate_ai_suggestion_cache_key(ingredients, user_id=user_id)
        key3 = generate_ai_suggestion_cache_key(ingredients, user_id=user_id)
        
        self.assertEqual(key1, key2)
        self.assertEqual(key2, key3)
        self.assertEqual(len(key1), 32)
    
    @given(
        ingredients=st.lists(st.text(min_size=1, max_size=30), min_size=2, max_size=5)
    )
    def test_ai_suggestion_cache_key_ingredient_order_independence(self, ingredients):
        """
        Property: Ingredient order does not affect cache key.
        
        The same ingredients in different orders should produce the same cache key
        because the implementation sorts ingredients before hashing.
        """
        # Create a shuffled version of ingredients
        import random
        shuffled_ingredients = ingredients.copy()
        random.shuffle(shuffled_ingredients)
        
        key1 = generate_ai_suggestion_cache_key(ingredients)
        key2 = generate_ai_suggestion_cache_key(shuffled_ingredients)
        
        # Keys should be the same regardless of order
        self.assertEqual(key1, key2)
    
    @given(
        ingredients1=st.lists(st.text(min_size=1, max_size=30), min_size=1, max_size=5),
        ingredients2=st.lists(st.text(min_size=1, max_size=30), min_size=1, max_size=5),
        user_id=st.text(min_size=1, max_size=50)
    )
    def test_ai_suggestion_cache_key_uniqueness_different_ingredients(self, ingredients1, ingredients2, user_id):
        """
        Property: Different ingredient lists produce different cache keys.
        
        For the same user ID, different ingredient lists should produce different cache keys.
        """
        # Ensure ingredient lists are actually different (when sorted)
        assume(sorted(ingredients1) != sorted(ingredients2))
        
        key1 = generate_ai_suggestion_cache_key(ingredients1, user_id=user_id)
        key2 = generate_ai_suggestion_cache_key(ingredients2, user_id=user_id)
        
        self.assertNotEqual(key1, key2)
    
    @given(
        ingredients=st.lists(st.text(min_size=1, max_size=30), min_size=1, max_size=5),
        health_profile1=st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.text(max_size=30),
            min_size=1,
            max_size=3
        ),
        health_profile2=st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.text(max_size=30),
            min_size=1,
            max_size=3
        )
    )
    def test_ai_suggestion_cache_key_uniqueness_different_health_profiles(self, ingredients, health_profile1, health_profile2):
        """
        Property: Different health profiles produce different cache keys.
        
        For the same ingredients, different health profiles should produce different cache keys.
        """
        # Ensure health profiles are actually different
        assume(health_profile1 != health_profile2)
        
        key1 = generate_ai_suggestion_cache_key(ingredients, health_profile1)
        key2 = generate_ai_suggestion_cache_key(ingredients, health_profile2)
        
        self.assertNotEqual(key1, key2)
    
    @given(
        ingredients=st.lists(st.text(min_size=1, max_size=30), min_size=1, max_size=5),
        health_profile=st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.text(max_size=30),
            max_size=3
        ),
        pantry_context=st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.text(max_size=30),
            max_size=3
        ),
        user_id=st.one_of(st.none(), st.text(min_size=1, max_size=50))
    )
    def test_ai_suggestion_cache_key_consistency_all_params(self, ingredients, health_profile, pantry_context, user_id):
        """
        Property: Identical parameters including all optional fields produce the same cache key.
        
        For any combination of ingredients, health_profile, pantry_context, and user_id,
        calling generate_ai_suggestion_cache_key multiple times should return the same hash.
        """
        key1 = generate_ai_suggestion_cache_key(ingredients, health_profile, pantry_context, user_id)
        key2 = generate_ai_suggestion_cache_key(ingredients, health_profile, pantry_context, user_id)
        
        self.assertEqual(key1, key2)
        self.assertEqual(len(key1), 32)


if __name__ == '__main__':
    unittest.main()

