from typing import Dict, Any
from services.laravel_client import LaravelClient


WALLET_FUNCTIONS = [
    {
        "name": "get_wallet_balance",
        "description": "Get the current USD wallet balance for the user. Note: TransferHub only supports USD wallets.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
]

async def execute_wallet_function(
    function_name: str,
    arguments: Dict[str, Any],
    laravel_client: LaravelClient
) -> Dict[str, Any]:
    """Execute wallet-related functions"""

    if function_name == "get_wallet_balance":
        return await laravel_client.get_wallet_balance()

    else:
        return {"error": f"Unknown wallet function: {function_name}"}
