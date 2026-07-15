const mongoose = require('mongoose');

const ContactRequestSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    buyerCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    sellerCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'ACCEPTED', 'DECLINED'],
      default: 'REQUESTED',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ContactRequest', ContactRequestSchema);
