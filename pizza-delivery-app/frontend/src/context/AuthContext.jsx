import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, adminApi } from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const userToken = localStorage.getItem('userToken');
      const adminToken = localStorage.getItem('adminToken');

      if (userToken) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
        } catch {
          localStorage.removeItem('userToken');
        }
      }
      if (adminToken) {
        try {
          const { data } = await adminApi.get('/admin/auth/me');
          setAdmin(data);
        } catch {
          localStorage.removeItem('adminToken');
        }
      }
      setLoading(false);
    };
    bootstrap();
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('userToken', token);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('userToken');
    setUser(null);
  };

  const loginAdmin = (token, adminData) => {
    localStorage.setItem('adminToken', token);
    setAdmin(adminData);
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, admin, loading, loginUser, logoutUser, loginAdmin, logoutAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
