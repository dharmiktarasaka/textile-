const express = require('express');
const { getMe, uploadVerificationDoc, resubmitVerification, viewVerificationDoc, switchToSeller, completeGoogleProfile, requestProfileUpdate } = require('../controllers/companyController');
const { authenticateJWT, requireVerifiedCompany } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Publicly reachable but internally verified via token in query or Authorization header
router.get('/view/:filename', viewVerificationDoc);

// Secure routes
router.get('/me', authenticateJWT, getMe);
router.post('/upload-verification-doc', authenticateJWT, upload.single('document'), uploadVerificationDoc);
router.patch('/resubmit-verification', authenticateJWT, resubmitVerification);
router.patch('/complete-google-profile', authenticateJWT, completeGoogleProfile);
router.patch('/request-profile-update', authenticateJWT, requestProfileUpdate);

// Role switch: upgrade buyer to seller
router.patch('/switch-to-seller', authenticateJWT, requireVerifiedCompany, switchToSeller);

module.exports = router;
