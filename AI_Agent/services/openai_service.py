import json
from typing import List, Dict, Any
from openai import AsyncOpenAI
from config import settings
from models.schemas import ChatRequest, ChatResponse, FunctionCall, UserContext
from services.laravel_client import LaravelClient
from tools.wallet_tools import WALLET_FUNCTIONS, execute_wallet_function
from tools.transfer_tools import TRANSFER_FUNCTIONS, execute_transfer_function
from tools.plan_tools import PLAN_FUNCTIONS, execute_plan_function

class OpenAIService:
    """Service for handling OpenAI agent interactions"""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

        # Combine all function definitions
        self.functions = WALLET_FUNCTIONS + TRANSFER_FUNCTIONS + PLAN_FUNCTIONS

    def _get_system_prompt(self, user_context: UserContext) -> str:
        """Generate system prompt with user context"""
        return f"""You are a helpful AI assistant for TransferHub, a money transfer platform.
You help users with their accounts, transfers, subscriptions, and general questions.

Current user information:
- Name: {user_context.name}
- Email: {user_context.email}
- Current Plan: {user_context.plan}

Platform Features:
- Wallet system (USD only - all balances and deposits are in US Dollars)
- Money transfers (USD only - all transfers are in US Dollars)
- Agent cash pickup locations
- Three subscription tiers: Personal, Business, Enterprise
- Stripe-powered secure payments
- All pricing and fees are in USD

IMPORTANT: All transactions on TransferHub are in USD ONLY. NEVER ask users about currency or exchange rates for transfers.

Subscription Plans (All prices in USD):
1. PERSONAL PLAN (Free - $0/month):
   - Monthly Limit: $5,000
   - Transfer Fee: $4.99 per transaction
   - Express Speed Fee: $9.99
   - Standard exchange rates
   - Email support
   - Basic transfer tracking

2. BUSINESS PLAN ($29/month):
   - Monthly Limit: $50,000
   - Transfer Fee: $2.99 per transaction (40% savings)
   - Express Speed Fee: $4.99 (50% savings)
   - Better exchange rates
   - Priority email support
   - Advanced transfer tracking
   - Multiple beneficiaries

3. ENTERPRISE PLAN ($100/month):
   - Monthly Limit: UNLIMITED
   - Transfer Fee: $0.00 (FREE transfers)
   - Express Speed Fee: $0.00 (FREE express)
   - Best exchange rates
   - 24/7 priority support
   - Real-time transfer tracking
   - Unlimited beneficiaries
   - Instant transfers included
   - Dedicated account manager

Your capabilities:
- Check wallet balances (returns array of wallets with balance, currency, formatted_balance)
- Search for users by email, phone number, or name
- View and manage beneficiaries (saved recipients)
- Add new beneficiaries (must be existing TransferHub users)
- View transfer history
- Calculate transfer fees and exchange rates
- Create money transfers to beneficiaries
- Provide plan information and comparisons
- Help with general platform questions

Guidelines:
- Be friendly, professional, and helpful
- Provide clear, concise answers
- Use functions to fetch real data when needed
- When checking wallet balance, look for the 'wallets' array in the response
- If wallets array is empty or balance is 0, the user has no balance
- Display balance with currency symbol (e.g., "$187.55 USD")
- Suggest actions the user can take
- When initiating payments, explain the process clearly
- Compare plans based on user needs
- Always prioritize user security and privacy

Transfer Workflow (IMPORTANT - Follow this flow):
1. When user says "I want to send money" or "send money" WITHOUT specifying a recipient:
   a) IMMEDIATELY call get_beneficiaries() to fetch their saved beneficiaries
   b) If they have beneficiaries: Display the list with names, emails, and phone numbers
   c) Ask them to select a beneficiary from the list OR provide a new recipient's contact
   d) Once selected, ask for amount and proceed with transfer
   e) If they have NO beneficiaries: Ask for the recipient's email or phone number

2. When user mentions sending money to someone specific (by email, phone, or name):
   - FIRST: Use search_users() to find that person on TransferHub
   - If found: Check if they're already a beneficiary using get_beneficiaries()
   - If NOT a beneficiary: Ask for payment method and account details to add them
   - If already a beneficiary: Proceed with the transfer

3. When user wants to send money/transfer to an existing beneficiary:
   a) Ask for transfer amount if not provided
   b) Calculate fees using calculate_transfer_fee() to show total cost
   c) Confirm with user before creating transfer
   d) CRITICAL: Use create_transfer() with the ACTUAL "id" field from the beneficiary object (a UUID string like "f0631414-5997-4579-95fe-e77463f3bf60")
   e) NEVER use numbers like "1" or "2" as beneficiary_id - always use the UUID from the API response

4. If user wants to add a new beneficiary:
   - Ask for the recipient's email address or phone number
   - Use search_users() to find the user by email/phone
   - If found, ask for payment method (bank/wallet/cash) and account details
   - Use add_beneficiary() with the user_id, payment_method, and account_details
   - If not found, inform user the recipient needs to register on TransferHub first

If the user asks about wallet top-ups or adding money, inform them that top-ups must be done through the Wallet page on the website for security reasons. The chatbot can help with checking balance and making transfers, but not with adding funds.

If the user asks about features not in your capabilities, politely explain what you can help with and suggest contacting support for additional assistance.
"""

    async def process_message(self, request: ChatRequest) -> ChatResponse:
        """Process user message and generate response"""

        # Create Laravel client with user token
        laravel_client = LaravelClient(request.user_token)

        # Initialize conversation with system prompt
        messages = [
            {"role": "system", "content": self._get_system_prompt(request.user_context)}
        ]

        # Add conversation history (exclude system messages and function calls from history)
        for msg in request.conversation_history:
            if msg.role in ["user", "assistant"]:
                messages.append({"role": msg.role, "content": msg.content})

        # Add current user message
        messages.append({"role": "user", "content": request.message})

        function_calls_made = []
        max_iterations = 5  # Prevent infinite loops

        for iteration in range(max_iterations):
            # Call OpenAI with functions
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                functions=self.functions,
                function_call="auto",
                temperature=settings.TEMPERATURE,
                max_tokens=settings.MAX_TOKENS
            )

            message = response.choices[0].message

            # If no function call, return the response
            if not message.function_call:
                return ChatResponse(
                    response=message.content or "I apologize, but I couldn't generate a response.",
                    function_calls=function_calls_made,
                    metadata={"iterations": iteration + 1}
                )

            # Execute function call
            function_name = message.function_call.name
            function_args = json.loads(message.function_call.arguments)

            # Execute the appropriate function
            function_result = await self._execute_function(
                function_name,
                function_args,
                laravel_client
            )

            # Record function call
            function_calls_made.append(FunctionCall(
                name=function_name,
                arguments=function_args,
                result=function_result
            ))

            # Add function call and result to conversation
            messages.append({
                "role": "assistant",
                "content": None,
                "function_call": {
                    "name": function_name,
                    "arguments": message.function_call.arguments
                }
            })
            messages.append({
                "role": "function",
                "name": function_name,
                "content": json.dumps(function_result)
            })

        # Max iterations reached
        return ChatResponse(
            response="I apologize, but I encountered an issue processing your request. Please try again or contact support.",
            function_calls=function_calls_made,
            metadata={"iterations": max_iterations, "max_reached": True}
        )

    async def _execute_function(
        self,
        function_name: str,
        arguments: Dict[str, Any],
        laravel_client: LaravelClient
    ) -> Dict[str, Any]:
        """Execute a function based on its name"""

        # Wallet functions
        if function_name in ["get_wallet_balance", "initiate_wallet_topup"]:
            return await execute_wallet_function(function_name, arguments, laravel_client)

        # Transfer functions (includes beneficiaries and transfers)
        elif function_name in ["search_users", "get_transfer_history", "calculate_transfer_fee", "get_exchange_rates",
                                "get_beneficiaries", "add_beneficiary", "create_transfer"]:
            return await execute_transfer_function(function_name, arguments, laravel_client)

        # Plan functions
        elif function_name in ["get_current_plan", "list_subscription_plans", "compare_plans"]:
            return await execute_plan_function(function_name, arguments, laravel_client)

        else:
            return {"error": f"Unknown function: {function_name}"}
