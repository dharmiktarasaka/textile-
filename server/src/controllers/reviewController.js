const Review = require('../models/Review');
const Listing = require('../models/Listing');

const createReview = async (req, res, next) => {
  try {
    const { listingId, rating, comment } = req.body;

    if (!listingId || !rating || !comment) {
      return res.status(400).json({ message: 'Listing ID, rating, and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // A company cannot review their own listing
    if (listing.companyId.toString() === req.company._id.toString()) {
      return res.status(400).json({ message: 'You cannot review your own listing' });
    }

    // Check if the user already reviewed this listing
    const existingReview = await Review.findOne({
      listingId,
      reviewerCompanyId: req.company._id,
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this listing' });
    }

    const review = await Review.create({
      listingId,
      targetCompanyId: listing.companyId,
      reviewerCompanyId: req.company._id,
      reviewerName: req.company.name,
      rating,
      comment,
    });

    return res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
};

const getListingReviews = async (req, res, next) => {
  try {
    const { listingId } = req.params;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const reviews = await Review.find({ targetCompanyId: listing.companyId })
      .populate('reviewerCompanyId', 'name city state verificationStatus')
      .sort({ createdAt: -1 });

    return res.status(200).json({ reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getListingReviews,
};
