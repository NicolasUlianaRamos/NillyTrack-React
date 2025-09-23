import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import api from '@/utils/api';

interface Props { children: ReactNode; }

// Wrapper para proteger rotas admin. Redireciona para home se não for admin.
export const RequireAdmin = ({ children }: Props) => {
  const { authenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let ignore = false;
    const verify = async () => {
      if (loading) return; // espera auth resolver
      if (!authenticated) {
        navigate('/', { replace: true });
        return;
      }
      try {
        setChecking(true);
        await api.get('/users/checkuseradmin');
        if (!ignore) {
          setAllowed(true);
        }
      } catch {
        if (!ignore) navigate('/', { replace: true });
      } finally {
        if (!ignore) setChecking(false);
      }
    };
    verify();
    return () => { ignore = true; };
  }, [authenticated, loading, navigate]);

  if (loading || checking) return null; // pode trocar por skeleton
  if (!allowed) return null;
  return <>{children}</>;
};

export default RequireAdmin;
