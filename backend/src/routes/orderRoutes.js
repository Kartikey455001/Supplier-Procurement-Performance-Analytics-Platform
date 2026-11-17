import express from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  receiveOrderGoods,
  deleteOrder
} from '../controllers/orderController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAllOrders);
router.get('/:id', authenticateToken, getOrderById);
router.post('/', authenticateToken, requireRole('admin'), createOrder);
router.put('/:id/status', authenticateToken, requireRole('admin'), updateOrderStatus);
router.put('/:id/receive', authenticateToken, requireRole('admin'), receiveOrderGoods);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteOrder);

export default router;
