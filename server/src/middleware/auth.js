const jwt = require('jsonwebtoken');
const Company = require('../models/Company');

const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers');

    const company = await Company.findById(decoded.id);
    if (!company) {
      return res.status(401).json({ message: 'Associated company not found' });
    }

    req.company = company;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const requireVerifiedCompany = (req, res, next) => {
  const { company } = req;
  
  if (!company) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!company.emailVerified) {
    return res.status(403).json({ message: 'Please verify your email address OTP first', step: 'EMAIL_VERIFICATION' });
  }

  if (company.verificationStatus === 'PENDING') {
    if (!company.verificationDocUrl) {
      return res.status(403).json({ message: 'Please upload business verification document', step: 'UPLOAD_DOCUMENT' });
    }
    return res.status(403).json({ message: 'Your verification is pending admin approval', step: 'PENDING_APPROVAL' });
  }

  if (company.verificationStatus === 'REJECTED') {
    return res.status(403).json({ 
      message: `Your company verification was rejected. Reason: ${company.rejectionReason || 'No details provided.'}`, 
      step: 'REJECTED',
      reason: company.rejectionReason 
    });
  }

  if (company.verificationStatus !== 'VERIFIED') {
    return res.status(403).json({ message: 'Access denied. Account not verified.', step: 'UNVERIFIED' });
  }

  next();
};

/**
 * Middleware to restrict routes to companies with SELLER or BOTH role.
 * Must be used AFTER authenticateJWT + requireVerifiedCompany.
 */
const requireSellerRole = (req, res, next) => {
  const { company } = req;

  if (!company) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (company.role !== 'SELLER' && company.role !== 'BOTH') {
    return res.status(403).json({
      message: 'Access denied. Only sellers can perform this action.',
      step: 'NOT_A_SELLER',
    });
  }
  next();
};

const optionalAuthenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers');

    const company = await Company.findById(decoded.id);
    if (company) {
      req.company = company;
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticateJWT,
  optionalAuthenticateJWT,
  requireVerifiedCompany,
  requireSellerRole,
};
