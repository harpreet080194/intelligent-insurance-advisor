import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
          <p className="text-gray-600 mt-2">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="btn btn-primary w-full flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline w-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? <Link to="/chat" className="text-primary-600 hover:text-primary-700">Contact support</Link></p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

// Made with Bob
