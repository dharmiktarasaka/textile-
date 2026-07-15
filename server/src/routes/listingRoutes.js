const express = require('express');
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  markSold,
  getPublicLatestListings,
  getPublicFeaturedSellers,
} = require('../controllers/listingController');
const { authenticateJWT, optionalAuthenticateJWT, requireVerifiedCompany, requireSellerRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes for homepage search & preview (without JWT)
router.get('/public/latest', getPublicLatestListings);
router.get('/public/sellers', getPublicFeaturedSellers);

// Optional auth (any visitor can browse, logged in users get unique views tracked / contact requests resolved)
router.get('/', optionalAuthenticateJWT, getListings);
router.get('/:id', optionalAuthenticateJWT, getListingById);

// Fully gated routes (sellers / actions)
router.post('/', authenticateJWT, requireVerifiedCompany, requireSellerRole, upload.array('photos', 4), createListing);
router.patch('/:id', authenticateJWT, requireVerifiedCompany, requireSellerRole, updateListing);
router.delete('/:id', authenticateJWT, requireVerifiedCompany, requireSellerRole, deleteListing);
router.patch('/:id/mark-sold', authenticateJWT, requireVerifiedCompany, requireSellerRole, markSold);

module.exports = router;
