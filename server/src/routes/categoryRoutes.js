const express = require('express');
const Category = require('../models/Category');
const { authenticateJWT, requireVerifiedCompany } = require('../middleware/auth');

const router = express.Router();

// Categories are public for homepage & marketplace directory exploration

// Fetch all active categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
});

// Fetch category by ID
router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, isActive: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
