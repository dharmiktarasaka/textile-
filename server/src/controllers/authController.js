const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const OTP = require('../models/OTP');
const { signupSchema, verifyOtpSchema, loginSchema } = require('../validators/authValidator');
const { sendEmail } = require('../services/emailService');

// Helper to generate a random 6-digit numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const signup = async (req, res, next) => {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.errors.map((e) => e.message),
      });
    }

    const {
      name,
      gstNumber,
      companyType,
      contactPersonName,
      contactEmail,
      contactPhone,
      address,
      city,
      state,
      role,
      password,
    } = parseResult.data;

    // Check email uniqueness
    const emailExists = await Company.findOne({ contactEmail });
    if (emailExists) {
      return res.status(400).json({ message: 'Email address already registered' });
    }

    // Check GST uniqueness
    const gstExists = await Company.findOne({ gstNumber });
    if (gstExists) {
      return res.status(400).json({ message: 'GST number already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create company in PENDING status
    const newCompany = await Company.create({
      name,
      gstNumber,
      companyType,
      contactPersonName,
      contactEmail,
      contactPhone,
      address,
      city,
      state,
      role,
      passwordHash,
      verificationStatus: 'PENDING',
      emailVerified: false,
    });

    // Generate & Hash OTP
    const rawOtp = generateOTP();
    const otpSalt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, otpSalt);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await OTP.create({
      email: contactEmail,
      otpHash,
      expiresAt,
    });

    // Send OTP email
    await sendEmail({
      to: contactEmail,
      subject: 'Verify your email OTP - TextileWasteHub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #0f172a; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px;">TextileWasteHub</h2>
          <p>Hello ${contactPersonName},</p>
          <p>Thank you for registering your company <strong>${name}</strong> on TextileWasteHub B2B portal. Please use the verification code below to verify your email address:</p>
          <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 4px; color: #10b981; background: #f8fafc; padding: 10px;">
            ${rawOtp}
          </div>
          <p>This OTP is valid for 15 minutes. If you did not request this code, please ignore this email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an automated message, please do not reply.</p>
        </div>
      `,
    });

    // Generate initial access token
    const token = jwt.sign(
      { id: newCompany._id },
      process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful. Verification OTP sent to email.',
      token,
      company: {
        id: newCompany._id,
        name: newCompany.name,
        contactEmail: newCompany.contactEmail,
        emailVerified: newCompany.emailVerified,
        verificationStatus: newCompany.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.errors.map((e) => e.message),
      });
    }

    const { email, otp } = parseResult.data;

    // Find the latest active OTP
    const latestOtp = await OTP.findOne({ email, used: false }).sort({ createdAt: -1 });
    if (!latestOtp) {
      return res.status(400).json({ message: 'No OTP request found for this email' });
    }

    if (new Date() > latestOtp.expiresAt) {
      return res.status(400).json({ message: 'OTP has expired, please request a new one' });
    }

    // Compare Hash
    const isMatch = await bcrypt.compare(otp, latestOtp.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    // Update Company emailVerified status
    const company = await Company.findOneAndUpdate(
      { contactEmail: email },
      { emailVerified: true },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Associated company not found' });
    }

    // Mark OTP as used
    latestOtp.used = true;
    await latestOtp.save();

    // Generate verified company JWT
    const token = jwt.sign(
      { id: company._id },
      process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return res.status(200).json({
      message: 'Email verified successfully',
      token,
      company: {
        id: company._id,
        name: company.name,
        contactEmail: company.contactEmail,
        emailVerified: company.emailVerified,
        verificationStatus: company.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.errors.map((e) => e.message),
      });
    }

    const { email, password } = parseResult.data;

    const company = await Company.findOne({ contactEmail: email });
    if (!company) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, company.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: company._id },
      process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      company: {
        id: company._id,
        name: company.name,
        contactEmail: company.contactEmail,
        emailVerified: company.emailVerified,
        verificationStatus: company.verificationStatus,
        verificationDocUrl: company.verificationDocUrl,
        rejectionReason: company.rejectionReason,
      },
    });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const company = await Company.findOne({ contactEmail: email });
    if (!company) {
      return res.status(404).json({ message: 'Company account not found with this email' });
    }

    if (company.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Delete any previous active OTPs for this email to avoid clutter
    await OTP.deleteMany({ email });

    // Generate & Hash new OTP
    const rawOtp = generateOTP();
    const otpSalt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, otpSalt);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await OTP.create({
      email,
      otpHash,
      expiresAt,
    });

    // Send the email with the new OTP
    await sendEmail({
      to: email,
      subject: 'Verify your email OTP - TextileWasteHub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #0f172a; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px;">TextileWasteHub</h2>
          <p>Hello ${company.contactPersonName},</p>
          <p>A new email verification OTP has been generated for your registration. Please use the code below to complete your verification:</p>
          <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 4px; color: #10b981; background: #f8fafc; padding: 10px;">
            ${rawOtp}
          </div>
          <p>This OTP is valid for 15 minutes. If you did not request this, you can ignore this email.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">This is an automated message, please do not reply.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: 'A new verification OTP has been sent to your email.' });
  } catch (error) {
    next(error);
  }
};

const verifyFirebaseToken = async (idToken, projectId) => {
  let certsResponse;
  try {
    certsResponse = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  } catch (err) {
    throw new Error(`Connection failed to Google certificate server: ${err.message}`);
  }

  if (!certsResponse.ok) {
    throw new Error(`Google certificate server returned HTTP ${certsResponse.status} ${certsResponse.statusText}`);
  }
  const publicKeys = await certsResponse.json();

  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error('Invalid token format');
  }

  const kid = decoded.header.kid;
  const publicKey = publicKeys[kid];
  if (!publicKey) {
    throw new Error(`Public key not found for kid "${kid}". Available kids in Google certs: ${Object.keys(publicKeys).join(', ')}`);
  }

  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`
  });

  return payload;
};

const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Firebase token is required' });
    }

    let payload;
    try {
      const rawProjectId = process.env.FIREBASE_PROJECT_ID || '';
      const configuredProjectId = rawProjectId.trim();
      const skipAudience = !configuredProjectId || configuredProjectId.includes('your-project-id-here');
      
      if (skipAudience) {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || !decoded.header || !decoded.header.kid) {
          throw new Error('Invalid token format');
        }
        
        let certsResponse;
        try {
          certsResponse = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
        } catch (err) {
          throw new Error(`Connection failed to Google certificate server: ${err.message}`);
        }

        if (!certsResponse.ok) {
          throw new Error(`Google certificate server returned HTTP ${certsResponse.status} ${certsResponse.statusText}`);
        }
        
        const publicKeys = await certsResponse.json();
        const publicKey = publicKeys[decoded.header.kid];
        if (!publicKey) {
          throw new Error(`Public key not found for kid "${decoded.header.kid}". Available kids in Google certs: ${Object.keys(publicKeys).join(', ')}`);
        }
        payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
      } else {
        payload = await verifyFirebaseToken(token, configuredProjectId);
      }
    } catch (err) {
      console.error('Firebase token verification failed:', err.message);
      return res.status(400).json({ message: `Invalid Firebase token: ${err.message}` });
    }

    const { email, email_verified } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Firebase token does not contain email' });
    }

    if (email_verified !== true && email_verified !== 'true') {
      return res.status(400).json({ message: 'Firebase email is not verified' });
    }

    // Find the company matching the google email
    let company = await Company.findOne({ contactEmail: email });
    if (!company) {
      // Auto-register a new company with PENDING status. They will be forced to complete onboarding details first.
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const mockGst = `PENDING_${randomSuffix}`; // Temporary GST placeholder prefix
      const displayName = payload.name || email.split('@')[0];
      
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(Math.random().toString(36), salt);

      company = await Company.create({
        name: `${displayName} Enterprise`,
        gstNumber: mockGst,
        companyType: 'OTHER',
        contactPersonName: displayName,
        contactEmail: email,
        contactPhone: '0000000000',
        address: 'Please enter your address',
        city: 'Please enter your city',
        state: 'Please enter your state',
        role: 'BOTH',
        passwordHash: passwordHash,
        verificationStatus: 'PENDING',
        emailVerified: true,
        googleProfileCompleted: false // User must complete profile details manually
      });
    } else {
      // Automatically mark email verified for existing companies since Google verified it
      if (!company.emailVerified) {
        company.emailVerified = true;
        await company.save();
      }
    }

    const jwtToken = jwt.sign(
      { id: company._id },
      process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token: jwtToken,
      company: {
        id: company._id,
        name: company.name,
        contactEmail: company.contactEmail,
        emailVerified: company.emailVerified,
        verificationStatus: company.verificationStatus,
        verificationDocUrl: company.verificationDocUrl,
        rejectionReason: company.rejectionReason,
        googleProfileCompleted: company.googleProfileCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  verifyOtp,
  login,
  resendOtp,
  googleLogin,
};
