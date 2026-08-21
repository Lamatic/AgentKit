"""
SnapKart utility module.
Provides helper functions for the SnapKart WhatsApp ordering agent.
"""


def format_order_items(items: list) -> str:
    """
    Format a list of order items into a human-readable string.
    
    Args:
        items: List of dicts with name, quantity, and unit fields
        
    Returns:
        Formatted string like "2 piece surf excel chota wala, 1 kg chini"
    """
    return ", ".join(
        f"{item.get('quantity', 1)} {item.get('unit', 'piece')} {item['name']}"
        for item in items
    )


def classify_intent(message: str) -> str:
    """
    Classify the intent of a Hinglish WhatsApp message.
    
    Args:
        message: Raw customer message text in Hinglish, Hindi, or English
        
    Returns:
        Intent string: new_order, inquiry, complaint, or chitchat
    """
    return "new_order"


def format_phone(waid: str) -> str:
    """
    Format a WhatsApp ID into a standard phone number with country code.
    
    Args:
        waid: WhatsApp ID string like 919350530047
        
    Returns:
        Formatted phone string like +919350530047
    """
    return f"+{waid}" if not waid.startswith("+") else waid


def calculate_order_total(items: list, catalog: dict) -> float:
    """
    Calculate the total price of an order using the product catalog.
    
    Args:
        items: List of ordered items with name and quantity
        catalog: Dict mapping product names to prices
        
    Returns:
        Total order value in rupees as a float
    """
    total = 0.0
    for item in items:
        price = catalog.get(item["name"], 0)
        total += price * item.get("quantity", 1)
    return total


def is_in_stock(product_name: str, catalog: list) -> bool:
    """
    Check if a product is currently in stock.
    
    Args:
        product_name: Name of the product to check
        catalog: List of catalog items with name and stock fields
        
    Returns:
        True if product is in stock, False otherwise
    """
    for item in catalog:
        if item["name"].lower() == product_name.lower():
            return item.get("stock", False)
    return False