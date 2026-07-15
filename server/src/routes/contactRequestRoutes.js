const express = require('express');
const {
  createContactRequest,
  respondContactRequest,
  getMyContactRequests,
} = require('../controllers/contactRequestController');
const { authenticateJWT, requireVerifiedCompany } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);
router.use(requireVerifiedCompany);

router.post('/', createContactRequest);
router.patch('/:id', respondContactRequest);
router.get('/me', getMyContactRequests);

module.exports = router;
