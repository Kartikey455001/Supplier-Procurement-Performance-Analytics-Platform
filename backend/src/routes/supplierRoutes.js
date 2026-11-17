import express from 'express';
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../controllers/supplierController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAllSuppliers);
router.get('/:id', authenticateToken, getSupplierById);
router.post('/', authenticateToken, requireRole('admin'), createSupplier);
router.put('/:id', authenticateToken, requireRole('admin'), updateSupplier);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteSupplier);

export default router;
