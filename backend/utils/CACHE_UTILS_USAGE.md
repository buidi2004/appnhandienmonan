# Cache Utilities Usage Guide

This document provides examples and best practices for using the cache utility functions in the Recipe App backend.

## Overview

The `cache_utils.py` module provides MD5-based cache key generation functions that ensure:
- **Consistency**: Identical parameters always produce the same cache key
- **Uniqueness**: Different parameters produce different cache keys
- **User Isolation**: User-specific data is cached separately per user
- **Order Independence**: Parameter order doesn't affect the cache key

## Functions

### 1. `generate_cache_key()`

Generate a cache key from individual request components.

**Parameters:**
- `method` (str): HTTP method (GET, POST, etc.)
- `path` (str): Request path
- `query_params` (dict, optional): Query parameters
- `user_id` (str, optional): User ID for user-specific caching
- `body_params` (dict, optional): Body parameters for POST/PUT requests

**Example:**
```python
from backend.utils import generate_cache_key

# Basic usage
key = generate_cache_key('GET', '/api/v1/recipes')

# With query parameters
key = generate_cache_key(
    'GET', 
    '/api/v1/recipes/search',
    query_params={'q': 'pasta', 'category': 'italian'}
)

# With user-specific caching
key = generate_cache_key(
    'GET',
    '/api/v1/recipes/recommendations',
    user_id='user123'
)

# With body parameters (POST request)
key = generate_cache_key(
    'POST',
    '/api/v1/recipes',
    body_params={'name': 'Pasta Recipe', 'servings': 4}
)
```

### 2. `generate_cache_key_from_request()`

Generate a cache key directly from a Flask Request object.

**Parameters:**
- `request` (Request): Flask Request object
- `user_id` (str, optional): User ID for user-specific caching
- `include_body` (bool): Whether to include request body (default: False)

**Example:**
```python
from flask import request
from backend.utils import generate_cache_key_from_request

@app.route('/api/v1/recipes')
def get_recipes():
    # Generate cache key from current request
    cache_key = generate_cache_key_from_request(request)
    
    # Check cache
    cached_data = cache.get(cache_key)
    if cached_data:
        return jsonify(cached_data)
    
    # Fetch data and cache it
    data = fetch_recipes()
    cache.set(cache_key, data, timeout=600)
    return jsonify(data)

@app.route('/api/v1/recipes', methods=['POST'])
def create_recipe():
    # Include body in cache key for POST requests
    user_id = get_current_user_id()
    cache_key = generate_cache_key_from_request(
        request,
        user_id=user_id,
        include_body=True
    )
    
    # ... rest of the logic
```

### 3. `generate_image_cache_key()`

Generate a cache key for image-based operations (scanning, analysis).

**Parameters:**
- `image_hash` (str): Hash of the image content
- `user_id` (str, optional): User ID for user-specific caching

**Example:**
```python
import hashlib
from backend.utils import generate_image_cache_key

@app.route('/api/v1/ai/scan-ingredients', methods=['POST'])
def scan_ingredients():
    # Get uploaded image
    image_file = request.files['image']
    image_bytes = image_file.read()
    
    # Generate image hash
    image_hash = hashlib.md5(image_bytes).hexdigest()
    
    # Generate cache key
    user_id = get_current_user_id()
    cache_key = generate_image_cache_key(image_hash, user_id)
    
    # Check cache
    cached_result = cache.get(cache_key)
    if cached_result:
        return jsonify({'result': cached_result, 'cached': True})
    
    # Process image and cache result
    result = ai_service.scan_ingredients(image_bytes)
    cache.set(cache_key, result, timeout=3600)  # 1 hour TTL
    return jsonify({'result': result, 'cached': False})
```

### 4. `generate_ai_suggestion_cache_key()`

Generate a cache key for AI recipe suggestion operations.

**Parameters:**
- `ingredients` (list): List of ingredient names or IDs
- `health_profile` (dict, optional): Health preferences and restrictions
- `pantry_context` (dict, optional): Pantry items and quantities
- `user_id` (str, optional): User ID for user-specific caching

**Example:**
```python
from backend.utils import generate_ai_suggestion_cache_key

@app.route('/api/v1/ai/suggest-recipes', methods=['POST'])
def suggest_recipes():
    data = request.get_json()
    
    ingredients = data.get('ingredients', [])
    health_profile = data.get('health_profile')
    pantry_context = data.get('pantry_context')
    user_id = get_current_user_id()
    
    # Generate cache key
    cache_key = generate_ai_suggestion_cache_key(
        ingredients=ingredients,
        health_profile=health_profile,
        pantry_context=pantry_context,
        user_id=user_id
    )
    
    # Check cache
    cached_suggestions = cache.get(cache_key)
    if cached_suggestions:
        return jsonify({'suggestions': cached_suggestions, 'cached': True})
    
    # Generate suggestions and cache
    suggestions = ai_service.suggest_recipes(
        ingredients,
        health_profile,
        pantry_context
    )
    cache.set(cache_key, suggestions, timeout=1800)  # 30 minutes TTL
    return jsonify({'suggestions': suggestions, 'cached': False})
```

## Best Practices

### 1. User-Specific Caching

Always include `user_id` when caching personalized data:

```python
# ✅ Good: User-specific cache key
cache_key = generate_cache_key(
    'GET',
    '/api/v1/recipes/recommendations',
    user_id=user_id
)

# ❌ Bad: Missing user_id for personalized data
cache_key = generate_cache_key(
    'GET',
    '/api/v1/recipes/recommendations'
)
```

### 2. Appropriate TTL Values

Use appropriate TTL (time-to-live) values based on data volatility:

```python
# Frequently changing data: 2-5 minutes
cache.set(cache_key, community_feed, timeout=120)

# Moderately stable data: 10-30 minutes
cache.set(cache_key, recipe_search_results, timeout=600)

# Stable data: 1-24 hours
cache.set(cache_key, ai_analysis_result, timeout=3600)
```

### 3. Cache Invalidation

Invalidate cache when data changes:

```python
@app.route('/api/v1/community/post', methods=['POST'])
def create_post():
    user_id = get_current_user_id()
    
    # Create post
    post = create_community_post(request.get_json())
    
    # Invalidate user's community feed cache
    feed_cache_key = generate_cache_key(
        'GET',
        '/api/v1/community/feed',
        user_id=user_id
    )
    cache.delete(feed_cache_key)
    
    return jsonify(post)
```

### 4. Include "cached" Field in Responses

Always indicate whether a response was served from cache:

```python
cached_data = cache.get(cache_key)
if cached_data:
    return jsonify({**cached_data, 'cached': True})
else:
    data = fetch_data()
    cache.set(cache_key, data, timeout=600)
    return jsonify({**data, 'cached': False})
```

## Testing

The cache utilities include comprehensive unit tests. Run them with:

```bash
python -m unittest backend.tests.test_cache_utils -v
```

## Requirements Validation

This implementation validates the following requirements:

- **Requirement 1.5**: MD5-based cache key generation from request parameters
- **Requirement 12.1**: User-specific cache keys for personalized data
- **Requirement 2.1**: Image-based caching for ingredient scanning
- **Requirement 2.2**: AI suggestion caching with ingredients and health profile
- **Requirement 2.3**: Image-based caching for meal analysis

## Related Files

- `backend/utils/cache_utils.py` - Implementation
- `backend/tests/test_cache_utils.py` - Unit tests
- `backend/config.py` - Redis and cache configuration
