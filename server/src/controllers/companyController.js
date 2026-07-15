const path = require('path');
const fs = require('fs');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');

const getMe = async (req, res, next) => {
  try {
    const company = await Company.findById(req.company._id).select('-passwordHash');
    return res.status(200).json({ company });
  } catch (error) {
    next(error);
  }
};

const uploadVerificationDoc = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filename = req.file.path || req.file.filename;

    const company = await Company.findByIdAndUpdate(
      req.company._id,
      {
        verificationDocUrl: filename,
        verificationStatus: 'PENDING',
        rejectionReason: null,
      },
      { new: true }
    ).select('-passwordHash');

    return res.status(200).json({
      message: 'Verification document uploaded successfully',
      company,
    });
  } catch (error) {
    next(error);
  }
};

const resubmitVerification = async (req, res, next) => {
  try {
    const { name, gstNumber, companyType, contactPersonName, contactPhone, address, city, state } = req.body;

    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.verificationStatus === 'VERIFIED') {
      return res.status(400).json({ message: 'Your account is already verified' });
    }

    // Update details and reset status to PENDING
    company.name = name || company.name;
    company.gstNumber = gstNumber ? gstNumber.toUpperCase() : company.gstNumber;
    company.companyType = companyType || company.companyType;
    company.contactPersonName = contactPersonName || company.contactPersonName;
    company.contactPhone = contactPhone || company.contactPhone;
    company.address = address || company.address;
    company.city = city || company.city;
    company.state = state || company.state;

    // Reset verification status so admin can review again
    company.verificationStatus = 'PENDING';
    company.rejectionReason = null;

    await company.save();

    const updated = await Company.findById(company._id).select('-passwordHash');

    return res.status(200).json({
      message: 'Details updated successfully. Account status reset to pending verification.',
      company: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Switches a company's role to SELLER (or BOTH if previously BUYER).
 * Allows a buyer-mode user to gain seller privileges.
 */
const switchToSeller = async (req, res, next) => {
  try {
    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.verificationStatus !== 'VERIFIED') {
      return res.status(403).json({ message: 'Only verified companies can become sellers' });
    }

    // If already a seller (SELLER or BOTH), no change needed
    if (company.role === 'SELLER' || company.role === 'BOTH') {
      const updated = await Company.findById(company._id).select('-passwordHash');
      return res.status(200).json({
        message: 'You are already registered as a seller',
        company: updated,
      });
    }

    // Upgrade BUYER to BOTH so they retain buyer access too
    company.role = 'BOTH';
    await company.save();

    const updated = await Company.findById(company._id).select('-passwordHash');
    return res.status(200).json({
      message: 'Seller role activated successfully! You can now list textile waste products.',
      company: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Endpoint to stream the private verification documents.
 * Authenticates that the company requesting it owns the document or it's requested via a valid token.
 */
const viewVerificationDoc = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const { token } = req.query;

    let authorized = false;

    // Option 1: View via valid S3-signed URL JWT token
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers');
        if (decoded.filename === filename && decoded.purpose === 'view_doc') {
          authorized = true;
        }
      } catch (err) {
        return res.status(403).json({ message: 'Document access token has expired or is invalid' });
      }
    }

    // Option 2: View via logged-in Company owner
    if (!authorized && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        try {
          const jwtToken = authHeader.split(' ')[1];
          const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers');
          const company = await Company.findById(decoded.id);
          if (company && company.verificationDocUrl === filename) {
            authorized = true;
          }
        } catch (err) {
          // Silent fail to pass through
        }
      }
    }

    if (!authorized) {
      return res.status(403).json({ message: 'Unauthorized access to private document' });
    }

    // Serve the file privately from filesystem
    const filePath = path.join(__dirname, '../../uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

const completeGoogleProfile = async (req, res, next) => {
  try {
    const { name, gstNumber, companyType, contactPersonName, contactPhone, contactEmail, address, city, state, role } = req.body;

    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!gstNumber || gstNumber.startsWith('PENDING_')) {
      return res.status(400).json({ message: 'A valid GST number is required' });
    }

    // Check if GST already registered by another company
    const gstExists = await Company.findOne({ gstNumber: gstNumber.toUpperCase(), _id: { $ne: company._id } });
    if (gstExists) {
      return res.status(400).json({ message: 'GST number already registered by another company' });
    }

    // Check if email already registered by another company if email is changed
    if (contactEmail && contactEmail.toLowerCase() !== company.contactEmail.toLowerCase()) {
      const emailExists = await Company.findOne({ contactEmail: contactEmail.toLowerCase(), _id: { $ne: company._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email address already registered by another company' });
      }
      company.contactEmail = contactEmail.toLowerCase();
    }

    // Update details
    company.name = name || `${contactPersonName || company.contactPersonName} Enterprise`;
    company.gstNumber = gstNumber.toUpperCase();
    company.companyType = companyType || company.companyType;
    company.contactPersonName = contactPersonName || company.contactPersonName;
    company.contactPhone = contactPhone || company.contactPhone;
    company.address = address || company.address;
    company.city = city || company.city;
    company.state = state || company.state;
    if (role) {
      company.role = role;
    }

    // Mark Google profile as completed
    company.googleProfileCompleted = true;
    // Keep PENDING status so they can upload document
    company.verificationStatus = 'PENDING';

    await company.save();

    const updated = await Company.findById(company._id).select('-passwordHash');

    return res.status(200).json({
      message: 'Google profile completed successfully',
      company: updated,
    });
  } catch (error) {
    next(error);
  }
};

const requestProfileUpdate = async (req, res, next) => {
  try {
    const { name, gstNumber, companyType, contactPersonName, contactPhone, contactEmail, address, city, state, role } = req.body;

    const company = await Company.findById(req.company._id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.pendingProfileUpdate && company.pendingProfileUpdate.hasPendingChange) {
      return res.status(400).json({ message: 'You already have a pending profile change request under review' });
    }

    if (!gstNumber) {
      return res.status(400).json({ message: 'GST number is required' });
    }

    // Validate GST format (only if changed)
    if (gstNumber.toUpperCase() !== (company.gstNumber || '').toUpperCase()) {
      const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
      if (!gstRegex.test(gstNumber.toUpperCase())) {
        return res.status(400).json({ message: 'Invalid Indian GSTIN format' });
      }
    }

    // Validate phone
    const phoneRegex = /^[6-9]\d{9}$/;
    if (contactPhone && !phoneRegex.test(contactPhone)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Check if GST is registered by another company (only if changed)
    if (gstNumber.toUpperCase() !== (company.gstNumber || '').toUpperCase()) {
      const gstExists = await Company.findOne({ gstNumber: gstNumber.toUpperCase(), _id: { $ne: company._id } });
      if (gstExists) {
        return res.status(400).json({ message: 'GST number is already registered by another company' });
      }
    }

    // Save the new details into pendingProfileUpdate
    company.pendingProfileUpdate = {
      name: name || company.name,
      gstNumber: gstNumber.toUpperCase(),
      companyType: companyType || company.companyType,
      contactPersonName: contactPersonName || company.contactPersonName,
      contactPhone: contactPhone || company.contactPhone,
      contactEmail: contactEmail || company.contactEmail,
      address: address || company.address,
      city: city || company.city,
      state: state || company.state,
      role: role || company.role,
      hasPendingChange: true
    };

    await company.save();

    const updated = await Company.findById(company._id).select('-passwordHash');

    return res.status(200).json({
      message: 'Profile update request submitted successfully. It will be reviewed by an administrator.',
      company: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMe,
  uploadVerificationDoc,
  resubmitVerification,
  viewVerificationDoc,
  switchToSeller,
  completeGoogleProfile,
  requestProfileUpdate,
};
