const Interest = require('../models/Interest');
const Category = require('../models/Category');

const createInterest = async (req, res, next) => {
  try {
    const { categoryId, subFilters } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    const category = await Category.findById(categoryId);
    if (!category || !category.isActive) {
      return res.status(404).json({ message: 'Category not found or inactive' });
    }

    // Check if interest already exists for the same category and criteria to avoid duplicates
    const existingInterest = await Interest.findOne({
      companyId: req.company._id,
      categoryId,
      subFilters: subFilters || {},
    });

    if (existingInterest) {
      return res.status(400).json({ message: 'Interest profile with same criteria already registered' });
    }

    const interest = await Interest.create({
      companyId: req.company._id,
      categoryId,
      subFilters: subFilters || {},
    });

    return res.status(201).json({
      message: 'Interest profile registered successfully',
      interest,
    });
  } catch (error) {
    next(error);
  }
};

const getMyInterests = async (req, res, next) => {
  try {
    const interests = await Interest.find({ companyId: req.company._id })
      .populate('categoryId', 'name fieldSchema')
      .sort({ createdAt: -1 });

    return res.status(200).json({ interests });
  } catch (error) {
    next(error);
  }
};

const deleteInterest = async (req, res, next) => {
  try {
    const interest = await Interest.findById(req.params.id);

    if (!interest) {
      return res.status(404).json({ message: 'Interest profile not found' });
    }

    // Check ownership
    if (interest.companyId.toString() !== req.company._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this interest profile.' });
    }

    await Interest.findByIdAndDelete(interest._id);

    return res.status(200).json({ message: 'Interest profile removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInterest,
  getMyInterests,
  deleteInterest,
};
