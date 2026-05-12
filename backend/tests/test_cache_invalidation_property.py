"""
Property-based tests for cache invalidation on user actions.

This module contains property-based tests that verify cache invalidation
works correctly when users create posts or like content.

**Validates: Requirements 3.5**

Property 4: Cache Invalidation on User Actions
For any user who creates a post or likes content, the Cache_System SHALL
remove that user's community feed cache entry.
"""

import unittest
import json
import sys
import os
from hypothesis import given, strategies as st, settings, assume
from hypothesis.strategies import composite
from unittest.mock import patch, MagicMock
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import cache, db


def create_test_app():
    """Create Flask app for testing."""
    from flask import Flask
    from flask_cors import CORS
    
    app = Flask(__name__)
    CORS(app)
    
    # Initialize cache
    cache.init_app(app)
    
    # Register blueprints
    from routes.community import community_bp
    app.register_blueprint(community_bp, url_prefix='/api/v1/community')
    
    return app


# Custom strategies for generating test data
@composite
def user_ids(draw):
    """
    Generate valid user IDs.
    
    User IDs should be non-empty alphanumeric strings.
    """
    user_id = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
        min_size=10,
        max_size=30
    ))
    assume(len(user_id.strip()) > 0)
    return user_id


@composite
def post_data(draw):
    """
    Generate valid community post data.
    
    Returns a dictionary with all required fields for creating a post.
    """
    return {
        "dish_name": draw(st.text(min_size=1, max_size=200)),
        "image_url": draw(st.text(min_size=0, max_size=500)),
        "description": draw(st.text(min_size=0, max_size=1000)),
        "calories": draw(st.integers(min_value=0, max_value=5000)),
        "macros": {
            "protein": draw(st.integers(min_value=0, max_value=200)),
            "carbs": draw(st.integers(min_value=0, max_value=500)),
            "fat": draw(st.integers(min_value=0, max_value=200))
        }
    }


@composite
def post_ids(draw):
    """
    Generate valid post IDs.
    
    Post IDs should be non-empty alphanumeric strings.
    """
    post_id = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
        min_size=10,
        max_size=30
    ))
    assume(len(post_id.strip()) > 0)
    return post_id


class TestCacheInvalidationProperty(unittest.TestCase):
    """
    Property-based tests for cache invalidation on user actions.
    
    **Validates: Requirements 3.5**
    """
    
    def setUp(self):
        """Set up test environment before each test."""
        # Create Flask app
        self.app = create_app()
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Clear cache before each test
        cache.clear()
        
        # Mock Firebase operations
        self.mock_db_patcher = patch('routes.community.db')
        self.mock_db = self.mock_db_patcher.start()
        
        # Mock token_required decorator to bypass authentication
        self.mock_token_patcher = patch('routes.community.token_required')
        self.mock_token = self.mock_token_patcher.start()
        
        # Make token_required pass through the user_id
        def token_required_mock(f):
            def wrapper(*args, **kwargs):
                # Extract user_id from request headers or use a test user
                from flask import request
                user_id = request.headers.get('X-Test-User-ID', 'test_user_123')
                return f(user_id, *args, **kwargs)
            wrapper.__name__ = f.__name__
            return wrapper
        
        self.mock_token.side_effect = token_required_mock
    
    def tearDown(self):
        """Clean up after each test."""
        # Stop all patches
        self.mock_db_patcher.stop()
        self.mock_token_patcher.stop()
        
        # Clear cache
        cache.clear()
        
        # Pop app context
        self.app_context.pop()
    
    def _setup_mock_user(self, user_id, user_name="Test User"):
        """Helper to set up mock user data."""
        mock_user_ref = MagicMock()
        mock_user_ref.exists = True
        mock_user_ref.to_dict.return_value = {
            'name': user_name,
            'xp': 100
        }
        self.mock_db.collection.return_value.document.return_value.get.return_value = mock_user_ref
        return mock_user_ref
    
    def _setup_mock_post(self, post_id, user_id, likes=0):
        """Helper to set up mock post data."""
        mock_post_ref = MagicMock()
        mock_post_snapshot = MagicMock()
        mock_post_snapshot.exists = True
        mock_post_snapshot.to_dict.return_value = {
            'user_id': user_id,
            'likes': likes,
            'created_at': datetime.now().isoformat()
        }
        
        # Mock the post reference
        self.mock_db.collection.return_value.document.return_value = mock_post_ref
        mock_post_ref.get.return_value = mock_post_snapshot
        
        return mock_post_ref, mock_post_snapshot
    
    def _populate_cache_for_user(self, user_id, feed_data):
        """Helper to populate cache with user's community feed."""
        cache_key = f"community_feed_{user_id}"
        cache.set(cache_key, feed_data, timeout=120)
        return cache_key
    
    def _verify_cache_invalidated(self, user_id):
        """Helper to verify that user's cache has been invalidated."""
        cache_key = f"community_feed_{user_id}"
        cached_value = cache.get(cache_key)
        return cached_value is None
    
    @given(user_id=user_ids(), post=post_data())
    @settings(max_examples=50, deadline=10000)
    def test_cache_invalidation_on_post_creation(self, user_id, post):
        """
        Property: Creating a post invalidates the user's community feed cache.
        
        For any user who creates a post, the Cache_System SHALL remove
        that user's community feed cache entry.
        
        **Validates: Requirements 3.5**
        """
        # Arrange: Set up mock user
        self._setup_mock_user(user_id, "Test User")
        
        # Mock the add operation to return a document reference
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "new_post_123"
        self.mock_db.collection.return_value.add.return_value = (None, mock_doc_ref)
        
        # Mock the user update operation
        self.mock_db.collection.return_value.document.return_value.update.return_value = None
        
        # Populate cache with user's feed
        feed_data = [{"id": "post1", "dish_name": "Test Dish"}]
        cache_key = self._populate_cache_for_user(user_id, feed_data)
        
        # Verify cache is populated
        self.assertIsNotNone(
            cache.get(cache_key),
            f"Cache should be populated before post creation for user {user_id}"
        )
        
        # Act: Create a post
        response = self.client.post(
            '/api/v1/community/post',
            data=json.dumps(post),
            content_type='application/json',
            headers={'X-Test-User-ID': user_id}
        )
        
        # Assert: Cache should be invalidated
        self.assertTrue(
            self._verify_cache_invalidated(user_id),
            f"Cache should be invalidated after post creation for user {user_id}. "
            f"Cache key: {cache_key}, Cached value: {cache.get(cache_key)}"
        )
        
        # Verify the response was successful (201 Created)
        self.assertIn(
            response.status_code,
            [200, 201],
            f"Post creation should succeed. Status: {response.status_code}, "
            f"Response: {response.get_json()}"
        )
    
    @given(user_id=user_ids(), post_id=post_ids())
    @settings(max_examples=50, deadline=10000)
    def test_cache_invalidation_on_like_action(self, user_id, post_id):
        """
        Property: Liking a post invalidates the user's community feed cache.
        
        For any user who likes content, the Cache_System SHALL remove
        that user's community feed cache entry.
        
        **Validates: Requirements 3.5**
        """
        # Arrange: Set up mock post
        mock_post_ref, mock_post_snapshot = self._setup_mock_post(post_id, "other_user", likes=5)
        
        # Mock the like reference
        mock_like_ref = MagicMock()
        mock_like_snapshot = MagicMock()
        mock_like_snapshot.exists = False  # User hasn't liked yet
        mock_like_ref.get.return_value = mock_like_snapshot
        
        # Mock transaction
        mock_transaction = MagicMock()
        mock_transaction.get.side_effect = [mock_post_snapshot, mock_like_snapshot]
        self.mock_db.transaction.return_value = mock_transaction
        
        # Populate cache with user's feed
        feed_data = [{"id": post_id, "dish_name": "Test Dish", "likes": 5}]
        cache_key = self._populate_cache_for_user(user_id, feed_data)
        
        # Verify cache is populated
        self.assertIsNotNone(
            cache.get(cache_key),
            f"Cache should be populated before like action for user {user_id}"
        )
        
        # Act: Like the post
        response = self.client.post(
            '/api/v1/community/like',
            data=json.dumps({"post_id": post_id}),
            content_type='application/json',
            headers={'X-Test-User-ID': user_id}
        )
        
        # Assert: Cache should be invalidated
        self.assertTrue(
            self._verify_cache_invalidated(user_id),
            f"Cache should be invalidated after like action for user {user_id}. "
            f"Cache key: {cache_key}, Cached value: {cache.get(cache_key)}"
        )
        
        # Verify the response was successful (200 OK)
        self.assertIn(
            response.status_code,
            [200, 201],
            f"Like action should succeed. Status: {response.status_code}, "
            f"Response: {response.get_json()}"
        )
    
    @given(user_id=user_ids(), post_id=post_ids())
    @settings(max_examples=50, deadline=10000)
    def test_cache_invalidation_on_unlike_action(self, user_id, post_id):
        """
        Property: Unliking a post invalidates the user's community feed cache.
        
        For any user who unlikes content, the Cache_System SHALL remove
        that user's community feed cache entry.
        
        **Validates: Requirements 3.5**
        """
        # Arrange: Set up mock post
        mock_post_ref, mock_post_snapshot = self._setup_mock_post(post_id, "other_user", likes=5)
        
        # Mock the like reference (user has already liked)
        mock_like_ref = MagicMock()
        mock_like_snapshot = MagicMock()
        mock_like_snapshot.exists = True  # User has already liked
        mock_like_ref.get.return_value = mock_like_snapshot
        
        # Mock transaction
        mock_transaction = MagicMock()
        mock_transaction.get.side_effect = [mock_post_snapshot, mock_like_snapshot]
        self.mock_db.transaction.return_value = mock_transaction
        
        # Populate cache with user's feed
        feed_data = [{"id": post_id, "dish_name": "Test Dish", "likes": 5, "is_liked": True}]
        cache_key = self._populate_cache_for_user(user_id, feed_data)
        
        # Verify cache is populated
        self.assertIsNotNone(
            cache.get(cache_key),
            f"Cache should be populated before unlike action for user {user_id}"
        )
        
        # Act: Unlike the post
        response = self.client.post(
            '/api/v1/community/like',
            data=json.dumps({"post_id": post_id}),
            content_type='application/json',
            headers={'X-Test-User-ID': user_id}
        )
        
        # Assert: Cache should be invalidated
        self.assertTrue(
            self._verify_cache_invalidated(user_id),
            f"Cache should be invalidated after unlike action for user {user_id}. "
            f"Cache key: {cache_key}, Cached value: {cache.get(cache_key)}"
        )
        
        # Verify the response was successful (200 OK)
        self.assertIn(
            response.status_code,
            [200, 201],
            f"Unlike action should succeed. Status: {response.status_code}, "
            f"Response: {response.get_json()}"
        )
    
    @given(user1=user_ids(), user2=user_ids(), post=post_data())
    @settings(max_examples=30, deadline=10000)
    def test_cache_invalidation_isolation_between_users(self, user1, user2, post):
        """
        Property: Cache invalidation is isolated between users.
        
        When user1 creates a post, only user1's cache should be invalidated,
        not user2's cache. This ensures proper user isolation.
        
        **Validates: Requirements 3.5**
        """
        # Ensure users are different
        assume(user1 != user2)
        
        # Arrange: Set up mock user
        self._setup_mock_user(user1, "User 1")
        
        # Mock the add operation
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "new_post_456"
        self.mock_db.collection.return_value.add.return_value = (None, mock_doc_ref)
        
        # Mock the user update operation
        self.mock_db.collection.return_value.document.return_value.update.return_value = None
        
        # Populate cache for both users
        feed_data_1 = [{"id": "post1", "dish_name": "User 1 Feed"}]
        feed_data_2 = [{"id": "post2", "dish_name": "User 2 Feed"}]
        
        cache_key_1 = self._populate_cache_for_user(user1, feed_data_1)
        cache_key_2 = self._populate_cache_for_user(user2, feed_data_2)
        
        # Verify both caches are populated
        self.assertIsNotNone(cache.get(cache_key_1), f"User1 cache should be populated")
        self.assertIsNotNone(cache.get(cache_key_2), f"User2 cache should be populated")
        
        # Act: User1 creates a post
        response = self.client.post(
            '/api/v1/community/post',
            data=json.dumps(post),
            content_type='application/json',
            headers={'X-Test-User-ID': user1}
        )
        
        # Assert: User1's cache should be invalidated
        self.assertTrue(
            self._verify_cache_invalidated(user1),
            f"User1's cache should be invalidated after post creation"
        )
        
        # Assert: User2's cache should NOT be invalidated
        self.assertIsNotNone(
            cache.get(cache_key_2),
            f"User2's cache should NOT be invalidated when User1 creates a post. "
            f"User1: {user1}, User2: {user2}"
        )
        
        # Verify the cached data for user2 is still intact
        user2_cached_data = cache.get(cache_key_2)
        self.assertEqual(
            user2_cached_data,
            feed_data_2,
            f"User2's cached data should remain unchanged"
        )
    
    @given(user_id=user_ids(), post1=post_data(), post2=post_data())
    @settings(max_examples=30, deadline=10000)
    def test_cache_invalidation_on_multiple_posts(self, user_id, post1, post2):
        """
        Property: Multiple post creations invalidate cache each time.
        
        When a user creates multiple posts, the cache should be invalidated
        after each post creation.
        
        **Validates: Requirements 3.5**
        """
        # Arrange: Set up mock user
        self._setup_mock_user(user_id, "Test User")
        
        # Mock the add operation
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "new_post_789"
        self.mock_db.collection.return_value.add.return_value = (None, mock_doc_ref)
        
        # Mock the user update operation
        self.mock_db.collection.return_value.document.return_value.update.return_value = None
        
        # Test first post creation
        feed_data = [{"id": "post1", "dish_name": "Test Dish"}]
        cache_key = self._populate_cache_for_user(user_id, feed_data)
        
        self.assertIsNotNone(cache.get(cache_key), "Cache should be populated before first post")
        
        # Create first post
        response1 = self.client.post(
            '/api/v1/community/post',
            data=json.dumps(post1),
            content_type='application/json',
            headers={'X-Test-User-ID': user_id}
        )
        
        self.assertTrue(
            self._verify_cache_invalidated(user_id),
            "Cache should be invalidated after first post creation"
        )
        
        # Re-populate cache
        self._populate_cache_for_user(user_id, feed_data)
        self.assertIsNotNone(cache.get(cache_key), "Cache should be populated before second post")
        
        # Create second post
        response2 = self.client.post(
            '/api/v1/community/post',
            data=json.dumps(post2),
            content_type='application/json',
            headers={'X-Test-User-ID': user_id}
        )
        
        self.assertTrue(
            self._verify_cache_invalidated(user_id),
            "Cache should be invalidated after second post creation"
        )
        
        # Verify both responses were successful
        self.assertIn(response1.status_code, [200, 201], "First post should succeed")
        self.assertIn(response2.status_code, [200, 201], "Second post should succeed")


if __name__ == '__main__':
    unittest.main()
