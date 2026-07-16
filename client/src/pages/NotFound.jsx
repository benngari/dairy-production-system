import { Link } from 'react-router-dom';
import { FiAlertCircle } from 'react-icons/fi';

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center px-4">
    <FiAlertCircle size={48} className="text-primary-400 mb-4" />
    <h1 className="text-3xl font-bold text-slate-800">404</h1>
    <p className="text-slate-500 mt-1 mb-6">The page you're looking for doesn't exist.</p>
    <Link to="/" className="btn-primary">
      Back to Dashboard
    </Link>
  </div>
);

export default NotFound;
