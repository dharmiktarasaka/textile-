const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gstNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    companyType: {
      type: String,
      enum: ['MILL', 'TRADER', 'RECYCLER', 'EXPORTER', 'OTHER'],
      required: true,
    },
    contactPersonName: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['SELLER', 'BUYER', 'BOTH'],
      default: 'BOTH',
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    verificationDocUrl: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    googleProfileCompleted: {
      type: Boolean,
      default: true,
    },
    pendingProfileUpdate: {
      type: {
        name: String,
        gstNumber: String,
        companyType: String,
        contactPersonName: String,
        contactPhone: String,
        contactEmail: String,
        address: String,
        city: String,
        state: String,
        role: String,
        hasPendingChange: { type: Boolean, default: false }
      },
      default: { hasPendingChange: false }
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Company', CompanySchema);
