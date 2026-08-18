import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const DEMO_EMAILS: Record<UserRole, string> = {
  ADMIN: 'admin@civicai.local',
  OFFICER: 'officer@civicai.local',
  CALL_OPERATOR: 'operator@civicai.local',
  CITIZEN: 'citizen@civicai.local',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from storage or default to ADMIN for hackathon preview
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('civicai_token');
      if (storedToken) {
        try {
          const me = await authApi.getMe();
          setUser(me);
        } catch {
          // Token invalid, login with default admin
          await autoLoginDefault('ADMIN');
        }
      } else {
        await autoLoginDefault('ADMIN');
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const autoLoginDefault = async (role: UserRole) => {
    try {
      const email = DEMO_EMAILS[role];
      const res = await authApi.login(email, 'civicai123');
      localStorage.setItem('civicai_token', res.access_token);
      setUser(res.user);
    } catch (e) {
      console.warn('Auto-login error:', e);
      // Fallback local mock user
      setUser({
        id: 1,
        name: role === 'ADMIN' ? 'Admin Commissioner' : role === 'OFFICER' ? 'Er. S. Selvakumar' : role === 'CALL_OPERATOR' ? 'Senior Call Operator' : 'Senthil Nathan',
        email: DEMO_EMAILS[role],
        role: role,
        department_id: role === 'OFFICER' ? 1 : null,
        created_at: new Date().toISOString(),
      });
    }
  };

  const login = async (email: string, password: string = 'civicai123') => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('civicai_token', res.access_token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    await autoLoginDefault(targetRole);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('civicai_token');
    setUser(null);
  };

  const role: UserRole = user?.role || 'ADMIN';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
