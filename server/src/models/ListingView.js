const mongoose = require('mongoose');

const ListingViewSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'viewedAt', updatedAt: false },
  }
);

// Prevent duplicate count logs in the same session/day by indexing uniquely or using simple insert logs.
// Let's create an index to quickly count unique views.
ListingViewSchema.index({ listingId: 1, companyId: 1 });

module.exports = mongoose.model('ListingView', ListingViewSchema);
