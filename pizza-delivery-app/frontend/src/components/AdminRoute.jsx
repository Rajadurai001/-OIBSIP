import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Guards admin-only routes - completely separate from the user auth guard
const AdminRoute = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading...</div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
};

export default AdminRoute;
