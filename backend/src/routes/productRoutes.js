import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  getCategories
} from '../controllers/productController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/categories', authenticateToken, getCategories);
router.get('/', authenticateToken, getAllProducts);
router.get('/:id', authenticateToken, getProductById);
router.post('/', authenticateToken, requireRole('admin'), createProduct);
router.put('/:id', authenticateToken, requireRole('admin'), updateProduct);

export default router;
