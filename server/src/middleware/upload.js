const multer = require('multer');
const path = require('path');
const fs = require('fs');

let storage;

const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  try {
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'textilewastehub',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
        public_id: (req, file) => {
          const companyId = req.company?._id || 'anonymous';
          const timestamp = Date.now();
          const originalName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_');
          return `doc-${companyId}-${timestamp}-${originalName}`;
        }
      },
    });
    console.log('Cloudinary Storage configured successfully.');
  } catch (err) {
    console.error('Failed to initialize Cloudinary storage, falling back to disk:', err.message);
  }
}

if (!storage) {
  // Fallback to local disk storage
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const companyId = req.company?._id || 'anonymous';
      const timestamp = Date.now();
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `doc-${companyId}-${timestamp}${extension}`);
    },
  });
  console.log('Local disk storage configured.');
}

// File filter (Only allow PDFs, PNG, JPG, JPEG)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDFs, PNG, JPG, or JPEG images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

module.exports = upload;
