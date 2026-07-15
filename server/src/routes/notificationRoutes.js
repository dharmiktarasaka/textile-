const express = require('express');
const { getMyNotifications, markAsRead } = require('../controllers/notificationController');
const { authenticateJWT, requireVerifiedCompany } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);
router.use(requireVerifiedCompany);

router.get('/me', getMyNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;
