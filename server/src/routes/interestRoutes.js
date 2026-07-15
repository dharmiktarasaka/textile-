const express = require('express');
const { createInterest, getMyInterests, deleteInterest } = require('../controllers/interestController');
const { authenticateJWT, requireVerifiedCompany } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);
router.use(requireVerifiedCompany);

router.post('/', createInterest);
router.get('/me', getMyInterests);
router.delete('/:id', deleteInterest);

module.exports = router;
