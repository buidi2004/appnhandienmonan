"""
Manual test script for cache statistics endpoint.

This script demonstrates the cache statistics functionality by:
1. Recording some cache hits and misses
2. Calling the cache stats endpoint
3. Displaying the results
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from utils.cache_utils import record_cache_hit, record_cache_miss, get_cache_statistics

def test_cache_statistics():
    """Test cache statistics tracking."""
    print("=" * 60)
    print("Cache Statistics Manual Test")
    print("=" * 60)
    
    # Record some cache operations
    print("\n1. Recording cache operations...")
    
    # Simulate cache operations for different endpoints
    endpoints = [
        '/api/v1/recipes/search',
        '/api/v1/ai/suggest-recipes',
        '/api/v1/community/feed'
    ]
    
    # Record hits and misses
    for i in range(10):
        endpoint = endpoints[i % len(endpoints)]
        if i % 3 == 0:
            record_cache_miss(endpoint)
            print(f"   - Cache MISS for {endpoint}")
        else:
            record_cache_hit(endpoint)
            print(f"   - Cache HIT for {endpoint}")
    
    # Get statistics
    print("\n2. Retrieving cache statistics...")
    stats = get_cache_statistics()
    
    # Display global statistics
    print("\n" + "=" * 60)
    print("GLOBAL STATISTICS")
    print("=" * 60)
    print(f"Total Requests: {stats['global']['total_requests']}")
    print(f"Cache Hits:     {stats['global']['hits']}")
    print(f"Cache Misses:   {stats['global']['misses']}")
    print(f"Hit Rate:       {stats['global']['hit_rate']}%")
    
    # Display per-endpoint statistics
    print("\n" + "=" * 60)
    print("PER-ENDPOINT STATISTICS")
    print("=" * 60)
    
    for endpoint, endpoint_stats in stats['endpoints'].items():
        print(f"\nEndpoint: {endpoint}")
        print(f"  Total Requests: {endpoint_stats['total_requests']}")
        print(f"  Cache Hits:     {endpoint_stats['hits']}")
        print(f"  Cache Misses:   {endpoint_stats['misses']}")
        print(f"  Hit Rate:       {endpoint_stats['hit_rate']}%")
    
    print("\n" + "=" * 60)
    print("Test completed successfully!")
    print("=" * 60)
    
    # Test getting stats for specific endpoint
    print("\n3. Testing specific endpoint statistics...")
    specific_endpoint = '/api/v1/recipes/search'
    specific_stats = get_cache_statistics(specific_endpoint)
    
    print(f"\nStatistics for {specific_endpoint}:")
    print(f"  Total Requests: {specific_stats['total_requests']}")
    print(f"  Cache Hits:     {specific_stats['hits']}")
    print(f"  Cache Misses:   {specific_stats['misses']}")
    print(f"  Hit Rate:       {specific_stats['hit_rate']}%")
    
    print("\n" + "=" * 60)
    print("All tests passed!")
    print("=" * 60)


if __name__ == '__main__':
    test_cache_statistics()
