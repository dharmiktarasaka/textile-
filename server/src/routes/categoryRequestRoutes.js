const express = require('express');
const CategoryRequest = require('../models/CategoryRequest');
const { authenticateJWT, requireVerifiedCompany } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateJWT);
router.use(requireVerifiedCompany);

// POST /category-requests — seller submits a new category suggestion
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check for duplicate pending/approved requests from same company
    const duplicate = await CategoryRequest.findOne({
      suggestedBy: req.company._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      status: { $in: ['PENDING', 'APPROVED'] },
    });

    if (duplicate) {
      return res.status(409).json({
        message: `You already have a ${duplicate.status.toLowerCase()} request for this category name.`,
      });
    }

    const request = await CategoryRequest.create({
      name: name.trim(),
      description: description?.trim() || '',
      suggestedBy: req.company._id,
    });

    return res.status(201).json({
      message: 'Category suggestion submitted. It will be reviewed by our admin team.',
      request,
    });
  } catch (error) {
    next(error);
  }
});

// GET /category-requests/my — seller sees their own requests
router.get('/my', async (req, res, next) => {
  try {
    const requests = await CategoryRequest.find({ suggestedBy: req.company._id })
      .sort({ createdAt: -1 });
    return res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
