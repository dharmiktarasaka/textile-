const express = require('express');
const { createReview, getListingReviews } = require('../controllers/reviewController');
const { authenticateJWT, requireVerifiedCompany } = require('../middleware/auth');

const router = express.Router();

// All reviews route require authentication
router.use(authenticateJWT);

// Publicly read listing reviews
router.get('/listing/:listingId', getListingReviews);

// Add review requires a fully verified company
router.post('/', requireVerifiedCompany, createReview);

module.exports = router;
