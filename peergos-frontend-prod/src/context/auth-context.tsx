import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, Company } from '../types';
import { useQuery } from '@tanstack/react-query';

interface AuthContextType {
  user: AuthUser | null;
  company: Company | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/users/me'],
    enabled: !user,
  });

  useEffect(() => {
    if (data) {
      setUser(data.user);
      setCompany(data.company);
    }
  }, [data]);

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const result = await response.json();
    setUser(result.user);
    setCompany(result.company);
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ user, company, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
