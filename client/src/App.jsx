import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import SellerRoute from './components/SellerRoute';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Public/Onboarding Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SignupSeller from './pages/SignupSeller';
import SignupBuyer from './pages/SignupBuyer';
import VerifyOTP from './pages/VerifyOTP';
import UploadDocument from './pages/UploadDocument';
import PendingApproval from './pages/PendingApproval';
import Rejected from './pages/Rejected';
import CompleteProfile from './pages/CompleteProfile';
import BecomeSeller from './pages/BecomeSeller';

// Marketplace / Dashboard Pages (Verified only)
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import MyListings from './pages/MyListings';
import MyInterests from './pages/MyInterests';
import ContactRequests from './pages/ContactRequests';
import Notifications from './pages/Notifications';
import SellerAnalytics from './pages/SellerAnalytics';
import Profile from './pages/Profile';

function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token, fetchMe]);
// OK
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing */}
        <Route path="/" element={<Landing />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/signup/seller" element={<PublicRoute><SignupSeller /></PublicRoute>} />
        <Route path="/signup/buyer" element={<PublicRoute><SignupBuyer /></PublicRoute>} />

        {/* Onboarding Flow Protected Routes */}
        <Route path="/verify-otp" element={<ProtectedRoute requireVerified={false}><VerifyOTP /></ProtectedRoute>} />
        <Route path="/complete-profile" element={<ProtectedRoute requireVerified={false}><CompleteProfile /></ProtectedRoute>} />
        <Route path="/upload-document" element={<ProtectedRoute requireVerified={false}><UploadDocument /></ProtectedRoute>} />
        <Route path="/pending-approval" element={<ProtectedRoute requireVerified={false}><PendingApproval /></ProtectedRoute>} />
        <Route path="/rejected" element={<ProtectedRoute requireVerified={false}><Rejected /></ProtectedRoute>} />

        {/* Become Seller (verified users only) */}
        <Route
          path="/become-seller"
          element={
            <ProtectedRoute>
              <BecomeSeller />
            </ProtectedRoute>
          }
        />

        {/* ── Buyer-accessible verified routes ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout><Dashboard /></DashboardLayout>
            </ProtectedRoute>
          }
        />
        {/* /explore is an alias for /marketplace */}
        <Route
          path="/explore"
          element={<Navigate to="/marketplace" replace />}
        />
        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <DashboardLayout><Marketplace /></DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/listings/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout><ListingDetail /></DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-interests"
          element={
            <ProtectedRoute>
              <DashboardLayout><MyInterests /></DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <DashboardLayout><Notifications /></DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout><Profile /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Seller-only routes (SellerRoute guard) ── */}
        <Route
          path="/create-listing"
          element={
            <ProtectedRoute>
              <SellerRoute>
                <DashboardLayout><CreateListing /></DashboardLayout>
              </SellerRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProtectedRoute>
              <SellerRoute>
                <DashboardLayout><MyListings /></DashboardLayout>
              </SellerRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact-requests"
          element={
            <ProtectedRoute>
              <SellerRoute>
                <DashboardLayout><ContactRequests /></DashboardLayout>
              </SellerRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller-analytics"
          element={
            <ProtectedRoute>
              <SellerRoute>
                <DashboardLayout><SellerAnalytics /></DashboardLayout>
              </SellerRoute>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
