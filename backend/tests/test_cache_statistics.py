"""
Unit tests for cache statistics tracking functionality.

Tests cache hit/miss counters, hit rate calculation, and statistics retrieval.
"""

import pytest
from utils.cache_utils import (
    cache_stats,
    get_cache_statistics,
    reset_cache_statistics,
    record_cache_hit,
    record_cache_miss
)


class TestCacheStatistics:
    """Test suite for cache statistics tracking."""
    
    def setup_method(self):
        """Reset statistics before each test."""
        reset_cache_statistics()
    
    def test_initial_statistics_are_zero(self):
        """Test that initial statistics are all zero."""
        stats = get_cache_statistics()
        
        assert stats['global']['hits'] == 0
        assert stats['global']['misses'] == 0
        assert stats['global']['total_requests'] == 0
        assert stats['global']['hit_rate'] == 0.0
        assert stats['endpoints'] == {}
    
    def test_record_cache_hit_increments_counter(self):
        """Test that recording a cache hit increments the global counter."""
        record_cache_hit()
        
        stats = get_cache_statistics()
        assert stats['global']['hits'] == 1
        assert stats['global']['misses'] == 0
        assert stats['global']['total_requests'] == 1
    
    def test_record_cache_miss_increments_counter(self):
        """Test that recording a cache miss increments the global counter."""
        record_cache_miss()
        
        stats = get_cache_statistics()
        assert stats['global']['hits'] == 0
        assert stats['global']['misses'] == 1
        assert stats['global']['total_requests'] == 1
    
    def test_multiple_hits_and_misses(self):
        """Test recording multiple hits and misses."""
        # Record 7 hits and 3 misses
        for _ in range(7):
            record_cache_hit()
        for _ in range(3):
            record_cache_miss()
        
        stats = get_cache_statistics()
        assert stats['global']['hits'] == 7
        assert stats['global']['misses'] == 3
        assert stats['global']['total_requests'] == 10
    
    def test_hit_rate_calculation_with_hits_and_misses(self):
        """Test that hit rate is calculated correctly."""
        # Record 8 hits and 2 misses = 80% hit rate
        for _ in range(8):
            record_cache_hit()
        for _ in range(2):
            record_cache_miss()
        
        stats = get_cache_statistics()
        assert stats['global']['hit_rate'] == 80.0
    
    def test_hit_rate_calculation_with_only_hits(self):
        """Test hit rate calculation with 100% hits."""
        for _ in range(5):
            record_cache_hit()
        
        stats = get_cache_statistics()
        assert stats['global']['hit_rate'] == 100.0
    
    def test_hit_rate_calculation_with_only_misses(self):
        """Test hit rate calculation with 0% hits."""
        for _ in range(5):
            record_cache_miss()
        
        stats = get_cache_statistics()
        assert stats['global']['hit_rate'] == 0.0
    
    def test_hit_rate_calculation_with_no_requests(self):
        """Test hit rate calculation with no requests."""
        stats = get_cache_statistics()
        assert stats['global']['hit_rate'] == 0.0
    
    def test_endpoint_specific_statistics(self):
        """Test recording statistics for specific endpoints."""
        endpoint1 = '/api/v1/recipes/search'
        endpoint2 = '/api/v1/ai/suggest-recipes'
        
        # Record hits and misses for endpoint1
        record_cache_hit(endpoint1)
        record_cache_hit(endpoint1)
        record_cache_miss(endpoint1)
        
        # Record hits and misses for endpoint2
        record_cache_hit(endpoint2)
        record_cache_miss(endpoint2)
        record_cache_miss(endpoint2)
        
        stats = get_cache_statistics()
        
        # Check endpoint1 stats (2 hits, 1 miss = 66.67% hit rate)
        assert stats['endpoints'][endpoint1]['hits'] == 2
        assert stats['endpoints'][endpoint1]['misses'] == 1
        assert stats['endpoints'][endpoint1]['total_requests'] == 3
        assert stats['endpoints'][endpoint1]['hit_rate'] == 66.67
        
        # Check endpoint2 stats (1 hit, 2 misses = 33.33% hit rate)
        assert stats['endpoints'][endpoint2]['hits'] == 1
        assert stats['endpoints'][endpoint2]['misses'] == 2
        assert stats['endpoints'][endpoint2]['total_requests'] == 3
        assert stats['endpoints'][endpoint2]['hit_rate'] == 33.33
        
        # Check global stats (3 hits, 3 misses = 50% hit rate)
        assert stats['global']['hits'] == 3
        assert stats['global']['misses'] == 3
        assert stats['global']['total_requests'] == 6
        assert stats['global']['hit_rate'] == 50.0
    
    def test_get_statistics_for_specific_endpoint(self):
        """Test retrieving statistics for a specific endpoint."""
        endpoint = '/api/v1/recipes/search'
        
        record_cache_hit(endpoint)
        record_cache_hit(endpoint)
        record_cache_miss(endpoint)
        
        stats = get_cache_statistics(endpoint)
        
        assert stats['hits'] == 2
        assert stats['misses'] == 1
        assert stats['total_requests'] == 3
        assert stats['hit_rate'] == 66.67
    
    def test_get_statistics_for_nonexistent_endpoint(self):
        """Test retrieving statistics for an endpoint with no recorded data."""
        endpoint = '/api/v1/nonexistent'
        
        stats = get_cache_statistics(endpoint)
        
        assert stats['hits'] == 0
        assert stats['misses'] == 0
        assert stats['total_requests'] == 0
        assert stats['hit_rate'] == 0.0
    
    def test_reset_statistics(self):
        """Test that reset_cache_statistics clears all counters."""
        # Record some data
        record_cache_hit('/api/v1/recipes/search')
        record_cache_miss('/api/v1/ai/suggest-recipes')
        record_cache_hit()
        
        # Verify data exists
        stats = get_cache_statistics()
        assert stats['global']['total_requests'] > 0
        
        # Reset
        reset_cache_statistics()
        
        # Verify all counters are zero
        stats = get_cache_statistics()
        assert stats['global']['hits'] == 0
        assert stats['global']['misses'] == 0
        assert stats['global']['total_requests'] == 0
        assert stats['global']['hit_rate'] == 0.0
        assert stats['endpoints'] == {}
    
    def test_hit_rate_rounding(self):
        """Test that hit rate is rounded to 2 decimal places."""
        # Record 1 hit and 3 misses = 25% hit rate
        record_cache_hit()
        record_cache_miss()
        record_cache_miss()
        record_cache_miss()
        
        stats = get_cache_statistics()
        assert stats['global']['hit_rate'] == 25.0
        
        # Add more to create a non-round percentage
        # Total: 2 hits, 3 misses = 40% hit rate
        record_cache_hit()
        
        stats = get_cache_statistics()
        assert stats['global']['hit_rate'] == 40.0
        
        # Add one more miss to create a decimal percentage
        # Total: 2 hits, 4 misses = 33.333...% hit rate
        record_cache_miss()
        
        stats = get_cache_statistics()
        assert stats['global']['hit_rate'] == 33.33
    
    def test_thread_safety_simulation(self):
        """Test that statistics tracking handles concurrent updates."""
        import threading
        
        def record_hits():
            for _ in range(100):
                record_cache_hit()
        
        def record_misses():
            for _ in range(100):
                record_cache_miss()
        
        # Create threads
        threads = []
        for _ in range(5):
            threads.append(threading.Thread(target=record_hits))
            threads.append(threading.Thread(target=record_misses))
        
        # Start all threads
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Verify counts
        stats = get_cache_statistics()
        assert stats['global']['hits'] == 500  # 5 threads * 100 hits
        assert stats['global']['misses'] == 500  # 5 threads * 100 misses
        assert stats['global']['total_requests'] == 1000
        assert stats['global']['hit_rate'] == 50.0


class TestCacheStatisticsClass:
    """Test suite for CacheStatistics class directly."""
    
    def test_cache_statistics_initialization(self):
        """Test that CacheStatistics initializes with zero values."""
        stats_obj = cache_stats.__class__()
        
        global_stats = stats_obj.get_global_stats()
        assert global_stats['hits'] == 0
        assert global_stats['misses'] == 0
        assert global_stats['total_requests'] == 0
        assert global_stats['hit_rate'] == 0.0
    
    def test_endpoint_stats_initialization(self):
        """Test that endpoint stats are created on first access."""
        stats_obj = cache_stats.__class__()
        endpoint = '/api/v1/test'
        
        # Record hit for new endpoint
        stats_obj.record_hit(endpoint)
        
        endpoint_stats = stats_obj.get_endpoint_stats(endpoint)
        assert endpoint_stats['hits'] == 1
        assert endpoint_stats['misses'] == 0
