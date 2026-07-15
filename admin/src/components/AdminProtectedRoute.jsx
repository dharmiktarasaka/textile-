import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAdminAuthStore from '../store/adminAuthStore';

const AdminProtectedRoute = ({ children }) => {
  const { token, admin } = useAdminAuthStore();
  const location = useLocation();

  if (!token || !admin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
