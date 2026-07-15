import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Guards & Layouts
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminLayout from './layouts/AdminLayout';

// Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PendingCompanies from './pages/PendingCompanies';
import CompanyReviewDetail from './pages/CompanyReviewDetail';
import CategoryManagement from './pages/CategoryManagement';
import CategoryRequests from './pages/CategoryRequests';
import ListingApprovals from './pages/ListingApprovals';
import ListingMonitoring from './pages/ListingMonitoring';
import AuditLogs from './pages/AuditLogs';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Login */}
        <Route path="/login" element={<AdminLogin />} />

        {/* Protected Console Routes */}
        <Route
          path="/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/pending-reviews"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <PendingCompanies />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/pending-reviews/:id"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <CompanyReviewDetail />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <CategoryManagement />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/category-requests"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <CategoryRequests />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/listing-approvals"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <ListingApprovals />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/listings"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <ListingMonitoring />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <AuditLogs />
              </AdminLayout>
            </AdminProtectedRoute>
          }
        />

        {/* Fallback Redirection */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
