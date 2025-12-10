import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure bulk upload directory exists
const bulkUploadDir = path.join(__dirname, '../../uploads/bulk/');
if (!fs.existsSync(bulkUploadDir)) {
    fs.mkdirSync(bulkUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, bulkUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'bulk-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /csv|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const mimetype = mimetypes.includes(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Only CSV and Excel files are allowed'));
};

export const bulkUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
