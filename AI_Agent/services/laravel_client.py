import httpx
from typing import Dict, Any, Optional
from config import settings

class LaravelClient:
    """Client for making requests to Laravel API"""

    def __init__(self, user_token: str):
        self.base_url = settings.LARAVEL_API_URL
        self.headers = {
            "Authorization": user_token,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        print(f"[DEBUG] LaravelClient - Base URL: {self.base_url}")
        print(f"[DEBUG] LaravelClient - Auth token (first 30 chars): {user_token[:30]}...")

    async def get(self, endpoint: str, timeout: float = None) -> Dict[str, Any]:
        """Make GET request to Laravel API"""
        url = f"{self.base_url}{endpoint}"
        timeout_val = timeout if timeout else None  
        print(f"[DEBUG] GET {url} (timeout: {'unlimited' if not timeout_val else f'{timeout_val}s'})")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers,
                timeout=timeout_val
            )
            print(f"[DEBUG] Response status: {response.status_code}")
            response.raise_for_status()
            return response.json()

    async def post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Make POST request to Laravel API"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                json=data,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    # Wallet Operations
    async def get_wallet_balance(self) -> Dict[str, Any]:
        """Get user wallet balance"""
        try:
           
            response = await self.get("/wallet-simple")  
            print(f"[DEBUG] Wallet API Response: {response}")  
            return response
        except httpx.HTTPStatusError as e:
            error_msg = f"HTTP {e.response.status_code}: {e.response.text}"
            print(f"[ERROR] Wallet API HTTP Error: {error_msg}")
            return {"error": error_msg, "wallets": []}
        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            print(f"[ERROR] Wallet API Error: {error_msg}")
            return {"error": error_msg, "wallets": []}

    async def initiate_topup(self, amount: float, currency: str, wallet_id: Optional[str] = None) -> Dict[str, Any]:
        """Initiate wallet topup via Stripe"""
        try:
            data = {
                "amount": amount,
                "currency": currency
            }
            if wallet_id:
                data["wallet_id"] = wallet_id

            print(f"[DEBUG] Initiating topup with data: {data}")
            response = await self.post("/stripe/payment-intent", data)
            print(f"[DEBUG] Topup response: {response}")
            return response
        except Exception as e:
            print(f"[ERROR] Topup failed: {str(e)}")
            return {"error": str(e)}

    # Subscription Operations
    async def get_current_plan(self) -> Dict[str, Any]:
        """Get user's current subscription plan"""
        try:
            response = await self.get("/subscription/current")
            return response
        except Exception as e:
            return {"error": str(e), "plan": "Free"}

    # Transfer Operations
    async def get_transfer_history(self, limit: int = 5) -> Dict[str, Any]:
        """Get recent transfer history"""
        try:
            response = await self.get(f"/wallet/transactions?limit={limit}")
            return response
        except Exception as e:
            return {"error": str(e), "transactions": []}

    async def calculate_transfer_fee(self, amount: float, currency: str = "USD", speed_tier: str = "standard") -> Dict[str, Any]:
        """Calculate transfer fee"""
        try:
            data = {
                "amount": amount,
                "currency": currency,
                "speed_tier": speed_tier
            }
            # Note: Backend uses plural 'calculate-fees'
            response = await self.post("/transfers/calculate-fees", data)
            return response
        except Exception as e:
            return {"error": str(e)}

    
    async def get_exchange_rates(self, base_currency: str = "USD") -> Dict[str, Any]:
        """Get exchange rates"""
        try:
            response = await self.get(f"/exchange-rates?base={base_currency}")
            return response
        except Exception as e:
            return {"error": str(e), "rates": {}}

    
    async def find_agent_stores(self, city: Optional[str] = None) -> Dict[str, Any]:
        """Find agent stores"""
        try:
            endpoint = "/public/stores"
            if city:
                endpoint += f"?city={city}"
            response = await self.get(endpoint)
            return response
        except Exception as e:
            return {"error": str(e), "stores": []}

    # User Search
    async def search_users(self, query: str) -> Dict[str, Any]:
        """Search for users by email or name"""
        try:
            response = await self.get(f"/users/search?q={query}")
            return response
        except Exception as e:
            return {"error": str(e), "users": []}

    # Beneficiary Operations
    async def get_beneficiaries(self) -> Dict[str, Any]:
        """Get user's beneficiaries"""
        try:
            response = await self.get("/beneficiaries")
            return response
        except Exception as e:
            return {"error": str(e), "beneficiaries": []}

    async def add_beneficiary(self, beneficiary_user_id: str, payment_method: str, account_details: str) -> Dict[str, Any]:
        """Add an existing user as beneficiary"""
        try:
            data = {
                "beneficiary_user_id": beneficiary_user_id,
                "payment_method": payment_method,
                "account_details": account_details
            }
            response = await self.post("/beneficiaries", data)
            return response
        except Exception as e:
            return {"error": str(e)}

    # Transfer Operations
    async def create_transfer(self, beneficiary_id: str, amount: float, currency: str = "USD", speed_tier: str = "standard") -> Dict[str, Any]:
        """Create a new transfer to a beneficiary"""
        try:
            data = {
                "beneficiary_id": beneficiary_id,
                "amount": amount,
                "currency": currency,
                "speed_tier": speed_tier,
                "description": f"Transfer of ${amount} {currency}"
            }
            print(f"[DEBUG] Creating transfer with data: {data}")
            response = await self.post("/transfers", data)
            print(f"[DEBUG] Transfer response: {response}")
            return response
        except Exception as e:
            print(f"[ERROR] Transfer creation failed: {str(e)}")
            return {"error": str(e)}
