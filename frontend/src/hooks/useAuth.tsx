import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  canApprove: (type: 'pm' | 'pmo' | 'department') => boolean;
  canSubmit: boolean;
  canViewDashboard: boolean;
  isReadOnly: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DASHBOARD_ROLES: Role[] = ['ADMIN', 'PM', 'PMO', 'DEPARTMENT_APPROVER', 'EXECUTIVE_READONLY'];
const SUBMIT_ROLES: Role[] = ['ADMIN', 'PM', 'PMO', 'DEPARTMENT_APPROVER', 'STANDARD_CONTRIBUTOR'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.auth.me()
        .then(({ user }) => setUser(user))
        .catch(() => { localStorage.removeItem('token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string) => {
    const { user } = await api.auth.login(email);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setUser(null);
  }, []);

  const canApprove = useCallback((type: 'pm' | 'pmo' | 'department') => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (type === 'pm') return user.role === 'PM';
    if (type === 'pmo') return user.role === 'PMO';
    if (type === 'department') return user.role === 'DEPARTMENT_APPROVER';
    return false;
  }, [user]);

  const canSubmit = user ? SUBMIT_ROLES.includes(user.role) : false;
  const canViewDashboard = user ? DASHBOARD_ROLES.includes(user.role) : false;
  const isReadOnly = user?.role === 'EXECUTIVE_READONLY';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, canApprove, canSubmit, canViewDashboard, isReadOnly }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
