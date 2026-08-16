import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchMe, login as apiLogin, logout as apiLogout, type AuthenticatedUser } from '../api/auth';
import { clearTokens, getAccessToken, setTokens } from '../api/client';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string, twoFactorCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(setUser)
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(usernameOrEmail: string, password: string, twoFactorCode?: string) {
    const res = await apiLogin(usernameOrEmail, password, twoFactorCode);
    setTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  }

  async function logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) await apiLogout(refreshToken);
    } catch {
      // clear the local session regardless of whether the server call succeeded
    }
    clearTokens();
    setUser(null);
  }

  function hasPermission(permission: string) {
    return user?.permissions.includes(permission) ?? false;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
