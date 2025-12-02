from typing import Dict, Any, Optional
from services.laravel_client import LaravelClient

# Function definitions for OpenAI
TRANSFER_FUNCTIONS = [
    {
        "name": "search_users",
        "description": "Search for TransferHub users by email, phone number, or name to find their user ID for adding as beneficiary",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query (email, phone number, or name)"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_transfer_history",
        "description": "Get the user's recent transfer history and transactions",
        "parameters": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of recent transfers to retrieve (default: 5, max: 20)",
                    "default": 5
                }
            },
            "required": []
        }
    },
    {
        "name": "calculate_transfer_fee",
        "description": "Calculate the transfer fee for sending money. Always use USD as currency since all TransferHub transactions are in USD.",
        "parameters": {
            "type": "object",
            "properties": {
                "amount": {
                    "type": "number",
                    "description": "Amount to transfer in USD"
                },
                "currency": {
                    "type": "string",
                    "description": "Currency code (always USD)",
                    "default": "USD"
                },
                "speed_tier": {
                    "type": "string",
                    "description": "Transfer speed: 'standard' (default) or 'express'",
                    "enum": ["standard", "express"],
                    "default": "standard"
                }
            },
            "required": ["amount"]
        }
    },
    {
        "name": "get_exchange_rates",
        "description": "Get current exchange rates for different currencies",
        "parameters": {
            "type": "object",
            "properties": {
                "base_currency": {
                    "type": "string",
                    "description": "Base currency code (default: USD)",
                    "default": "USD"
                }
            },
            "required": []
        }
    },
    {
        "name": "get_beneficiaries",
        "description": "Get list of user's saved beneficiaries/recipients for transfers",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "add_beneficiary",
        "description": "Add an existing TransferHub user as a beneficiary/recipient. The user must already be registered in the system.",
        "parameters": {
            "type": "object",
            "properties": {
                "beneficiary_user_id": {
                    "type": "string",
                    "description": "User ID of the existing TransferHub user to add as beneficiary"
                },
                "payment_method": {
                    "type": "string",
                    "description": "Payment method: 'bank', 'wallet', or 'cash'",
                    "enum": ["bank", "wallet", "cash"]
                },
                "account_details": {
                    "type": "string",
                    "description": "Account details for the payment method (e.g., bank account number, wallet ID, or cash pickup location)"
                }
            },
            "required": ["beneficiary_user_id", "payment_method", "account_details"]
        }
    },
    {
        "name": "create_transfer",
        "description": "Create a money transfer to a beneficiary. IMPORTANT: Always get beneficiaries list first and ask user to select one before creating transfer.",
        "parameters": {
            "type": "object",
            "properties": {
                "beneficiary_id": {
                    "type": "string",
                    "description": "The actual UUID 'id' field from the beneficiary object returned by get_beneficiaries() - NOT a number like '1' or '2'. Example: 'f0631414-5997-4579-95fe-e77463f3bf60'"
                },
                "amount": {
                    "type": "number",
                    "description": "Amount to transfer in USD"
                },
                "currency": {
                    "type": "string",
                    "description": "Currency code (default: USD)",
                    "default": "USD"
                },
                "speed_tier": {
                    "type": "string",
                    "description": "Transfer speed: 'standard' (default) or 'express' (faster but costs more)",
                    "enum": ["standard", "express"],
                    "default": "standard"
                }
            },
            "required": ["beneficiary_id", "amount"]
        }
    }
]

async def execute_transfer_function(
    function_name: str,
    arguments: Dict[str, Any],
    laravel_client: LaravelClient
) -> Dict[str, Any]:
    """Execute transfer-related functions"""

    if function_name == "search_users":
        query = arguments.get("query")
        return await laravel_client.search_users(query)

    elif function_name == "get_transfer_history":
        limit = arguments.get("limit", 5)
        return await laravel_client.get_transfer_history(limit)

    elif function_name == "calculate_transfer_fee":
        amount = arguments.get("amount")
        currency = arguments.get("currency", "USD")
        speed_tier = arguments.get("speed_tier", "standard")
        return await laravel_client.calculate_transfer_fee(amount, currency, speed_tier)

    elif function_name == "get_exchange_rates":
        base_currency = arguments.get("base_currency", "USD")
        return await laravel_client.get_exchange_rates(base_currency)

    elif function_name == "get_beneficiaries":
        return await laravel_client.get_beneficiaries()

    elif function_name == "add_beneficiary":
        beneficiary_user_id = arguments.get("beneficiary_user_id")
        payment_method = arguments.get("payment_method")
        account_details = arguments.get("account_details")
        return await laravel_client.add_beneficiary(beneficiary_user_id, payment_method, account_details)

    elif function_name == "create_transfer":
        beneficiary_id = arguments.get("beneficiary_id")
        amount = arguments.get("amount")
        currency = arguments.get("currency", "USD")
        speed_tier = arguments.get("speed_tier", "standard")
        return await laravel_client.create_transfer(beneficiary_id, amount, currency, speed_tier)

    else:
        return {"error": f"Unknown transfer function: {function_name}"}
