const jwt = require('jsonwebtoken');

/**
 * Mock S3 / Storage Service.
 * Simulates uploading files to private buckets and generating secure signed URLs.
 */

const getSignedUrl = (filename, companyId) => {
  if (!filename) return null;

  // Generate a short-lived token specifically for viewing this file
  const token = jwt.sign(
    { filename, companyId, purpose: 'view_doc' },
    process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers',
    { expiresIn: '15m' }
  );

  const serverUrl = process.env.S3_ENDPOINT || 'http://localhost:5000/api/company';
  // Returns a secure endpoint url that routes through the server authentication logic
  return `${serverUrl}/view/${filename}?token=${token}`;
};

module.exports = {
  getSignedUrl,
};
