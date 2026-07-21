import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import apiClient from '@/api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('ync_token');
      const adminToken = localStorage.getItem('ync_admin_token');

      if (adminToken) {
        const res = await apiClient.get('/admin/auth/me');
        if (res.data) {
          setUser({ ...res.data, role: 'admin' });
          setLoading(false);
          return;
        }
      }

      if (token) {
        const res = await apiClient.get('/auth/me');
        if (res.data) {
          setUser(res.data);
        } else {
          localStorage.removeItem('ync_token');
        }
      }
    } catch (err) {
      localStorage.removeItem('ync_token');
      localStorage.removeItem('ync_admin_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const data = res.data;
      if (data?.token) {
        localStorage.setItem('ync_token', data.token);
        setUser(data.user);
        toast.success('Welcome back!');
        return data.user;
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      const msg = err.data?.message || err.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/admin/auth/login', { email, password });
      const data = res.data;
      if (data?.token) {
        localStorage.setItem('ync_admin_token', data.token);
        setUser({ ...data.admin || data.user, role: 'admin' });
        toast.success('Welcome Admin!');
        return { ...data.admin || data.user, role: 'admin' };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      const msg = err.data?.message || err.message || 'Invalid credentials';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', data);
      const d = res.data;
      if (d?.token) {
        localStorage.setItem('ync_token', d.token);
        setUser(d.user);
        toast.success('Account created successfully!');
        return d.user;
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      const msg = err.data?.message || err.message || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('ync_token');
    localStorage.removeItem('ync_admin_token');
    setUser(null);
    toast.success('Logged out');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, adminLogin, register, logout, updateUser, checkAuth,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
