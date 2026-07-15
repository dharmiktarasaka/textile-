const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: String, // Stored as admin email or ID
      required: true,
    },
    action: {
      type: String, // e.g. "APPROVE_COMPANY", "REJECT_COMPANY", "DELETE_LISTING"
      required: true,
    },
    targetCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    reason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need creation time
  }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
