import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('evoting_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('evoting_auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await authApi.getMe();
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('evoting_user', JSON.stringify(data.user));
        }
      } catch (err) {
        // Session invalid or expired
        setUser(null);
        setToken(null);
        localStorage.removeItem('evoting_user');
        localStorage.removeItem('evoting_auth_token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginUser = (sessionToken, userData) => {
    setToken(sessionToken);
    setUser(userData);
    localStorage.setItem('evoting_auth_token', sessionToken);
    localStorage.setItem('evoting_user', JSON.stringify(userData));
  };

  const logoutUser = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('evoting_user');
      localStorage.removeItem('evoting_auth_token');
    }
  };

  const isVoter = user?.role === 'voter';
  const isStaff = user?.role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isVoter,
        isStaff,
        login: loginUser,
        logout: logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
