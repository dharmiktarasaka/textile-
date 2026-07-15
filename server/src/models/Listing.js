const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fields: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    photoUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'SOLD', 'EXPIRED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    soldAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Listing', ListingSchema);
