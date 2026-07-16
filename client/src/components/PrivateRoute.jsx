import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return <Spinner full size="lg" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(...roles)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <p className="text-lg font-semibold text-slate-700">Access Restricted</p>
        <p className="text-sm text-slate-400 mt-1">
          Your role ({user.role}) does not have permission to view this page.
        </p>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
