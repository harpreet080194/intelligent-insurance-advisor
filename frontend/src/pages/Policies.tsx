import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { FileText, Plus, Search, Filter, ShoppingCart, X, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { Policy } from '@/types';

const Policies = () => {
  const [activeTab, setActiveTab] = useState<'my-policies' | 'available'>('my-policies');
  const [myPolicies, setMyPolicies] = useState<Policy[]>([]);
  const [availablePolicies, setAvailablePolicies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (activeTab === 'my-policies') {
      fetchMyPolicies();
    } else {
      fetchAvailablePolicies();
    }
  }, [activeTab, filterStatus, filterType]);

  const fetchMyPolicies = async () => {
    try {
      setIsLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await api.getPolicies(params);
      const policiesData = response.data?.data || response.data || [];
      setMyPolicies(Array.isArray(policiesData) ? policiesData : []);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailablePolicies = async () => {
    try {
      setIsLoading(true);
      const params = filterType !== 'all' ? { type: filterType } : {};
      const response = await api.getAvailablePolicies(params);
      const policiesData = response.data?.data || response.data || [];
      setAvailablePolicies(Array.isArray(policiesData) ? policiesData : []);
    } catch (error) {
      console.error('Error fetching available policies:', error);
      toast.error('Failed to load available policies');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseClick = (policy: any) => {
    setSelectedPolicy(policy);
    setShowPurchaseModal(true);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;

    try {
      setIsPurchasing(true);
      const response = await api.purchasePolicy({
        policyTemplateId: selectedPolicy.policyTemplateId,
        paymentDetails: {
          method: 'CARD',
          cardNumber: '4111111111111111', // Demo card
          cardHolder: 'Demo User',
          expiryDate: '12/25',
          cvv: '123'
        }
      });

      toast.success('Policy purchased successfully!');
      setShowPurchaseModal(false);
      setSelectedPolicy(null);
      
      // Refresh my policies
      if (activeTab === 'my-policies') {
        fetchMyPolicies();
      } else {
        setActiveTab('my-policies');
      }
    } catch (error: any) {
      console.error('Error purchasing policy:', error);
      toast.error(error?.response?.data?.message || 'Failed to purchase policy');
    } finally {
      setIsPurchasing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      ACTIVE: 'badge badge-success',
      EXPIRED: 'badge badge-warning',
      CANCELLED: 'badge badge-danger',
    };
    return badges[status] || 'badge badge-info';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HEALTH: 'bg-green-100 text-green-800',
      AUTO: 'bg-blue-100 text-blue-800',
      HOME: 'bg-purple-100 text-purple-800',
      LIFE: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredMyPolicies = myPolicies.filter(policy => {
    const policyNumber = policy.policyNumber || policy.policy_number || '';
    const policyType = policy.type || '';
    return (
      policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policyType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredAvailablePolicies = availablePolicies.filter(policy => {
    const policyName = policy.name || '';
    const policyType = policy.type || '';
    return (
      policyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policyType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Insurance Policies</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-policies')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-policies'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Policies
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Available Policies
          </button>
        </nav>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            {activeTab === 'my-policies' ? (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            ) : (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input"
              >
                <option value="all">All Types</option>
                <option value="HEALTH">Health</option>
                <option value="AUTO">Auto</option>
                <option value="HOME">Home</option>
                <option value="LIFE">Life</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* My Policies Tab */}
      {activeTab === 'my-policies' && (
        <>
          {filteredMyPolicies.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
              <p className="text-gray-600 mb-4">Browse available policies to get started</p>
              <button
                onClick={() => setActiveTab('available')}
                className="btn btn-primary inline-flex items-center"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Browse Policies
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMyPolicies.map((policy: any) => {
                const policyId = policy.policyId || policy.policy_id;
                const policyNumber = policy.policyNumber || policy.policy_number;
                const policyType = policy.type;
                const policyStatus = policy.status;
                const premium = policy.premium;
                
                let coverage = policy.coverage;
                if (typeof coverage === 'string') {
                  try {
                    coverage = JSON.parse(coverage);
                  } catch (e) {
                    coverage = {};
                  }
                }
                
                // Get policy name from coverage or use type as fallback
                const policyName = coverage?.policyName || `${policyType} Insurance`;
                const providerName = coverage?.providerName || 'Insurance Provider';
                
                return (
                  <Link
                    key={policyId}
                    to={`/policies/${policyId}`}
                    className="card hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className={getStatusBadge(policyStatus)}>{policyStatus}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{policyName}</h3>
                    <p className="text-sm text-gray-600 mb-4">Policy #{policyNumber}</p>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Premium:</span>
                        <span className="font-medium text-gray-900">₹{premium?.toLocaleString()}/year</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Provider:</span>
                        <span className="font-medium text-gray-900">{providerName}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Available Policies Tab */}
      {activeTab === 'available' && (
        <>
          {filteredAvailablePolicies.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No policies available</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailablePolicies.map((policy: any) => (
                <div key={policy.policyTemplateId} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(policy.type)}`}>
                      {policy.type}
                    </span>
                    <span className="text-xs text-gray-500">⭐ {policy.popularityScore}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{policy.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{policy.description}</p>
                  <div className="border-t pt-4 space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Premium:</span>
                      <span className="font-bold text-primary-600">₹{policy.basePremium?.toLocaleString()}/year</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Provider:</span>
                      <span className="font-medium text-gray-900">{policy.providerName}</span>
                    </div>
                    {policy.minAge && policy.maxAge && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Age:</span>
                        <span className="text-gray-900">{policy.minAge}-{policy.maxAge} years</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handlePurchaseClick(policy)}
                    className="btn btn-primary w-full flex items-center justify-center"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Purchase Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && selectedPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Purchase Policy</h2>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">{selectedPolicy.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{selectedPolicy.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount:</span>
                <span className="text-2xl font-bold text-primary-600">
                  ₹{selectedPolicy.basePremium?.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Demo Card Payment
                </label>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">Demo Card Details:</p>
                  <p className="text-xs text-blue-600">Card: 4111 1111 1111 1111</p>
                  <p className="text-xs text-blue-600">Expiry: 12/25 | CVV: 123</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="btn btn-secondary flex-1"
                  disabled={isPurchasing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={isPurchasing}
                >
                  {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Policies;

// Made with Bob
