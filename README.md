# Intelligent Insurance Advisor

A full-stack insurance management platform with AI-powered chatbot assistance.

## Features

- 🔐 User Authentication (JWT)
- 📋 Policy Management (Health, Auto, Home, Life)
- 📝 Claims Processing
- 💳 Payment Tracking
- 🤖 AI Chatbot Assistant (with automatic fallback)
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

The chatbot has **automatic intelligent fallback**:
- Tries OpenAI API first (if configured)
- Automatically falls back to mock responses on any error
- Mock responses are context-aware and use your actual policy/claim data
- No manual intervention needed

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

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Policies
- `GET /api/v1/policies` - Get user policies
- `GET /api/v1/policies/:id` - Get policy details

### Claims
- `GET /api/v1/claims` - Get user claims
- `POST /api/v1/claims` - Submit new claim
- `GET /api/v1/claims/:id` - Get claim details

### Chat
- `POST /api/v1/chat/sessions` - Create chat session
- `POST /api/v1/chat/sessions/:id/messages` - Send message
- `GET /api/v1/chat/sessions/:id` - Get chat history

## Troubleshooting

### Backend won't start
- Check if port 5000 is available
- Run `npm install` in backend directory
- Ensure `.env` file exists

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check `VITE_API_URL` in `frontend/.env`
- Restart frontend after .env changes

### Chatbot not working
- Check backend logs for errors
- Set `USE_MOCK_AI=true` in backend `.env` to bypass OpenAI
- Restart backend after changes

## License

MIT

## Support

For issues or questions, please check the troubleshooting section above.