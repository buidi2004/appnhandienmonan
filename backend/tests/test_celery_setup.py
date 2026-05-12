"""
Unit tests for Celery task queue infrastructure.

Tests verify:
- Celery application configuration
- Task status tracking in Firestore
- Task enqueueing and execution
- Graceful degradation when Celery is unavailable
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from celery_app import (
    celery_app,
    is_celery_available,
    update_task_status_in_firestore,
    TASK_STATUS_PENDING,
    TASK_STATUS_STARTED,
    TASK_STATUS_SUCCESS,
    TASK_STATUS_FAILURE
)


class TestCelerySetup(unittest.TestCase):
    """Test Celery application configuration and setup."""
    
    def test_celery_app_exists(self):
        """Test that Celery app is properly initialized."""
        self.assertIsNotNone(celery_app)
        self.assertEqual(celery_app.main, 'appnauan')
    
    def test_celery_configuration(self):
        """Test that Celery is configured with correct settings."""
        self.assertEqual(celery_app.conf.task_serializer, 'json')
        self.assertEqual(celery_app.conf.accept_content, ['json'])
        self.assertEqual(celery_app.conf.result_serializer, 'json')
        self.assertTrue(celery_app.conf.task_track_started)
        self.assertEqual(celery_app.conf.result_expires, 3600)
    
    def test_celery_broker_configured(self):
        """Test that Celery broker URL is configured."""
        self.assertIsNotNone(celery_app.conf.broker_url)
        self.assertIn('redis://', celery_app.conf.broker_url)
    
    def test_celery_result_backend_configured(self):
        """Test that Celery result backend is configured."""
        self.assertIsNotNone(celery_app.conf.result_backend)
        self.assertIn('redis://', celery_app.conf.result_backend)
    
    @patch('celery_app.celery_app.control.inspect')
    def test_is_celery_available_when_available(self, mock_inspect):
        """Test is_celery_available returns True when broker is reachable."""
        mock_inspect.return_value.stats.return_value = {'worker1': {}}
        result = is_celery_available()
        self.assertTrue(result)
    
    @patch('celery_app.celery_app.control.inspect')
    def test_is_celery_available_when_unavailable(self, mock_inspect):
        """Test is_celery_available returns False when broker is unreachable."""
        mock_inspect.return_value.stats.side_effect = Exception("Connection refused")
        result = is_celery_available()
        self.assertFalse(result)


class TestTaskStatusTracking(unittest.TestCase):
    """Test task status tracking in Firestore."""
    
    @patch('celery_app.db')
    def test_update_task_status_pending(self, mock_db):
        """Test updating task status to pending in Firestore."""
        mock_collection = Mock()
        mock_document = Mock()
        mock_db.collection.return_value = mock_collection
        mock_collection.document.return_value = mock_document
        
        task_id = 'test-task-123'
        update_task_status_in_firestore(task_id, TASK_STATUS_PENDING)
        
        mock_db.collection.assert_called_once_with('tasks')
        mock_collection.document.assert_called_once_with(task_id)
        mock_document.set.assert_called_once()
        
        # Verify the data structure
        call_args = mock_document.set.call_args
        task_data = call_args[0][0]
        self.assertEqual(task_data['task_id'], task_id)
        self.assertEqual(task_data['status'], TASK_STATUS_PENDING)
        self.assertIn('updated_at', task_data)
    
    @patch('celery_app.db')
    def test_update_task_status_success_with_result(self, mock_db):
        """Test updating task status to success with result data."""
        mock_collection = Mock()
        mock_document = Mock()
        mock_db.collection.return_value = mock_collection
        mock_collection.document.return_value = mock_document
        
        task_id = 'test-task-456'
        result = {'data': 'test result', 'count': 42}
        update_task_status_in_firestore(task_id, TASK_STATUS_SUCCESS, result=result)
        
        call_args = mock_document.set.call_args
        task_data = call_args[0][0]
        self.assertEqual(task_data['status'], TASK_STATUS_SUCCESS)
        self.assertEqual(task_data['result'], result)
    
    @patch('celery_app.db')
    def test_update_task_status_failure_with_error(self, mock_db):
        """Test updating task status to failure with error message."""
        mock_collection = Mock()
        mock_document = Mock()
        mock_db.collection.return_value = mock_collection
        mock_collection.document.return_value = mock_document
        
        task_id = 'test-task-789'
        error = 'Task failed due to timeout'
        update_task_status_in_firestore(task_id, TASK_STATUS_FAILURE, error=error)
        
        call_args = mock_document.set.call_args
        task_data = call_args[0][0]
        self.assertEqual(task_data['status'], TASK_STATUS_FAILURE)
        self.assertEqual(task_data['error'], error)
    
    @patch('celery_app.db', None)
    def test_update_task_status_when_firestore_unavailable(self):
        """Test that task status update handles Firestore being unavailable."""
        # Should not raise exception when db is None
        try:
            update_task_status_in_firestore('test-task', TASK_STATUS_PENDING)
        except Exception as e:
            self.fail(f"update_task_status_in_firestore raised exception: {e}")
    
    @patch('celery_app.db')
    def test_update_task_status_handles_firestore_error(self, mock_db):
        """Test that task status update handles Firestore errors gracefully."""
        mock_db.collection.side_effect = Exception("Firestore error")
        
        # Should not raise exception
        try:
            update_task_status_in_firestore('test-task', TASK_STATUS_PENDING)
        except Exception as e:
            self.fail(f"update_task_status_in_firestore raised exception: {e}")


class TestTaskModule(unittest.TestCase):
    """Test task module imports and structure."""
    
    def test_ai_tasks_module_exists(self):
        """Test that ai_tasks module can be imported."""
        try:
            from tasks import ai_tasks
            self.assertIsNotNone(ai_tasks)
        except ImportError as e:
            self.fail(f"Failed to import ai_tasks module: {e}")
    
    def test_example_task_exists(self):
        """Test that example task is defined."""
        from tasks.ai_tasks import example_task
        self.assertIsNotNone(example_task)
        self.assertTrue(callable(example_task))


if __name__ == '__main__':
    unittest.main()
