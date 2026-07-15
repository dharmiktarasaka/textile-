import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const PublicRoute = ({ children }) => {
  const { token, user } = useAuthStore();

  if (token && user) {
    // Redirect authenticated users to their correct section
    if (!user.emailVerified) {
      return <Navigate to="/verify-otp" replace />;
    }
    if (user.verificationStatus === 'PENDING' && !user.verificationDocUrl) {
      return <Navigate to="/upload-document" replace />;
    }
    if (user.verificationStatus === 'PENDING' && user.verificationDocUrl) {
      return <Navigate to="/pending-approval" replace />;
    }
    if (user.verificationStatus === 'REJECTED') {
      return <Navigate to="/rejected" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
