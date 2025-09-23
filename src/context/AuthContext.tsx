import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import useNotifications from '@/hooks/useNotifications';

export interface UserAuthData {
  _id?: string; // id do usuário
  name?: string;
  email: string;
  avatar?: string | null;
  [k: string]: any;
}

interface AuthResponse {
  token: string;
  user?: UserAuthData;
  [k: string]: any;
}

interface AuthContextValue {
  authenticated: boolean;
  user?: UserAuthData | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; confirmPassword?: string }) => Promise<void>;
  logout: () => void;
  refreshSelf: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<UserAuthData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotifications();

  const refreshSelf = useCallback(async () => {
    try {
      const { data } = await api.get('/users/myprofile');
      // Suporta ambos formatos: { user: {...} } ou direto {...}
      const maybeUser = data?.user ?? data;
      if (maybeUser && typeof maybeUser === 'object') {
        setUser(maybeUser);
      }
    } catch {
      // silencioso
    }
  }, []);

  // Inicialização do token + carregamento do próprio perfil
  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem('token');
      if (stored) {
        try {
          const token = JSON.parse(stored);
          if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setAuthenticated(true);
            await refreshSelf();
          }
        } catch {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    })();
  }, [refreshSelf]);

  // Fallback: se autenticado mas user ainda null, tenta novamente (ex: primeira chamada falhou)
  useEffect(() => {
    if (authenticated && !loading && !user) {
      refreshSelf();
    }
  }, [authenticated, loading, user, refreshSelf]);

  const applyAuth = useCallback(async (data: AuthResponse) => {
    localStorage.setItem('token', JSON.stringify(data.token));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setAuthenticated(true);
    if (data.user) setUser(data.user); else await refreshSelf();
  }, [refreshSelf]);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    try {
      setLoading(true);
      const { data } = await api.post<AuthResponse>('/users/login', { email, password });
      await applyAuth(data);
      notifySuccess('Login realizado com sucesso');
      navigate('/');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Erro ao fazer login.';
      notifyError(Array.isArray(errorMsg) ? errorMsg : [errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [applyAuth, notifySuccess, notifyError, navigate]);

  const register = useCallback(async (form: { name: string; email: string; password: string; confirmPassword?: string }) => {
    try {
      setLoading(true);
      const { data } = await api.post<AuthResponse>('/users/register', form);
      // Se a API retornar token, autenticar direto; senão só sucesso e redirecionar para login
      if (data?.token) {
        await applyAuth(data);
        notifySuccess('Cadastro concluído!');
        navigate('/');
      } else {
        notifySuccess('Cadastro concluído! Faça login.');
        navigate('/login');
      }
    } catch (err: any) {
      const res = err?.response?.data;
      let messages: string[] = [];

      // 1) Tenta extrair de res.errors em diferentes formatos
      const errs = res?.errors;
      if (errs) {
        if (Array.isArray(errs)) {
          errs.forEach((item: any) => {
            if (typeof item === 'string') {
              messages.push(item);
            } else if (item && typeof item === 'object') {
              Object.values(item).forEach((val: any) => {
                if (Array.isArray(val)) {
                  val.forEach((s: any) => typeof s === 'string' && messages.push(s));
                } else if (typeof val === 'string') {
                  messages.push(val);
                }
              });
            }
          });
        } else if (typeof errs === 'object') {
          Object.values(errs).forEach((val: any) => {
            if (Array.isArray(val)) {
              val.forEach((s: any) => typeof s === 'string' && messages.push(s));
            } else if (typeof val === 'string') {
              messages.push(val);
            }
          });
        }
      }

      // 2) Se nada, tenta res.message (string ou array)
      if (messages.length === 0) {
        const msg = res?.message;
        if (Array.isArray(msg)) {
          msg.forEach((m: any) => typeof m === 'string' && messages.push(m));
        } else if (typeof msg === 'string') {
          messages.push(msg);
        }
      }

      // 3) Fallback genérico
      if (messages.length === 0) {
        messages = ['Erro ao cadastrar usuário.'];
      }

      messages.forEach((m) => notifyError([m]));
    } finally {
      setLoading(false);
    }
  }, [applyAuth, notifySuccess, notifyError, navigate]);

  const logout = useCallback(() => {
    setAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    navigate('/');
    notifySuccess('Logout realizado com sucesso');
  }, [navigate, notifySuccess]);

  return (
    <AuthContext.Provider value={{ authenticated, user, loading, login, register, logout, refreshSelf }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext deve ser usado dentro de AuthProvider');
  return ctx;
};
