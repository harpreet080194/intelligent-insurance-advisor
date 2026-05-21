import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Policies from '@/pages/Policies';
import PolicyDetails from '@/pages/PolicyDetails';
import Claims from '@/pages/Claims';
import ClaimDetails from '@/pages/ClaimDetails';
import SubmitClaim from '@/pages/SubmitClaim';
import Payments from '@/pages/Payments';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="policies" element={<Policies />} />
        <Route path="policies/:policyId" element={<PolicyDetails />} />
        <Route path="claims" element={<Claims />} />
        <Route path="claims/new" element={<SubmitClaim />} />
        <Route path="claims/:claimId" element={<ClaimDetails />} />
        <Route path="payments" element={<Payments />} />
        <Route path="chat" element={<Chat />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

// Made with Bob
