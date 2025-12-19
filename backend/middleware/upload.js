import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads directory (employees folder)
const storagePath = path.join(__dirname, '../uploads/employees');
if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });

// Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'others';
    if (file.fieldname === 'passport') folder = 'employees/passport';
    else if (file.fieldname === 'workPassApplication') folder = 'employees/workpass';
    else if (file.fieldname === 'qualifications') folder = 'employees/qualifications';
    else if (file.fieldname === 'certifications') folder = 'employees/certifications';
    else if (file.fieldname === 'documents') folder = 'employees/documents';

    const dir = path.join(storagePath, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});


// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Invalid file type: ${file.originalname}`), false);
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Export helpers for single/multiple field handling
export const uploadSingle = (fieldName) => upload.single(fieldName);

// Upload multiple files for a single field
export const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

// Upload multiple named fields at once for employee form
export const uploadEmployeeFiles = upload.fields([
  { name: 'passport', maxCount: 1 },
  { name: 'workPassApplication', maxCount: 1 },
  { name: 'workPassMedical', maxCount: 1 },
  { name: 'workPassIssuance', maxCount: 1 },
  { name: 'workPassMOM', maxCount: 1 },
  { name: 'qualifications', maxCount: 10 },
  { name: 'certifications', maxCount: 10 },
  { name: 'documents', maxCount: 10 },
]);

export default upload;
