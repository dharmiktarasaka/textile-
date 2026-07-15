/**
 * Global Express Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]:', err);

  // Check for Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const displayField = field === 'gstNumber' ? 'GST Number' : field === 'contactEmail' ? 'Email' : field;
    return res.status(400).json({
      message: `${displayField} already exists in our system.`,
    });
  }

  // Check for Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: 'Validation failed',
      errors,
    });
  }

  // Check for JWT Verification Error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token signature' });
  }

  // Fallback to internal server error
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
