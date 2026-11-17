import express from 'express';
import { generateReport, exportReportCsv } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, generateReport);
router.get('/export-csv', authenticateToken, exportReportCsv);

export default router;
