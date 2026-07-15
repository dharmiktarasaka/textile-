const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const Category = require('../models/Category');
const CategoryRequest = require('../models/CategoryRequest');
const Listing = require('../models/Listing');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const s3Service = require('../services/s3Service');
const { sendEmail } = require('../services/emailService');
const { matchAndNotify } = require('../services/matchService');


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@textilewastehub.com';

    if (email !== adminEmail) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const adminHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminHash) {
      return res.status(500).json({ message: 'Admin password configuration missing on server' });
    }

    const isMatch = await bcrypt.compare(password, adminHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { email: adminEmail, role: 'admin' },
      process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers',
      { expiresIn: '2d' }
    );

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: { email: adminEmail },
    });
  } catch (error) {
    next(error);
  }
};

const getCompanies = async (req, res, next) => {
  try {
    const { status, hasProfileUpdate } = req.query;
    const filter = {};

    if (hasProfileUpdate === 'true') {
      filter['pendingProfileUpdate.hasPendingChange'] = true;
    } else if (status) {
      filter.verificationStatus = status;
    }

    const companies = await Company.find(filter).select('-passwordHash').sort({ createdAt: -1 });
    return res.status(200).json({ companies });
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).select('-passwordHash');
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Generate signed URL for GST verification document
    let signedDocUrl = null;
    if (company.verificationDocUrl) {
      signedDocUrl = s3Service.getSignedUrl(company.verificationDocUrl, company._id);
    }

    return res.status(200).json({
      company,
      signedDocUrl,
    });
  } catch (error) {
    next(error);
  }
};

const approveCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.verificationStatus === 'VERIFIED') {
      return res.status(400).json({ message: 'Company is already verified' });
    }

    company.verificationStatus = 'VERIFIED';
    company.rejectionReason = null;
    company.verifiedAt = new Date();
    await company.save();

    // Create Audit Log
    await AuditLog.create({
      adminId: req.admin.email,
      action: 'APPROVE_COMPANY',
      targetCompanyId: company._id,
    });

    // Create notifications (In App + Email)
    const title = 'Account Verified Successfully';
    const message = 'Your company registration has been approved! You now have full access to the B2B marketplace.';

    await Notification.create({
      companyId: company._id,
      title,
      message,
      channel: 'in_app',
    });

    await Notification.create({
      companyId: company._id,
      title,
      message,
      channel: 'email',
    });

    // Send actual email
    await sendEmail({
      to: company.contactEmail,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #10b981; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Verification Approved</h2>
          <p>Hello ${company.contactPersonName},</p>
          <p>We are pleased to inform you that your company <strong>${company.name}</strong> has been successfully verified by our administrators.</p>
          <p>You can now log into the portal to post your textile waste listings, browse active trades, submit contact requests, and interact with other verified textile enterprises.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Marketplace</a></p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">Thank you,<br/>TextileWasteHub Administrator Team</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: 'Company approved successfully',
      company,
    });
  } catch (error) {
    next(error);
  }
};

const rejectCompany = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.verificationStatus === 'VERIFIED') {
      return res.status(400).json({ message: 'Cannot reject an already verified company' });
    }

    company.verificationStatus = 'REJECTED';
    company.rejectionReason = reason;
    await company.save();

    // Create Audit Log
    await AuditLog.create({
      adminId: req.admin.email,
      action: 'REJECT_COMPANY',
      targetCompanyId: company._id,
      reason,
    });

    // Create notifications (In App + Email)
    const title = 'Account Registration Rejected';
    const message = `Your company registration was rejected. Reason: ${reason}. Please update your business details or re-upload your GST verification documents.`;

    await Notification.create({
      companyId: company._id,
      title,
      message,
      channel: 'in_app',
    });

    await Notification.create({
      companyId: company._id,
      title,
      message,
      channel: 'email',
    });

    // Send actual email
    await sendEmail({
      to: company.contactEmail,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #ef4444; text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Verification Rejected</h2>
          <p>Hello ${company.contactPersonName},</p>
          <p>We regret to inform you that your company verification request for <strong>${company.name}</strong> was rejected by our compliance team.</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <strong>Reason for Rejection:</strong><br/>
            ${reason}
          </div>
          <p>Please log into your dashboard, update your profile info or re-upload valid business registration / GST records for approval review.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Update Registration Details</a></p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">Thank you,<br/>TextileWasteHub Administrator Team</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: 'Company rejected successfully',
      company,
    });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({})
      .populate('targetCompanyId', 'name gstNumber contactEmail')
      .sort({ createdAt: -1 });
    return res.status(200).json({ logs });
  } catch (error) {
    next(error);
  }
};

// Admin categories management
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    return res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, fieldSchema } = req.body;

    if (!name || !slug || !fieldSchema) {
      return res.status(400).json({ message: 'Name, Slug, and Field Schema are required' });
    }

    const category = await Category.create({ name, slug, description, fieldSchema });
    return res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, slug, description, fieldSchema, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (fieldSchema) category.fieldSchema = fieldSchema;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    return res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    next(error);
  }
};

// Admin monitoring
const getListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({})
      .populate('companyId', 'name city state verificationStatus')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
    return res.status(200).json({ listings });
  } catch (error) {
    next(error);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    return res.status(200).json({ message: 'Listing deleted successfully by administrator' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending listings
 */
const getPendingListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ status: 'PENDING' })
      .populate('companyId', 'name city state contactEmail verificationStatus')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });
    return res.status(200).json({ listings });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a pending listing and trigger matching engine
 */
const approveListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('companyId', 'name contactEmail')
      .populate('categoryId', 'name');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.status !== 'PENDING') {
      return res.status(400).json({ message: `Listing is already ${listing.status.toLowerCase()}` });
    }

    listing.status = 'ACTIVE';
    await listing.save();

    // Trigger the matching engine now that it's approved
    matchAndNotify(listing).catch(err => console.error('Match engine error:', err));

    // Notify the seller
    const title = 'Product Listing Approved';
    const message = `Your product "${listing.title}" has been approved and is now live on the marketplace.`;

    await Notification.create({
      listingId: listing._id,
      companyId: listing.companyId._id,
      title,
      message,
      channel: 'in_app',
    });

    await Notification.create({
      listingId: listing._id,
      companyId: listing.companyId._id,
      title,
      message,
      channel: 'email',
    });

    return res.status(200).json({
      message: 'Listing approved and is now active',
      listing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a pending listing
 */
const rejectListing = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const listing = await Listing.findById(req.params.id)
      .populate('companyId', 'name contactEmail');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    if (listing.status !== 'PENDING') {
      return res.status(400).json({ message: `Listing is already ${listing.status.toLowerCase()}` });
    }

    listing.status = 'REJECTED';
    listing.rejectionReason = reason || 'Product photos or details do not meet our quality guidelines.';
    await listing.save();

    // Notify the seller
    const title = 'Product Listing Rejected';
    const message = `Your product "${listing.title}" was not approved. Reason: ${listing.rejectionReason}`;

    await Notification.create({
      listingId: listing._id,
      companyId: listing.companyId._id,
      title,
      message,
      channel: 'in_app',
    });

    await Notification.create({
      listingId: listing._id,
      companyId: listing.companyId._id,
      title,
      message,
      channel: 'email',
    });

    return res.status(200).json({
      message: 'Listing rejected',
      listing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all category requests (admin view)
 */
const getCategoryRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await CategoryRequest.find(filter)
      .populate('suggestedBy', 'name city state contactEmail')
      .populate('approvedCategoryId', 'name')
      .sort({ createdAt: -1 });
    return res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a category request → auto-creates Category in DB
 */
const approveCategoryRequest = async (req, res, next) => {
  try {
    const request = await CategoryRequest.findById(req.params.id)
      .populate('suggestedBy', 'name contactEmail');

    if (!request) {
      return res.status(404).json({ message: 'Category request not found' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${request.status.toLowerCase()}` });
    }

    // Build a sensible default slug from the name
    const slug = request.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    // Check if category with same slug already exists
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(409).json({
        message: `A category with slug "${slug}" already exists. Please update the existing one instead.`,
      });
    }

    // Create the new Category with a generic but usable default fieldSchema
    const newCategory = await Category.create({
      name: request.name,
      slug,
      description: request.description || `${request.name} — seller-suggested category`,
      fieldSchema: {
        materialType: { type: 'string', required: false },
        quantityKg: { type: 'number', required: true },
        priceExpectationPerKg: { type: 'number', required: false },
        colors: { type: 'array', required: false },
        location: { type: 'string', required: true },
        description: { type: 'string', required: false },
      },
      isActive: true,
    });

    // Update request status
    request.status = 'APPROVED';
    request.approvedCategoryId = newCategory._id;
    await request.save();

    // Notify the suggesting company
    const title = 'Category Suggestion Approved';
    const message = `Your suggested category "${request.name}" has been approved and is now live on the marketplace!`;

    await Notification.create({
      companyId: request.suggestedBy._id,
      title,
      message,
      channel: 'in_app',
    });

    await Notification.create({
      companyId: request.suggestedBy._id,
      title,
      message,
      channel: 'email',
    });

    return res.status(200).json({
      message: `Category "${request.name}" approved and created successfully.`,
      category: newCategory,
      request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a category request with a reason
 */
const rejectCategoryRequest = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const request = await CategoryRequest.findById(req.params.id)
      .populate('suggestedBy', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Category request not found' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${request.status.toLowerCase()}` });
    }

    request.status = 'REJECTED';
    request.rejectionReason = reason || 'Does not meet marketplace category guidelines.';
    await request.save();

    // Notify the suggesting company
    const title = 'Category Suggestion Rejected';
    const message = `Your suggested category "${request.name}" was not approved. Reason: ${request.rejectionReason}`;

    await Notification.create({
      companyId: request.suggestedBy._id,
      title,
      message,
      channel: 'in_app',
    });

    await Notification.create({
      companyId: request.suggestedBy._id,
      title,
      message,
      channel: 'email',
    });

    return res.status(200).json({
      message: `Category request rejected.`,
      request,
    });
  } catch (error) {
    next(error);
  }
};

const approveCompanyProfileUpdate = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const pending = company.pendingProfileUpdate;
    if (!pending || !pending.hasPendingChange) {
      return res.status(400).json({ message: 'No pending profile update found' });
    }

    // Apply updates
    company.name = pending.name || company.name;
    company.gstNumber = pending.gstNumber ? pending.gstNumber.toUpperCase() : company.gstNumber;
    company.companyType = pending.companyType || company.companyType;
    company.contactPersonName = pending.contactPersonName || company.contactPersonName;
    company.contactPhone = pending.contactPhone || company.contactPhone;
    company.contactEmail = pending.contactEmail || company.contactEmail;
    company.address = pending.address || company.address;
    company.city = pending.city || company.city;
    company.state = pending.state || company.state;
    if (pending.role) {
      company.role = pending.role;
    }

    // Reset pending profile updates
    company.pendingProfileUpdate = {
      hasPendingChange: false
    };

    await company.save();

    // Create Audit Log
    await AuditLog.create({
      adminId: req.admin.email,
      action: 'APPROVE_PROFILE_UPDATE',
      targetCompanyId: company._id,
    });

    // Send email to user
    await sendEmail({
      to: company.contactEmail,
      subject: 'Company Profile Update Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #10b981; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Profile Update Approved</h2>
          <p>Hello ${company.contactPersonName},</p>
          <p>We are pleased to inform you that your request to update your business profile details for <strong>${company.name}</strong> has been successfully reviewed and approved by our administrators.</p>
          <p>Your details have been officially updated on the TextileWasteHub B2B marketplace.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Portal</a></p>
        </div>
      `
    });

    return res.status(200).json({
      message: 'Profile update approved successfully',
      company
    });
  } catch (error) {
    next(error);
  }
};

const rejectCompanyProfileUpdate = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const pending = company.pendingProfileUpdate;
    if (!pending || !pending.hasPendingChange) {
      return res.status(400).json({ message: 'No pending profile update found' });
    }

    // Reset pending
    company.pendingProfileUpdate = {
      hasPendingChange: false
    };

    await company.save();

    // Create Audit Log
    await AuditLog.create({
      adminId: req.admin.email,
      action: 'REJECT_PROFILE_UPDATE',
      targetCompanyId: company._id,
    });

    // Send email to user
    await sendEmail({
      to: company.contactEmail,
      subject: 'Company Profile Update Rejected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #ef4444; text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Profile Update Rejected</h2>
          <p>Hello ${company.contactPersonName},</p>
          <p>Your request to update the business profile details for <strong>${company.name}</strong> was declined by the administrator.</p>
          ${reason ? `<p><strong>Reason for rejection:</strong> ${reason}</p>` : ''}
          <p>Please log in and submit correct details if needed.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Portal</a></p>
        </div>
      `
    });

    return res.status(200).json({
      message: 'Profile update rejected successfully',
      company
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getCompanies,
  getCompanyById,
  approveCompany,
  rejectCompany,
  getAuditLogs,
  getCategories,
  createCategory,
  updateCategory,
  getListings,
  deleteListing,
  getCategoryRequests,
  approveCategoryRequest,
  rejectCategoryRequest,
  getPendingListings,
  approveListing,
  rejectListing,
  approveCompanyProfileUpdate,
  rejectCompanyProfileUpdate,
};
