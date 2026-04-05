import { Navigate, Outlet } from 'react-router-dom';
import { UserProfile } from '../types';

interface ProtectedRouteProps {
  user: UserProfile | null;
}

export default function ProtectedRoute({ user }: ProtectedRouteProps) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
