import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { FileText, Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Policy } from '@/types';

const Policies = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchPolicies();
  }, [filterStatus]);

  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await api.getPolicies(params);
      console.log('Policies page response:', response);
      console.log('Response data:', response.data);
      
      // Handle both response.data.data and response.data formats
      const policiesData = response.data?.data || response.data || [];
      console.log('Extracted policies:', policiesData);
      
      setPolicies(Array.isArray(policiesData) ? policiesData : []);
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setIsLoading(false);
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

  const filteredPolicies = policies.filter(policy => {
    // Handle both camelCase and snake_case property names
    const policyNumber = policy.policyNumber || policy.policy_number || '';
    const policyType = policy.type || '';
    
    return (
      policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <h1 className="text-3xl font-bold text-gray-900">My Policies</h1>
        <Link to="/policies/recommendations" className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Get Recommendations
        </Link>
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
          </div>
        </div>
      </div>

      {/* Policies Grid */}
      {filteredPolicies.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
          <p className="text-gray-600 mb-4">Start by getting policy recommendations</p>
          <Link to="/policies/recommendations" className="btn btn-primary inline-flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Get Recommendations
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolicies.map((policy: any) => {
            // Handle both camelCase and snake_case property names
            const policyId = policy.policyId || policy.policy_id;
            const policyNumber = policy.policyNumber || policy.policy_number;
            const policyType = policy.type;
            const policyStatus = policy.status;
            const premium = policy.premium;
            
            // Parse coverage if it's a JSON string
            let coverage = policy.coverage;
            if (typeof coverage === 'string') {
              try {
                coverage = JSON.parse(coverage);
              } catch (e) {
                coverage = { coverageAmount: 0 };
              }
            }
            
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{policyType} Insurance</h3>
                <p className="text-sm text-gray-600 mb-4">Policy #{policyNumber}</p>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Premium:</span>
                    <span className="font-medium text-gray-900">${premium}/month</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Coverage:</span>
                    <span className="font-medium text-gray-900">
                      ${(coverage?.coverageAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Policies;

// Made with Bob
