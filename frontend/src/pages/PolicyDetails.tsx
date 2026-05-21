import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { ArrowLeft, FileText, Calendar, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { Policy } from '@/types';

const PolicyDetails = () => {
  const { policyId } = useParams<{ policyId: string }>();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (policyId) {
      fetchPolicy();
    }
  }, [policyId]);

  const fetchPolicy = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPolicy(policyId!);
      setPolicy(response.data);
    } catch (error) {
      console.error('Error fetching policy:', error);
      toast.error('Failed to load policy details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Policy not found</p>
        <Link to="/policies" className="btn btn-primary mt-4">Back to Policies</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/policies" className="inline-flex items-center text-primary-600 hover:text-primary-700">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Policies
      </Link>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{policy.type} Insurance</h1>
            <p className="text-gray-600 mt-2">Policy #{policy.policyNumber}</p>
          </div>
          <span className={`badge ${policy.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
            {policy.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Premium</p>
              <p className="text-xl font-bold text-gray-900">${policy.premium}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Coverage Amount</p>
              <p className="text-xl font-bold text-gray-900">
                ${policy.coverage?.coverageAmount?.toLocaleString() || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Valid Until</p>
              <p className="text-xl font-bold text-gray-900">
                {new Date(policy.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Coverage Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Deductible</span>
            <span className="font-medium">${policy.coverage?.deductible || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Provider</span>
            <span className="font-medium">{policy.providerName || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetails;

// Made with Bob
