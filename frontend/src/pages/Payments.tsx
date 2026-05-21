import { useState, useEffect } from 'react';
import api from '@/services/api';
import { CreditCard, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { Payment } from '@/types';

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPayments();
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING: 'badge badge-warning',
      COMPLETED: 'badge badge-success',
      FAILED: 'badge badge-danger',
      REFUNDED: 'badge badge-info',
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
      <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>

      {payments.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
          <p className="text-gray-600">Your payment history will appear here</p>
        </div>
      ) : (
        <div className="card">
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.paymentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">${payment.amount}</p>
                    <p className="text-sm text-gray-600">{payment.method}</p>
                    <p className="text-xs text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={getStatusBadge(payment.status)}>{payment.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

// Made with Bob
