const express = require('express');
const { signup, verifyOtp, login, resendOtp, googleLogin } = require('../controllers/authController');
const { authRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/signup', authRateLimiter, signup);
router.post('/verify-otp', authRateLimiter, verifyOtp);
router.post('/login', authRateLimiter, login);
router.post('/resend-otp', authRateLimiter, resendOtp);
router.post('/google-login', authRateLimiter, googleLogin);

module.exports = router;
