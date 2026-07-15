const { z } = require('zod');

// GSTIN Regex format (India): 15-digit alphanumeric
// 2 digits for state code, 5 uppercase letters, 4 numbers, 1 letter, 1 digit/letter, 'Z', 1 digit/letter
const gstRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;

// Indian phone number validator (10 digits)
const phoneRegex = /^[6-9]\d{9}$/;

const signupSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  gstNumber: z
    .string()
    .toUpperCase()
    .trim()
    .regex(gstRegex, 'Invalid GST number format (should be 15 characters, e.g. 24AAAAC1234A1Z1)'),
  companyType: z.enum(['MILL', 'TRADER', 'RECYCLER', 'EXPORTER', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid company type selected' }),
  }),
  contactPersonName: z.string().min(2, 'Contact person name is required'),
  contactEmail: z.string().email('Invalid email address').trim().toLowerCase(),
  contactPhone: z.string().regex(phoneRegex, 'Invalid contact phone number (10-digit required, starting with 6-9)'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  role: z.enum(['SELLER', 'BUYER', 'BOTH']).optional().default('BOTH'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  otp: z.string().length(6, 'OTP must be exactly 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

module.exports = {
  signupSchema,
  verifyOtpSchema,
  loginSchema,
};
