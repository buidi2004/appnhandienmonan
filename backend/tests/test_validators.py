import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.validators import (
    validate_email,
    validate_pantry_item,
    validate_community_post,
    validate_ingredients_list,
    sanitize_string,
    ValidationError
)


class TestValidators(unittest.TestCase):
    """Test cases for validators."""
    
    def test_validate_email_valid(self):
        """Test valid email validation."""
        self.assertTrue(validate_email("test@example.com"))
        self.assertTrue(validate_email("user.name@domain.co.uk"))
    
    def test_validate_email_invalid(self):
        """Test invalid email validation."""
        with self.assertRaises(ValidationError):
            validate_email("invalid-email")
        with self.assertRaises(ValidationError):
            validate_email("@example.com")
        with self.assertRaises(ValidationError):
            validate_email("test@")
    
    def test_validate_pantry_item_valid(self):
        """Test valid pantry item validation."""
        valid_item = {
            "name": "Cà chua",
            "quantity": 5,
            "unit": "kg",
            "expiry_date": "2026-12-31T00:00:00"
        }
        self.assertTrue(validate_pantry_item(valid_item))
    
    def test_validate_pantry_item_invalid_name(self):
        """Test pantry item with invalid name."""
        invalid_item = {
            "name": "",
            "quantity": 5,
            "unit": "kg"
        }
        with self.assertRaises(ValidationError):
            validate_pantry_item(invalid_item)
    
    def test_validate_pantry_item_invalid_quantity(self):
        """Test pantry item with invalid quantity."""
        invalid_item = {
            "name": "Cà chua",
            "quantity": -5,
            "unit": "kg"
        }
        with self.assertRaises(ValidationError):
            validate_pantry_item(invalid_item)
    
    def test_validate_community_post_valid(self):
        """Test valid community post validation."""
        valid_post = {
            "dish_name": "Phở bò",
            "description": "Món phở truyền thống",
            "image_url": "https://example.com/image.jpg",
            "calories": 500
        }
        self.assertTrue(validate_community_post(valid_post))
    
    def test_validate_community_post_invalid_url(self):
        """Test community post with invalid URL."""
        invalid_post = {
            "dish_name": "Phở bò",
            "image_url": "not-a-url",
            "calories": 500
        }
        with self.assertRaises(ValidationError):
            validate_community_post(invalid_post)
    
    def test_validate_ingredients_list_valid(self):
        """Test valid ingredients list validation."""
        valid_list = ["Cà chua", "Thịt bò", "Hành tây"]
        self.assertTrue(validate_ingredients_list(valid_list))
    
    def test_validate_ingredients_list_empty(self):
        """Test empty ingredients list."""
        with self.assertRaises(ValidationError):
            validate_ingredients_list([])
    
    def test_validate_ingredients_list_too_many(self):
        """Test ingredients list with too many items."""
        too_many = ["Ingredient " + str(i) for i in range(51)]
        with self.assertRaises(ValidationError):
            validate_ingredients_list(too_many)
    
    def test_sanitize_string(self):
        """Test string sanitization."""
        # Normal string
        self.assertEqual(sanitize_string("Hello World"), "Hello World")
        
        # String with extra whitespace
        self.assertEqual(sanitize_string("  Hello  World  "), "Hello  World")
        
        # String exceeding max length
        long_string = "a" * 1500
        self.assertEqual(len(sanitize_string(long_string, 1000)), 1000)
        
        # Non-string input
        self.assertEqual(sanitize_string(123), "")
        self.assertEqual(sanitize_string(None), "")


if __name__ == '__main__':
    unittest.main()
