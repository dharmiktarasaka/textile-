import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

/**
 * SellerRoute — Protects seller-only pages.
 *
 * Access is granted only if the company's DB role is 'SELLER' or 'BOTH'.
 * Buyers who manually type a seller URL are redirected to /marketplace with a state flag.
 */
const SellerRoute = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isSeller = user.role === 'SELLER' || user.role === 'BOTH';

  if (!isSeller) {
    return (
      <Navigate
        to="/marketplace"
        state={{ accessDenied: true, from: location }}
        replace
      />
    );
  }

  return children;
};

export default SellerRoute;
