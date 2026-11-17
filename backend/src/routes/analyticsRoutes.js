import express from 'express';
import {
  getDashboardOverview,
  getSupplierPerformanceAnalytics,
  getCostAnalytics,
  getQualityDeliveryAnalytics
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', authenticateToken, getDashboardOverview);
router.get('/suppliers', authenticateToken, getSupplierPerformanceAnalytics);
router.get('/cost', authenticateToken, getCostAnalytics);
router.get('/quality-delivery', authenticateToken, getQualityDeliveryAnalytics);

export default router;
