const express = require('express');
const { getSellerAnalytics } = require('../controllers/analyticsController');
const { authenticateJWT, requireVerifiedCompany } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);
router.use(requireVerifiedCompany);

router.get('/seller', getSellerAnalytics);

module.exports = router;
