import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

interface RequireAuthProps {
  children: ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { authenticated, loading } = useAuth();
  if (loading) return null; // ou um skeleton/spinner
  if (!authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default RequireAuth;
