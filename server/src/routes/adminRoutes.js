const express = require('express');
const {
  login,
  getCompanies,
  getCompanyById,
  approveCompany,
  rejectCompany,
  getAuditLogs,
  getCategories,
  createCategory,
  updateCategory,
  getListings,
  deleteListing,
  getCategoryRequests,
  approveCategoryRequest,
  rejectCategoryRequest,
  getPendingListings,
  approveListing,
  rejectListing,
  approveCompanyProfileUpdate,
  rejectCompanyProfileUpdate,
} = require('../controllers/adminController');
const { authenticateAdminJWT } = require('../middleware/adminAuth');

const router = express.Router();

// Public login
router.post('/login', login);

// Admin authenticated endpoints
router.get('/companies', authenticateAdminJWT, getCompanies);
router.get('/companies/:id', authenticateAdminJWT, getCompanyById);
router.post('/companies/:id/approve', authenticateAdminJWT, approveCompany);
router.post('/companies/:id/reject', authenticateAdminJWT, rejectCompany);
router.post('/companies/:id/approve-profile-update', authenticateAdminJWT, approveCompanyProfileUpdate);
router.post('/companies/:id/reject-profile-update', authenticateAdminJWT, rejectCompanyProfileUpdate);

router.get('/categories', authenticateAdminJWT, getCategories);
router.post('/categories', authenticateAdminJWT, createCategory);
router.patch('/categories/:id', authenticateAdminJWT, updateCategory);

// Category requests (seller suggestions)
router.get('/category-requests', authenticateAdminJWT, getCategoryRequests);
router.post('/category-requests/:id/approve', authenticateAdminJWT, approveCategoryRequest);
router.post('/category-requests/:id/reject', authenticateAdminJWT, rejectCategoryRequest);

router.get('/audit-logs', authenticateAdminJWT, getAuditLogs);

router.get('/listings', authenticateAdminJWT, getListings);
router.get('/pending-listings', authenticateAdminJWT, getPendingListings);
router.post('/listings/:id/approve', authenticateAdminJWT, approveListing);
router.post('/listings/:id/reject', authenticateAdminJWT, rejectListing);
router.delete('/listings/:id', authenticateAdminJWT, deleteListing);

module.exports = router;
