import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

// Safe JSON parse — corrupt localStorage crashes the app on every load without this
function safeParseUser() {
  try {
    const saved = localStorage.getItem('hs_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    // Corrupt data: clear it so the user is asked to log in again instead of getting a blank crash
    localStorage.removeItem('hs_user');
    localStorage.removeItem('hs_token');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(safeParseUser);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('hs_token', data.token);
      localStorage.setItem('hs_user', JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (err) {
      // Re-throw so Login.jsx can display the correct error message
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('hs_token');
    localStorage.removeItem('hs_user');
    setUser(null);
  };

  const hasRole = (...roles) => user && roles.includes(user.role);
  const isAdmin = () => hasRole('SUPER_ADMIN', 'ADMIN');
  const canManage = () => hasRole('SUPER_ADMIN', 'ADMIN', 'MANAGER');

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole, isAdmin, canManage }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
