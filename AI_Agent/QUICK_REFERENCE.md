# TransferHub AI Agent - Quick Reference

##  Quick Start (3 Steps)

### 1. Start FastAPI
```bash
cd AI_Agent
venv\Scripts\activate
python main.py
```
✅ Running on http://localhost:8001

### 2. Start Laravel
```bash
cd backend
php artisan serve
```
✅ Running on http://localhost:8000

### 3. Start Frontend
```bash
cd frontend
npm run dev
```
✅ Running on http://localhost:8080

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `AI_Agent/main.py` | FastAPI entry point |
| `AI_Agent/services/openai_service.py` | GPT-4 integration |
| `AI_Agent/tools/wallet_tools.py` | Wallet functions |
| `AI_Agent/tools/transfer_tools.py` | Transfer functions |
| `AI_Agent/tools/plan_tools.py` | Subscription functions |
| `backend/app/Http/Controllers/Api/ChatController.php` | Laravel proxy |
| `backend/routes/api.php` | Added `/api/chat/*` routes |
| `frontend/src/services/chatService.ts` | Chat API client |
| `frontend/src/pages/Support.tsx` | Chat UI |

---

## 🔧 Configuration Files

### AI_Agent/.env
```env
OPENAI_API_KEY=sk-proj-5_4smhvDRO4L...
LARAVEL_API_URL=http://localhost:8000/api
FASTAPI_PORT=8001
```

### backend/.env
```env
AI_AGENT_URL=http://localhost:8001
```

---

## 🤖 AI Functions Available

### Wallet
- `get_wallet_balance()` - Check USD balance
- `initiate_wallet_topup(amount, currency)` - Add funds via Stripe

### Transfers
- `get_transfer_history(limit)` - Recent transactions
- `calculate_transfer_fee(from, to, amount)` - Fee calculator
- `get_exchange_rates(base)` - Current rates

### Plans
- `get_current_plan()` - User's active plan
- `list_subscription_plans()` - All plans
- `compare_plans(monthly_transfers)` - Recommendations

---

## 💬 Example Conversations

| User Message | AI Action |
|-------------|-----------|
| "Check my balance" | Calls `get_wallet_balance()` |
| "Add $100 to my wallet" | Calls `initiate_wallet_topup(100, USD)` |
| "Show me the plans" | Calls `list_subscription_plans()` |
| "Cost to send $500 to EUR?" | Calls `calculate_transfer_fee()` |
| "My recent transfers" | Calls `get_transfer_history(5)` |

---

## 💰 Subscription Plans (USD Only)

| Plan | Price | Limit | Transfer Fee | Express Fee |
|------|-------|-------|--------------|-------------|
| Personal | $0 | $5,000 | $4.99 | $9.99 |
| Business | $29 | $50,000 | $2.99 | $4.99 |
| Enterprise | $100 | Unlimited | $0.00 | $0.00 |

---

## 🌐 API Endpoints

### Frontend → Laravel
```
POST /api/chat/send        (Send message)
GET  /api/chat/health      (Health check)
```

### Laravel → FastAPI
```
POST /chat/message         (Process AI message)
GET  /chat/health          (Agent health)
GET  /docs                 (API documentation)
```

### FastAPI → Laravel
```
GET  /api/wallet/balance
POST /api/stripe/payment-intent
GET  /api/subscription/current
GET  /api/wallet/transactions
POST /api/transfers/calculate-fee
GET  /api/exchange-rates
```

---

## 🔍 Health Checks

```bash
# FastAPI
curl http://localhost:8001/health

# Laravel API
curl http://localhost:8000/api/chat/health \
  -H "Authorization: Bearer YOUR_TOKEN"

# Frontend
Open http://localhost:8080 in browser
```

---

## 🐛 Troubleshooting

### AI Agent not responding
```bash
# 1. Check FastAPI is running
curl http://localhost:8001/health

# 2. Check environment variables
cd AI_Agent && cat .env

# 3. Check logs in terminal
```

### Authentication errors
```bash
# 1. Check user is logged in
# 2. Check Laravel is running
curl http://localhost:8000/api/user \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Clear cache
cd backend && php artisan cache:clear
```

### Chat history not saving
```javascript
// Open browser console (F12)
// Check localStorage
localStorage.getItem('transferhub_chat_history_YOUR_USER_ID')

// Clear and retry
localStorage.clear()
```

---

## 📦 Dependencies

### Python (AI_Agent)
```
fastapi==0.115.0
uvicorn==0.32.0
openai==1.54.0
python-dotenv==1.0.1
pydantic==2.9.2
httpx==0.27.2
```

### PHP (Backend)
```
laravel/framework: ^10.10
laravel/sanctum: ^3.2
```

### Node.js (Frontend)
```
react: 18.3.1
typescript: 5.6.3
vite: 7.2.2
```

---

## 🎯 Key Features

- ✅ USD-only wallet system
- ✅ International transfers with conversion
- ✅ Real-time exchange rates
- ✅ 3 subscription tiers
- ✅ Stripe payment integration
- ✅ GPT-4 powered responses
- ✅ Function calling for dynamic data
- ✅ localStorage chat history
- ✅ Secure authentication

---

## 📞 Support

- **Documentation:** `AI_AGENT_DOCUMENTATION.md`
- **Setup Guide:** `STARTUP_GUIDE.md`
- **Implementation:** `IMPLEMENTATION_SUMMARY.md`
- **API Docs:** http://localhost:8001/docs

---

## ⚡ Pro Tips

1. **Keep all 3 terminals open** when testing
2. **Watch the logs** to see what's happening
3. **Use /docs** for interactive API testing
4. **Clear chat** with the button in UI
5. **Check health endpoints** if issues occur
6. **Use correct plan names:** Personal, Business, Enterprise

---

**Quick Links:**
- Frontend: http://localhost:8080/support
- Laravel: http://localhost:8000/api/chat/health
- FastAPI: http://localhost:8001/docs
- GitHub: Your repo URL here

---

**Version:** 1.0.0 | **Updated:** 2024-01-22
