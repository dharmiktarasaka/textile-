const jwt = require('jsonwebtoken');

const authenticateAdminJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Admin authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    // Use the same JWT_SECRET or a fallback
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkeyforcompanyusers');

    if (decoded.role !== 'admin' || decoded.email !== (process.env.ADMIN_EMAIL || 'admin@textilewastehub.com')) {
      return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Admin session expired' });
    }
    return res.status(401).json({ message: 'Invalid admin token' });
  }
};

module.exports = {
  authenticateAdminJWT,
};
