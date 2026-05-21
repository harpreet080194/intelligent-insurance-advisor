import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Claim } from '@/types';

const ClaimDetails = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (claimId) {
      fetchClaim();
    }
  }, [claimId]);

  const fetchClaim = async () => {
    try {
      setIsLoading(true);
      const response = await api.getClaim(claimId!);
      setClaim(response.data);
    } catch (error) {
      console.error('Error fetching claim:', error);
      toast.error('Failed to load claim details');
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

  if (!claim) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Claim not found</p>
        <Link to="/claims" className="btn btn-primary mt-4">Back to Claims</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/claims" className="inline-flex items-center text-primary-600 hover:text-primary-700">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Claims
      </Link>

      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Claim #{claim.claimNumber}</h1>
        <p className="text-gray-600">{claim.description}</p>
        <div className="mt-4">
          <span className={`badge ${claim.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
            {claim.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClaimDetails;

// Made with Bob
