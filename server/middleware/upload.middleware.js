import multer, { diskStorage } from 'multer';
import { join, extname as _extname, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create profile uploads directory if it doesn't exist
const profileUploadDir = join(__dirname, '../uploads/profiles');
if (!existsSync(profileUploadDir)) {
  mkdirSync(profileUploadDir, { recursive: true });
}

// Create event uploads directory if it doesn't exist
const eventUploadDir = join(__dirname, '../uploads/events');
if (!existsSync(eventUploadDir)) {
  mkdirSync(eventUploadDir, { recursive: true });
}

// Configure storage for profile pictures
const profileStorage = diskStorage({
  destination: function(req, file, cb) {
    cb(null, profileUploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = _extname(file.originalname);
    cb(null, req.user.id + '-' + uniqueSuffix + ext);
  }
});

// Configure storage for event images
const eventStorage = diskStorage({
  destination: function(req, file, cb) {
    cb(null, eventUploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = _extname(file.originalname);
    cb(null, 'event-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif/;
  const extname = allowedFileTypes.test(_extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer for profile pictures
const uploadProfile = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

// Configure multer for event images
const uploadEvent = multer({
  storage: eventStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: fileFilter
});

export { uploadProfile, uploadEvent };