import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, LoginRequest, SignupRequest } from '@/types';
import { api, getStoredUser } from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  signup: (req: SignupRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (req: LoginRequest) => {
    setLoading(true);
    try {
      const res = await api.login(req);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (req: SignupRequest) => {
    setLoading(true);
    try {
      const res = await api.signup(req);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cds_token');
    localStorage.removeItem('cds_user');
    setUser(null);
  }, []);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
