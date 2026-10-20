import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface AdminAuthContextType {
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isVerifying: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  verifySession: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEY = 'marvi_admin_token';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // Only enter verifying state if a token actually exists in localStorage
  const [isVerifying, setIsVerifying] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });

  // Authoritatively verify session token with server
  const verifySession = useCallback(async (): Promise<boolean> => {
    let currentToken: string | null = null;
    try {
      currentToken = token || localStorage.getItem(STORAGE_KEY);
    } catch {
      currentToken = token;
    }

    if (!currentToken) {
      setIsAuthenticated(false);
      setRole(null);
      setIsVerifying(false);
      return false;
    }

    try {
      setIsVerifying(true);
      const result = await api.verifyAdminSession(currentToken);
      if (result.valid && result.role === 'admin') {
        setIsAuthenticated(true);
        setRole('admin');
        setIsVerifying(false);
        return true;
      } else {
        // Invalid or expired token
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        setToken(null);
        setRole(null);
        setIsAuthenticated(false);
        setIsVerifying(false);
        return false;
      }
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      setIsAuthenticated(false);
      setRole(null);
      setIsVerifying(false);
      return false;
    }
  }, [token]);

  // Initial verification on mount
  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.adminLogin(password);
      if (res.success && res.token) {
        localStorage.setItem(STORAGE_KEY, res.token);
        setToken(res.token);
        
        // Immediately verify role
        const verifyRes = await api.verifyAdminSession(res.token);
        if (verifyRes.valid && verifyRes.role === 'admin') {
          setIsAuthenticated(true);
          setRole('admin');
          return { success: true };
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setIsAuthenticated(false);
          setRole(null);
          return { success: false, error: 'Unauthorized role assignment.' };
        }
      }
      return { success: false, error: 'Authentication failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid administrator password.' };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Could not remove token from storage:', e);
    }
    setToken(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        token,
        role,
        isAuthenticated,
        isVerifying,
        login,
        logout,
        verifySession,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
