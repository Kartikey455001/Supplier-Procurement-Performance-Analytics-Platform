import express from 'express';
import { login, getMe, logout, getAllUsers } from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, requireRole('admin'), getAllUsers);

export default router;
