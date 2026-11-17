import express from 'express';
import multer from 'multer';
import { previewCsvUpload, commitCsvImport, downloadTemplate } from '../controllers/importController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/preview', authenticateToken, upload.single('file'), previewCsvUpload);
router.post('/commit', authenticateToken, requireRole('admin'), upload.single('file'), commitCsvImport);
router.get('/template/:templateName', authenticateToken, downloadTemplate);

export default router;
