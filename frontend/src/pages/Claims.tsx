import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { ClipboardList, Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Claim } from '@/types';

const Claims = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      const response = await api.getClaims();
      setClaims(response.data || []);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast.error('Failed to load claims');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      SUBMITTED: 'badge badge-info',
      UNDER_REVIEW: 'badge badge-warning',
      APPROVED: 'badge badge-success',
      REJECTED: 'badge badge-danger',
      PAID: 'badge badge-success',
    };
    return badges[status] || 'badge badge-info';
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Claims</h1>
        <Link to="/claims/new" className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Submit New Claim
        </Link>
      </div>

      {claims.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No claims yet</h3>
          <p className="text-gray-600 mb-4">Submit your first insurance claim</p>
          <Link to="/claims/new" className="btn btn-primary inline-flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Submit Claim
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <Link
              key={claim.claimId}
              to={`/claims/${claim.claimId}`}
              className="card hover:shadow-lg transition-shadow block"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Claim #{claim.claimNumber}
                    </h3>
                    <span className={getStatusBadge(claim.status)}>{claim.status}</span>
                  </div>
                  <p className="text-gray-600 mb-2">{claim.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Amount: ${claim.amount.toLocaleString()}</span>
                    <span>•</span>
                    <span>Submitted: {new Date(claim.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Claims;

// Made with Bob
