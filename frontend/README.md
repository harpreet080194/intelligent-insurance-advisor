# Intelligent Insurance Advisor - Frontend Application

A modern, responsive React application for the Intelligent Insurance Advisor platform built with TypeScript, Vite, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **User Authentication** - Secure login/register with MFA support
- **Policy Management** - View, compare, and manage insurance policies
- **Claims Processing** - Submit and track insurance claims with document upload
- **Payment Processing** - Secure payment handling with multiple payment methods
- **AI Chatbot** - Intelligent chat support for insurance queries
- **User Profile** - Manage personal information and preferences

### Technical Features
- **TypeScript** - Type-safe development
- **React 18** - Latest React features with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **React Hook Form** - Performant form handling
- **Zod** - Schema validation
- **React Hot Toast** - Beautiful notifications

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 or yarn >= 1.22.0
- Backend API running on http://localhost:5000

## 🛠️ Installation

### 1. Clone the repository (if not already done)
```bash
git clone <repository-url>
cd Intelligent\ Insurance\ Advisor/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Intelligent Insurance Advisor
VITE_APP_VERSION=1.0.0
```

### 4. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Layout.tsx    # Main layout with navigation
│   │   ├── ui/           # Base UI components
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Policies.tsx
│   │   ├── Claims.tsx
│   │   ├── Payments.tsx
│   │   ├── Chat.tsx
│   │   └── Profile.tsx
│   ├── services/         # API services
│   │   └── api.ts       # Axios instance and API calls
│   ├── store/           # State management
│   │   └── authStore.ts # Authentication state
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main app component with routing
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── postcss.config.js    # PostCSS configuration
```

## 🎨 Component Architecture

### Pages
All pages are located in `src/pages/` and follow a consistent structure:

- **Login/Register** - Authentication pages with form validation
- **Dashboard** - Overview of policies, claims, and recent activity
- **Policies** - List and manage insurance policies
- **PolicyDetails** - Detailed view of a specific policy
- **Claims** - View and manage insurance claims
- **ClaimDetails** - Detailed view of a specific claim
- **SubmitClaim** - Form to submit new claims with document upload
- **Payments** - Payment history and processing
- **Chat** - AI-powered chatbot interface
- **Profile** - User profile and settings

### Components
Reusable components in `src/components/`:

- **Layout** - Main application layout with header, navigation, and footer
- **ProtectedRoute** - Route wrapper for authenticated pages
- **PublicRoute** - Route wrapper for public pages (redirects if authenticated)

## 🔐 Authentication Flow

1. User enters credentials on Login page
2. If MFA is enabled, user is prompted for MFA code
3. On successful authentication:
   - JWT token is stored in localStorage
   - User data is stored in Zustand store
   - User is redirected to Dashboard
4. Token is automatically included in all API requests via Axios interceptor
5. On 401 response, user is logged out and redirected to Login

## 🌐 API Integration

The application communicates with the backend API through the `api.ts` service:

```typescript
import api from '@/services/api';

// Example usage
const policies = await api.getPolicies();
const claim = await api.submitClaim(formData);
```

### API Endpoints

**Authentication**
- POST `/auth/login` - User login
- POST `/auth/register` - User registration
- POST `/auth/logout` - User logout
- POST `/auth/mfa/verify` - MFA verification

**Policies**
- GET `/policies` - Get all policies
- GET `/policies/:id` - Get policy details
- GET `/policies/recommendations` - Get policy recommendations
- POST `/policies` - Create new policy
- PUT `/policies/:id` - Update policy
- POST `/policies/:id/cancel` - Cancel policy

**Claims**
- GET `/claims` - Get all claims
- GET `/claims/:id` - Get claim details
- POST `/claims` - Submit new claim
- PUT `/claims/:id` - Update claim
- POST `/claims/:id/documents` - Upload claim document

**Payments**
- GET `/payments` - Get payment history
- POST `/payments` - Process payment
- GET `/payments/methods` - Get payment methods

**Chat**
- POST `/chat/message` - Send chat message
- GET `/chat/history` - Get chat history
- POST `/chat/session` - Create chat session

## 🎯 State Management

The application uses Zustand for state management:

### Auth Store (`authStore.ts`)
```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();
```

State includes:
- `user` - Current user data
- `token` - JWT token
- `isAuthenticated` - Authentication status
- `isLoading` - Loading state
- `mfaRequired` - MFA requirement flag

Actions:
- `login(email, password)` - Authenticate user
- `register(data)` - Register new user
- `logout()` - Log out user
- `verifyMFA(code)` - Verify MFA code

## 🎨 Styling

The application uses Tailwind CSS for styling with custom configurations:

### Custom Colors
```javascript
primary: {
  50: '#eff6ff',
  100: '#dbeafe',
  // ... up to 900
}
```

### Utility Classes
- `.btn` - Base button styles
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-outline` - Outline button
- `.input` - Input field styles
- `.card` - Card container
- `.badge-*` - Status badges

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🏗️ Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The build output will be in the `dist/` directory.

## 📦 Deployment

### Environment Variables for Production
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Intelligent Insurance Advisor
VITE_APP_VERSION=1.0.0
```

### Build and Deploy
```bash
# Build the application
npm run build

# Deploy the dist/ folder to your hosting service
# (Vercel, Netlify, AWS S3, etc.)
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **MFA Support** - Multi-factor authentication
- **HTTPS Only** - All API calls over HTTPS in production
- **XSS Protection** - React's built-in XSS protection
- **CSRF Protection** - Token-based CSRF protection
- **Input Validation** - Zod schema validation
- **Secure Storage** - Sensitive data encrypted in localStorage

## 🌍 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow ESLint rules
- Use functional components with hooks
- Implement proper error handling
- Add loading states for async operations
- Use proper TypeScript types (avoid `any`)

### Component Guidelines
- Keep components small and focused
- Use composition over inheritance
- Implement proper prop types
- Add JSDoc comments for complex logic
- Use custom hooks for reusable logic

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature-name
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [React Router Documentation](https://reactrouter.com/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is part of the Intelligent Insurance Advisor platform.

## 👥 Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**