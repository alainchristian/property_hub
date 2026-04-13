import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface Props {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user!.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
