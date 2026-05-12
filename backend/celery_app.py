"""
Celery application configuration for asynchronous task processing.

This module configures Celery to use Redis as both the message broker and result backend.
It provides task status tracking integration with Firestore and handles graceful degradation
when Celery is unavailable.
"""

import os
from celery import Celery
from dotenv import load_dotenv
import logging

# Setup logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get Redis URL from environment
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', REDIS_URL)

# Create Celery application
celery_app = Celery(
    'appnauan',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=['tasks.ai_tasks']  # Auto-discover task modules
)

# Celery configuration
celery_app.conf.update(
    # Task execution settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task result settings
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,  # Store additional task metadata
    
    # Task routing and execution
    task_track_started=True,  # Track when tasks start
    task_time_limit=300,  # Hard time limit: 5 minutes
    task_soft_time_limit=240,  # Soft time limit: 4 minutes
    
    # Worker settings
    worker_prefetch_multiplier=4,  # Number of tasks to prefetch
    worker_max_tasks_per_child=1000,  # Restart worker after N tasks
    
    # Retry settings
    task_acks_late=True,  # Acknowledge tasks after completion
    task_reject_on_worker_lost=True,  # Reject tasks if worker dies
    
    # Broker settings
    broker_connection_retry_on_startup=True,
    broker_connection_retry=True,
    broker_connection_max_retries=10,
    
    # Result backend settings
    result_backend_transport_options={
        'master_name': 'mymaster',
        'visibility_timeout': 3600,
    }
)

# Task status constants
TASK_STATUS_PENDING = 'pending'
TASK_STATUS_STARTED = 'started'
TASK_STATUS_SUCCESS = 'success'
TASK_STATUS_FAILURE = 'failure'
TASK_STATUS_RETRY = 'retry'

logger.info(f"Celery configured with broker: {CELERY_BROKER_URL}")
logger.info(f"Celery configured with result backend: {CELERY_RESULT_BACKEND}")

# Helper function to check if Celery is available
def is_celery_available():
    """
    Check if Celery broker is available.
    
    Returns:
        bool: True if Celery broker is reachable, False otherwise
    """
    try:
        # Try to ping the broker
        celery_app.control.inspect().stats()
        return True
    except Exception as e:
        logger.warning(f"Celery broker unavailable: {str(e)}")
        return False

# Helper function to update task status in Firestore
def update_task_status_in_firestore(task_id, status, result=None, error=None):
    """
    Update task status in Firestore database.
    
    Args:
        task_id (str): Unique task identifier
        status (str): Task status (pending, started, success, failure)
        result (dict, optional): Task result data
        error (str, optional): Error message if task failed
    """
    try:
        from config import db
        from datetime import datetime
        
        if db is None:
            logger.warning("Firestore not available, skipping task status update")
            return
        
        task_data = {
            'task_id': task_id,
            'status': status,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        if result is not None:
            task_data['result'] = result
        
        if error is not None:
            task_data['error'] = error
        
        # Store in Firestore under 'tasks' collection
        db.collection('tasks').document(task_id).set(task_data, merge=True)
        logger.info(f"Task {task_id} status updated to {status} in Firestore")
        
    except Exception as e:
        logger.error(f"Failed to update task status in Firestore: {str(e)}")

# Celery task event handlers for Firestore integration
@celery_app.task(bind=True)
def base_task(self):
    """Base task class with Firestore status tracking."""
    pass

# Task started event
@celery_app.on_after_configure.connect
def setup_task_signals(sender, **kwargs):
    """Setup task event signals for Firestore integration."""
    from celery.signals import task_prerun, task_postrun, task_failure
    
    @task_prerun.connect
    def task_prerun_handler(task_id=None, task=None, **kwargs):
        """Handle task start event."""
        update_task_status_in_firestore(task_id, TASK_STATUS_STARTED)
    
    @task_postrun.connect
    def task_postrun_handler(task_id=None, task=None, retval=None, **kwargs):
        """Handle task completion event."""
        update_task_status_in_firestore(
            task_id, 
            TASK_STATUS_SUCCESS, 
            result=retval if isinstance(retval, dict) else {'data': retval}
        )
    
    @task_failure.connect
    def task_failure_handler(task_id=None, exception=None, **kwargs):
        """Handle task failure event."""
        update_task_status_in_firestore(
            task_id, 
            TASK_STATUS_FAILURE, 
            error=str(exception)
        )

if __name__ == '__main__':
    # Start Celery worker
    celery_app.start()
