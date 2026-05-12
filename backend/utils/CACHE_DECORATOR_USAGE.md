# Cache Decorator Usage Guide

## Overview

The `@cached_route` decorator provides automatic caching for Flask route handlers with configurable TTL, cache key generation, and response indicators.

## Basic Usage

### Simple Caching

```python
from flask import Blueprint, jsonify
from utils.cache_decorator import cached_route

bp = Blueprint('example', __name__)

@bp.route('/data', methods=['GET'])
@cached_route(ttl=300)  # Cache for 5 minutes
def get_data():
    # Expensive operation
    data = fetch_data_from_database()
    return jsonify({"success": True, "data": data})
```

### With Custom Key Prefix

```python
@bp.route('/recipes/search', methods=['GET'])
@cached_route(ttl=600, key_prefix="recipe_search")
def search_recipes():
    query = request.args.get('q')
    results = search_database(query)
    return jsonify({"success": True, "results": results})
```

### With User-Specific Caching

```python
from middleware.auth_middleware import token_required

@bp.route('/user/profile', methods=['GET'])
@token_required
@cached_route(ttl=300, include_user_id=True)
def get_user_profile(user_id):
    profile = fetch_user_profile(user_id)
    return jsonify({"success": True, "profile": profile})
```

### With Request Body in Cache Key

```python
@bp.route('/ai/suggest', methods=['POST'])
@token_required
@cached_route(ttl=1800, key_prefix="ai_suggest", include_body=True)
def suggest_recipes(user_id):
    data = request.get_json()
    ingredients = data.get('ingredients', [])
    suggestions = generate_suggestions(ingredients)
    return jsonify({"success": True, "suggestions": suggestions})
```

### With Cache Condition

```python
from utils.cache_decorator import cached_route, should_not_cache_sensitive_data

@bp.route('/auth/login', methods=['POST'])
@cached_route(
    ttl=300,
    cache_condition=should_not_cache_sensitive_data
)
def login():
    # Login logic
    return jsonify({"success": True, "token": "secret_token"})
    # This response will NOT be cached due to the token field
```

## Advanced Usage

### Custom Cache Condition

```python
def cache_only_successful_responses(response_data):
    """Only cache successful responses."""
    return response_data.get('success', False) == True

@bp.route('/api/data', methods=['GET'])
@cached_route(ttl=300, cache_condition=cache_only_successful_responses)
def get_api_data():
    try:
        data = fetch_data()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})
```

### Image-Based Caching

```python
from utils.cache_decorator import cache_key_with_image_hash
from config import cache

@bp.route('/ai/scan-ingredients', methods=['POST'])
@token_required
def scan_ingredients(user_id):
    file = request.files['image']
    image_data = file.read()
    
    # Generate cache key from image hash
    cache_key = cache_key_with_image_hash(image_data, prefix="scan_ingredients")
    
    # Check cache manually
    cached_result = cache.get(cache_key)
    if cached_result:
        return jsonify({"success": True, "data": cached_result, "cached": True})
    
    # Process image
    result = process_image(image_data)
    
    # Store in cache
    cache.set(cache_key, result, timeout=3600)
    
    return jsonify({"success": True, "data": result, "cached": False})
```

## Parameters

### `ttl` (int, default: 300)
Time-to-live for cached data in seconds.

**Examples:**
- `ttl=60` - 1 minute
- `ttl=300` - 5 minutes
- `ttl=1800` - 30 minutes
- `ttl=3600` - 1 hour
- `ttl=86400` - 24 hours

### `key_prefix` (str, optional)
Prefix added to generated cache keys for better organization.

**Examples:**
- `key_prefix="recipe_search"`
- `key_prefix="ai_suggest"`
- `key_prefix="user_profile"`

### `include_user_id` (bool, default: False)
Whether to include user_id in cache key generation for user-specific caching.

**Use when:**
- Data is personalized per user
- Different users should have separate cache entries

### `include_body` (bool, default: False)
Whether to include request body in cache key generation.

**Use when:**
- POST/PUT requests with JSON body
- Body parameters affect the response

### `cache_condition` (callable, optional)
Function to determine if response should be cached.

**Signature:**
```python
def cache_condition(response_data: dict) -> bool:
    # Return True to cache, False to skip
    pass
```

**Built-in conditions:**
- `should_not_cache_sensitive_data` - Prevents caching responses with tokens, passwords, API keys

## Response Format

All cached responses include a `"cached"` field:

```json
{
  "success": true,
  "data": "...",
  "cached": true  // true if from cache, false if fresh
}
```

## Cache Key Generation

Cache keys are automatically generated from:
1. HTTP method (GET, POST, etc.)
2. Request path
3. Query parameters (sorted for consistency)
4. User ID (if `include_user_id=True`)
5. Request body (if `include_body=True`)

The key is hashed using MD5 for consistency and uniqueness.

## Error Handling

The decorator handles errors gracefully:

- **Cache read failure**: Executes handler and returns fresh data
- **Cache write failure**: Returns fresh data without caching
- **Cache key generation failure**: Executes handler without caching

All failures are logged but do not affect the response to the client.

## Best Practices

1. **Choose appropriate TTL values:**
   - Short TTL (1-5 min) for frequently changing data
   - Medium TTL (10-30 min) for moderately stable data
   - Long TTL (1-24 hours) for rarely changing data

2. **Use key prefixes for organization:**
   - Makes cache debugging easier
   - Allows selective cache clearing

3. **Include user_id for personalized data:**
   - Prevents data leakage between users
   - Ensures correct data isolation

4. **Use cache conditions for sensitive data:**
   - Prevents caching of tokens, passwords, API keys
   - Ensures security compliance

5. **Monitor cache hit rates:**
   - Check logs for cache hit/miss patterns
   - Adjust TTL values based on hit rates

## Examples from Codebase

### AI Ingredient Scanning (1-hour TTL)
```python
@ai_bp.route('/scan-ingredients', methods=['POST'])
@token_required
@cached_route(ttl=3600, key_prefix="scan_ingredients", include_user_id=True)
def scan_ingredients(user_id):
    # Implementation
    pass
```

### Recipe Suggestions (30-minute TTL)
```python
@ai_bp.route('/suggest-recipes', methods=['POST'])
@token_required
@cached_route(ttl=1800, key_prefix="suggest_recipes", include_body=True)
def suggest_recipes(user_id):
    # Implementation
    pass
```

### Meal Analysis (24-hour TTL)
```python
@ai_bp.route('/analyze-meal', methods=['POST'])
@token_required
@cached_route(ttl=86400, key_prefix="analyze_meal", include_user_id=True)
def analyze_meal(user_id):
    # Implementation
    pass
```

## Testing

The decorator includes comprehensive unit tests in `tests/test_cache_decorator.py`:

```bash
# Run tests
python -m unittest tests.test_cache_decorator -v
```

## Requirements Validation

The cache decorator validates the following requirements:

- **Requirements 1.4**: Cache check and storage with TTL
- **Requirements 2.4**: Cached response indicator ("cached": true/false)
- **Requirements 12.1**: User-specific cache keys
- **Requirements 12.2**: No caching of sensitive responses
- **Requirements 13.2**: Cache read failure resilience
- **Requirements 13.3**: Cache write failure resilience
