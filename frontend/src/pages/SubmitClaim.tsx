import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';
import { ArrowLeft, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const SubmitClaim = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    policyId: '',
    type: '',
    amount: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const data = new FormData();
      data.append('policyId', formData.policyId);
      data.append('type', formData.type);
      data.append('amount', formData.amount);
      data.append('description', formData.description);
      
      await api.submitClaim(data);
      toast.success('Claim submitted successfully!');
      navigate('/claims');
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit claim');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/claims" className="inline-flex items-center text-primary-600 hover:text-primary-700">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Claims
      </Link>

      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Submit New Claim</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy
            </label>
            <select
              value={formData.policyId}
              onChange={(e) => setFormData({ ...formData, policyId: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a policy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Claim Type
            </label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={4}
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
            {isLoading ? 'Submitting...' : 'Submit Claim'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitClaim;

// Made with Bob
