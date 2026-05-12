from datetime import datetime
from typing import Any, Dict, List
import re

class ValidationError(Exception):
    """Custom validation error."""
    pass

def validate_email(email: str) -> bool:
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise ValidationError("Invalid email format")
    return True

def validate_pantry_item(data: Dict[str, Any]) -> bool:
    """Validate pantry item data."""
    # Name validation
    name = data.get('name')
    if not name or not isinstance(name, str) or len(name.strip()) == 0:
        raise ValidationError("Name is required and must be a non-empty string")
    if len(name) > 100:
        raise ValidationError("Name must be less than 100 characters")
    
    # Quantity validation
    quantity = data.get('quantity')
    if quantity is None:
        raise ValidationError("Quantity is required")
    if not isinstance(quantity, (int, float)):
        raise ValidationError("Quantity must be a number")
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than 0")
    
    # Unit validation
    unit = data.get('unit')
    if not unit or not isinstance(unit, str):
        raise ValidationError("Unit is required and must be a string")
    
    valid_units = ['kg', 'g', 'l', 'ml', 'cái', 'quả', 'củ', 'gói', 'hộp', 'lon', 'chai', 'túi']
    if unit.lower() not in valid_units:
        raise ValidationError(f"Unit must be one of: {', '.join(valid_units)}")
    
    # Expiry date validation
    expiry_date = data.get('expiry_date')
    if expiry_date:
        try:
            datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            raise ValidationError("Invalid expiry date format. Use ISO 8601 format")
    
    return True

def validate_community_post(data: Dict[str, Any]) -> bool:
    """Validate community post data."""
    # Dish name
    dish_name = data.get('dish_name')
    if not dish_name or not isinstance(dish_name, str) or len(dish_name.strip()) == 0:
        raise ValidationError("Dish name is required")
    if len(dish_name) > 200:
        raise ValidationError("Dish name must be less than 200 characters")
    
    # Description
    description = data.get('description', '')
    if not isinstance(description, str):
        raise ValidationError("Description must be a string")
    if len(description) > 1000:
        raise ValidationError("Description must be less than 1000 characters")
    
    # Image URL
    image_url = data.get('image_url')
    if image_url and not isinstance(image_url, str):
        raise ValidationError("Image URL must be a string")
    if image_url and not image_url.startswith(('http://', 'https://')):
        raise ValidationError("Image URL must be a valid HTTP(S) URL")
    
    # Calories
    calories = data.get('calories', 0)
    if not isinstance(calories, (int, float)):
        raise ValidationError("Calories must be a number")
    if calories < 0 or calories > 10000:
        raise ValidationError("Calories must be between 0 and 10000")
    
    return True

def validate_ingredients_list(ingredients: List[str]) -> bool:
    """Validate ingredients list."""
    if not isinstance(ingredients, list):
        raise ValidationError("Ingredients must be a list")
    if len(ingredients) == 0:
        raise ValidationError("At least one ingredient is required")
    if len(ingredients) > 50:
        raise ValidationError("Maximum 50 ingredients allowed")
    
    for ingredient in ingredients:
        if not isinstance(ingredient, str):
            raise ValidationError("Each ingredient must be a string")
        if len(ingredient.strip()) == 0:
            raise ValidationError("Ingredient cannot be empty")
        if len(ingredient) > 100:
            raise ValidationError("Each ingredient must be less than 100 characters")
    
    return True

def sanitize_string(text: str, max_length: int = 1000) -> str:
    """Sanitize user input string."""
    if not isinstance(text, str):
        return ""
    # Remove control characters
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')
    # Trim whitespace
    text = text.strip()
    # Limit length
    return text[:max_length]
