import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, requireVerified = true }) => {
  const { token, user, fetchMe, loading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token, user, fetchMe]);

  if (!token) {
    // Save the attempted URL for redirection after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Gating flow redirects
  // Step 1: Verify OTP
  if (!user.emailVerified) {
    if (location.pathname !== '/verify-otp') {
      return <Navigate to="/verify-otp" replace />;
    }
    return children;
  }

  // Step 1.5: Complete Google Profile details
  if (user.googleProfileCompleted === false) {
    if (location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />;
    }
    return children;
  }

  // Step 2: Upload Documents
  if (user.verificationStatus === 'PENDING' && !user.verificationDocUrl) {
    if (location.pathname !== '/upload-document') {
      return <Navigate to="/upload-document" replace />;
    }
    return children;
  }

  // Step 3: Wait for approval
  if (user.verificationStatus === 'PENDING' && user.verificationDocUrl) {
    if (location.pathname !== '/pending-approval') {
      return <Navigate to="/pending-approval" replace />;
    }
    return children;
  }

  // Step 4: Resubmit rejected profile
  if (user.verificationStatus === 'REJECTED') {
    if (location.pathname !== '/rejected') {
      return <Navigate to="/rejected" replace />;
    }
    return children;
  }

  // Step 5: If verified company, block them from landing on onboarding-specific steps
  if (user.verificationStatus === 'VERIFIED') {
    const onboardingPaths = ['/verify-otp', '/upload-document', '/pending-approval', '/rejected', '/complete-profile'];
    if (onboardingPaths.includes(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Verified check for general marketplace views
  if (requireVerified && user.verificationStatus !== 'VERIFIED') {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
};

export default ProtectedRoute;
