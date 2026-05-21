import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import {
  FileText,
  ClipboardList,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ArrowRight,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalPolicies: number;
  activeClaims: number;
  pendingPayments: number;
  totalCoverage: number;
}

interface RecentActivity {
  id: string;
  type: 'policy' | 'claim' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalPolicies: 0,
    activeClaims: 0,
    pendingPayments: 0,
    totalCoverage: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all policies (don't filter by status to get total count)
      const policiesResponse = await api.getPolicies();
      console.log('Policies Response:', policiesResponse);
      console.log('Response data:', policiesResponse.data);
      
      // The response structure is { success: true, count: X, data: [...] }
      // So we need policiesResponse.data.data, not policiesResponse.data?.data
      const allPolicies = policiesResponse.data?.data || policiesResponse.data || [];
      console.log('All policies:', allPolicies);
      console.log('Policies count:', allPolicies.length);
      
      // Filter active policies
      const activePolicies = Array.isArray(allPolicies) ? allPolicies.filter((p: any) => p.status === 'ACTIVE') : [];
      console.log('Active policies:', activePolicies.length);
      
      // Fetch claims
      let claims: any[] = [];
      try {
        const claimsResponse = await api.getClaims({ status: 'SUBMITTED,UNDER_REVIEW' });
        claims = claimsResponse.data?.data || claimsResponse.data || [];
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          throw error;
        }
        console.warn('Claims endpoint unavailable, continuing without claims data');
      }
      
      // Fetch payments
      let payments: any[] = [];
      try {
        const paymentsResponse = await api.getPayments({ status: 'PENDING' });
        payments = paymentsResponse.data?.data || paymentsResponse.data || [];
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          throw error;
        }
        console.warn('Payments endpoint unavailable, continuing without payments data');
      }
      
      // Calculate stats - parse coverage if it's a JSON string
      const totalCoverage = activePolicies.reduce((sum: number, policy: any) => {
        let coverage = policy.coverage;
        // If coverage is a string, parse it
        if (typeof coverage === 'string') {
          try {
            coverage = JSON.parse(coverage);
          } catch (e) {
            coverage = {};
          }
        }
        return sum + (coverage?.coverageAmount || 0);
      }, 0);
      
      setStats({
        totalPolicies: activePolicies.length,
        activeClaims: claims.length,
        pendingPayments: payments.length,
        totalCoverage,
      });
      
      // Mock recent activity (in real app, this would come from API)
      setRecentActivity([
        {
          id: '1',
          type: 'claim',
          title: 'Claim Submitted',
          description: 'Medical claim for $2,500',
          timestamp: new Date().toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          type: 'payment',
          title: 'Payment Processed',
          description: 'Premium payment of $450',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
        },
        {
          id: '3',
          type: 'policy',
          title: 'Policy Renewed',
          description: 'Health Insurance Policy',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          status: 'active',
        },
      ]);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'policy':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'claim':
        return <ClipboardList className="w-5 h-5 text-orange-600" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge badge-warning',
      completed: 'badge badge-success',
      active: 'badge badge-success',
      rejected: 'badge badge-danger',
    };
    return badges[status] || 'badge badge-info';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.profile?.firstName || 'User'}!
        </h1>
        <p className="mt-2 text-primary-100">
          Here's an overview of your insurance portfolio
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Policies */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Policies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPolicies}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/policies"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View all policies
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Active Claims */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Claims</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeClaims}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/claims"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View all claims
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingPayments}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link
              to="/payments"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View payments
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Total Coverage */}
        <div className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Coverage</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.totalCoverage)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
              Fully protected
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/claims/new"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200">
              <Plus className="w-5 h-5 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Submit a Claim</p>
              <p className="text-sm text-gray-500">File a new insurance claim</p>
            </div>
          </Link>

          <Link
            to="/policies"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Browse Policies</p>
              <p className="text-sm text-gray-500">View and manage policies</p>
            </div>
          </Link>

          <Link
            to="/chat"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
              <AlertCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="font-medium text-gray-900">Get Help</p>
              <p className="text-sm text-gray-500">Chat with AI assistant</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all
          </button>
        </div>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    </div>
                    <span className={getStatusBadge(activity.status)}>
                      {activity.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips & Recommendations */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Save on Your Insurance
            </h3>
            <p className="text-gray-700 mt-1">
              Based on your profile, you could save up to 20% by bundling your policies.
              Check out our recommendations!
            </p>
            <Link
              to="/policies"
              className="inline-flex items-center mt-3 text-primary-600 hover:text-primary-700 font-medium"
            >
              View recommendations
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// Made with Bob
