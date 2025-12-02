from typing import Dict, Any
from services.laravel_client import LaravelClient


SUBSCRIPTION_PLANS = [
    {
        "name": "Personal",
        "display_name": "Free",
        "price": 0,
        "currency": "USD",
        "monthly_limit": 5000.00, 
        "transfer_fee": 4.99,
        "express_fee": 9.99,
        "features": [
            "$5,000 monthly transfer limit",
            "$4.99 transfer fee per transaction",
            "$9.99 express speed fee",
            "Standard exchange rates",
            "Email support",
            "Basic transfer tracking"
        ]
    },
    {
        "name": "Business",
        "display_name": "Business",
        "price": 29.00,
        "currency": "USD",
        "monthly_limit": 50000.00,  
        "transfer_fee": 2.99,
        "express_fee": 4.99,
        "features": [
            "$50,000 monthly transfer limit",
            "$2.99 transfer fee per transaction (40% savings)",
            "$4.99 express speed fee (50% savings)",
            "Better exchange rates",
            "Priority email support",
            "Advanced transfer tracking",
            "Multiple beneficiaries"
        ]
    },
    {
        "name": "Enterprise",
        "display_name": "Enterprise",
        "price": 100.00,
        "currency": "USD",
        "monthly_limit": None,  # Unlimited
        "transfer_fee": 0.00,
        "express_fee": 0.00,
        "features": [
            "Unlimited monthly transfers",
            "$0.00 transfer fee (FREE transfers)",
            "$0.00 express speed fee (FREE express)",
            "Best exchange rates",
            "24/7 priority support",
            "Real-time transfer tracking",
            "Unlimited beneficiaries",
            "Instant transfers included",
            "No monthly limits",
            "Dedicated account manager"
        ]
    }
]

# Function definitions for OpenAI
PLAN_FUNCTIONS = [
    {
        "name": "get_current_plan",
        "description": "Get the user's current subscription plan details",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "list_subscription_plans",
        "description": "List all available subscription plans with pricing, features, and benefits",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "compare_plans",
        "description": "Compare subscription plans to help user choose the best one based on their needs",
        "parameters": {
            "type": "object",
            "properties": {
                "monthly_transfers": {
                    "type": "integer",
                    "description": "Estimated number of transfers per month",
                    "default": 5
                }
            },
            "required": []
        }
    }
]

async def execute_plan_function(
    function_name: str,
    arguments: Dict[str, Any],
    laravel_client: LaravelClient
) -> Dict[str, Any]:
    """Execute plan-related functions"""

    if function_name == "get_current_plan":
        return await laravel_client.get_current_plan()

    elif function_name == "list_subscription_plans":
        return {"plans": SUBSCRIPTION_PLANS}

    elif function_name == "compare_plans":
        monthly_transfers = arguments.get("monthly_transfers", 5)

        # Calculate cost for each plan
        comparisons = []
        for plan in SUBSCRIPTION_PLANS:
            monthly_cost = plan["price"]
            transfers_included = plan["monthly_limit"] or 999

            if monthly_transfers <= transfers_included:
                estimated_fees = monthly_transfers * plan["transfer_fee"]
                total_cost = monthly_cost + estimated_fees
            else:
                # Transfers exceed limit (only for Free/Standard)
                estimated_fees = transfers_included * plan["transfer_fee"]
                total_cost = monthly_cost + estimated_fees

            comparisons.append({
                "plan": plan["name"],
                "monthly_fee": monthly_cost,
                "transfer_fee": plan["transfer_fee"],
                "estimated_total": round(total_cost, 2),
                "best_for": _get_best_for(plan["name"], monthly_transfers)
            })

        # Sort by total cost
        comparisons.sort(key=lambda x: x["estimated_total"])

        return {
            "monthly_transfers": monthly_transfers,
            "comparisons": comparisons,
            "recommendation": comparisons[0]["plan"]
        }

    else:
        return {"error": f"Unknown plan function: {function_name}"}

def _get_best_for(plan_name: str, monthly_transfers: int) -> str:
    """Get recommendation text for plan"""
    if plan_name == "Personal":
        return "Up to $5,000/month in transfers, casual users, personal remittances"
    elif plan_name == "Business":
        return "Up to $50,000/month in transfers, regular users, small businesses"
    else:  # Enterprise
        return "Unlimited transfers, frequent users, large businesses, enterprises"
