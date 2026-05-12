"""
Asynchronous task modules for background processing.

This package contains Celery task definitions for heavy operations including:
- AI ingredient scanning
- AI recipe suggestions
- AI meal analysis
- Image processing
- Database operations
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from celery_app import celery_app

__all__ = ['celery_app']
