# Intelligent Insurance Advisor

A full-stack insurance management platform with AI-powered chatbot assistance and policy marketplace.

## Features

- 🔐 User Authentication (JWT)
- 🛒 **Policy Marketplace** - Browse & purchase 40+ insurance policies
- 📋 Policy Management (Health, Auto, Home, Life)
- 📝 Claims Processing
- 💳 Payment Tracking
- 🤖 AI Chatbot Assistant (with smart recommendations)
- 📊 Dashboard Analytics

## Tech Stack

**Frontend:** React + TypeScript + Vite + TailwindCSS  
**Backend:** Node.js + Express + TypeScript  
**Database:** SQLite (development)  
**AI:** OpenAI API (with intelligent mock fallback)

## Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

1. **Clone and navigate to project:**
```bash
cd "Intelligent Insurance Advisor"
```

2. **Setup Backend:**
```bash
cd backend
npm install
copy .env.example .env
# Edit .env if needed (default settings work fine)
npm run migrate
node seed-policies.js
node seed-available-policies.js
npm run dev
```
Backend runs on: http://localhost:5000

3. **Setup Frontend (new terminal):**
```bash
cd frontend
npm install
copy .env.example .env
# Edit .env if needed (default settings work fine)
npm run dev
```
Frontend runs on: http://localhost:5173

### Default Login

- **Email:** demo.user@insuranceadvisor.local
- **Password:** DemoUser@123

## 🎉 Policy Marketplace

The application includes a complete **Policy Marketplace** where customers can:
- Browse 40+ available insurance policies
- Purchase policies with demo card payment
- View purchased policies separately from available ones
- Get AI chatbot recommendations based on age, budget, and needs

### Marketplace Features

**43 Available Policies:**
- 13 Health policies (₹2,500 - ₹32,000/year)
- 10 Auto policies (₹1,500 - ₹48,000/year)  
- 10 Home policies (₹2,500 - ₹35,000/year)
- 10 Life policies (₹11,800 - ₹55,000/year)

**Smart Features:**
- Filter by type and price range
- Real-time search
- Popularity scoring
- Age eligibility validation
- One-click purchase with demo card
- Instant policy activation

### How to Use Marketplace

1. **Browse Policies:**
   - Go to Policies page
   - Click "Available Policies" tab
   - Use filters to narrow down options
   - Search by name or type

2. **Purchase a Policy:**
   - Click "Purchase Now" on any policy
   - Review details in modal
   - Use demo card: `4242 4242 4242 4242`
   - Any future date | Any CVV
   - Click "Confirm Purchase"
   - Policy activates immediately!

3. **Get AI Recommendations:**
   - Go to Chat page
   - Ask naturally: "I need health insurance for my family of 4"
   - Ask: "Which policy should I buy?"
   - Ask: "Show me affordable policies"
   - Ask: "What's the difference between individual and family floater?"
   - Ask: "How do I buy a policy?"
   - Ask: "How to file a claim?"
   - Chatbot understands natural language and provides personalized suggestions

4. **View Your Policies:**
   - Go to Policies page
   - "My Policies" tab shows purchased policies
   - Click any policy for details

5. **Track Payments:**
   - Go to Payments page
   - See all policy purchase payments
   - Filter by status or date

## Configuration

### Backend (.env)

Key settings in `backend/.env`:
- `PORT=5000` - Backend server port
- `USE_MOCK_AI=false` - Set to `true` to always use mock AI (no OpenAI API needed)
- `OPENAI_API_KEY` - Optional, only needed if using real OpenAI

### Frontend (.env)

Key settings in `frontend/.env`:
- `VITE_API_URL=http://localhost:5000/api/v1` - Backend API URL

## AI Chatbot

The chatbot has **intelligent natural language understanding** and **smart recommendations**:
- **Natural Language Processing** - Understands imperfect grammar and typos
- **Context-Aware** - Recognizes family size, age, budget from conversation
- **Smart Pattern Matching** - Handles questions like "how to buy an policy member 4 family"
- **Personalized Recommendations** - Based on existing coverage and needs
- **Comprehensive Responses** - Detailed guides for claims, purchases, coverage
- **Automatic Fallback** - Tries OpenAI API first, falls back to intelligent mock responses
- **No Manual Intervention** - Works seamlessly with or without OpenAI API

### Chatbot Capabilities

**Policy Recommendations:**
- "I need health insurance for my family of 4"
- "Which policy should I buy?"
- "Suggest me some policies to buy"
- "Show me affordable options"

**Comparisons & Information:**
- "What's the difference between individual and family floater?"
- "Compare health insurance plans"
- "What does health insurance cover?"

**Purchase Guidance:**
- "How do I buy a policy?"
- "How to purchase insurance for family?"
- "Steps to buy policy"

**Claims & Support:**
- "How to file a claim?"
- "How do I claim?"
- "What's my claim status?"

**Payments:**
- "When is my premium due?"
- "How to pay premium?"

### Using Mock AI (No OpenAI Required)

Set in `backend/.env`:
```
USE_MOCK_AI=true
```

### Using Real OpenAI

1. Get API key from https://platform.openai.com/api-keys
2. Update `backend/.env`:
```
OPENAI_API_KEY=your-key-here
USE_MOCK_AI=false
```
3. Restart backend

## Project Structure

```
Intelligent Insurance Advisor/
├── backend/              # Express API server
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, error handling
│   │   └── database/     # Migrations
│   ├── seed-policies.js  # Demo user policies
│   ├── seed-available-policies.js  # Marketplace policies
│   └── .env             # Backend config
├── frontend/            # React application
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API client
│   │   └── store/       # State management
│   └── .env            # Frontend config
└── README.md           # This file
```

## Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run migrate` - Run database migrations
- `npm run build` - Build for production
- `node seed-policies.js` - Seed demo user policies
- `node seed-available-policies.js` - Seed marketplace policies

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Policies (Marketplace)
- `GET /api/v1/policies/available` - Get all available policies (marketplace)
- `GET /api/v1/policies/available/:id` - Get policy template details
- `POST /api/v1/policies/purchase` - Purchase a policy
- `GET /api/v1/policies` - Get user's purchased policies
- `GET /api/v1/policies/:id` - Get purchased policy details

### Claims
- `GET /api/v1/claims` - Get user claims
- `POST /api/v1/claims` - Submit new claim
- `GET /api/v1/claims/:id` - Get claim details

### Payments
- `GET /api/v1/payments` - Get user payments
- `POST /api/v1/payments` - Process payment

### Chat
- `POST /api/v1/chat/sessions` - Create chat session
- `POST /api/v1/chat/sessions/:id/messages` - Send message
- `GET /api/v1/chat/sessions/:id` - Get chat history

## Database Schema

### available_policies Table (Marketplace)
```sql
- policy_template_id (UUID, Primary Key)
- name (Policy name)
- type (HEALTH, AUTO, HOME, LIFE)
- description (Policy description)
- base_premium (Annual premium in ₹)
- coverage_details (JSON)
- features (JSON array)
- eligibility_criteria (JSON)
- min_age, max_age (Age limits)
- min_sum_insured, max_sum_insured (Coverage limits)
- policy_term_years (Policy duration)
- provider_name (Insurance provider)
- is_active (Boolean)
- popularity_score (Integer - increases with purchases)
```

## Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Run `npm install` in backend directory
- Ensure `.env` file exists
- Run migrations: `npm run migrate`

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check `VITE_API_URL` in `frontend/.env`
- Restart frontend after .env changes

### Chatbot not working
- Check backend logs for errors
- Set `USE_MOCK_AI=true` in backend `.env` to bypass OpenAI
- Restart backend after changes

### Marketplace not showing policies
- Run seed script: `node seed-available-policies.js`
- Check backend console for errors
- Verify migration ran successfully
- Check database: `sqlite3 backend/dev.sqlite3 "SELECT COUNT(*) FROM available_policies;"`

### Purchase fails
- Verify user is logged in
- Check backend console for errors
- Ensure policy template exists
- Check age eligibility requirements
- Use demo card: `4111 1111 1111 1111`

### Migration fails
```bash
# Check if table exists
sqlite3 backend/dev.sqlite3 ".schema available_policies"

# If exists, drop and recreate
sqlite3 backend/dev.sqlite3 "DROP TABLE IF EXISTS available_policies;"
npm run migrate
```

## Testing Checklist

After setup, verify:
- [ ] Backend starts on port 5000
- [ ] Frontend starts on port 5173
- [ ] Can login with demo credentials
- [ ] Can see "Available Policies" tab
- [ ] Can browse 40+ policies
- [ ] Can filter and search policies
- [ ] Purchase modal opens correctly
- [ ] Can complete purchase with demo card
- [ ] Policy appears in "My Policies" tab
- [ ] Payment appears in Payments section
- [ ] Chatbot provides recommendations
- [ ] Chatbot responds to budget/age questions

## Demo Card Details

For testing purchases:
- **Card Number:** 4242 4242 4242 4242
- **Expiry:** Any future date (e.g., 12/25)
- **CVV:** Any 3 digits (e.g., 123)
- **Cardholder:** Any name

## Future Enhancements

Consider adding:
- [ ] Real payment gateway integration (Stripe/Razorpay)
- [ ] Policy comparison tool
- [ ] Customer reviews and ratings
- [ ] Discount codes and promotions
- [ ] Renewal reminders
- [ ] Policy documents download (PDF)
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Multi-language support
- [ ] Mobile app

## License

MIT

## Support

For issues or questions:
1. Check console logs (browser & backend)
2. Review troubleshooting section above
3. Verify all setup steps completed
4. Check database has data

---

**Made with Bob** 🤖