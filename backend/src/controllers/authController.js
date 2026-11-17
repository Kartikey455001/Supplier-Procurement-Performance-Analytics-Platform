import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const DEFAULT_USER = {
  user_id: 1,
  id: 1,
  username: 'admin',
  email: 'admin@jewellery-analytics.com',
  full_name: 'Procurement Admin',
  role: 'admin',
  department: 'Procurement & Supply Chain',
  is_active: 1
};

export async function login(req, res) {
  res.json({
    success: true,
    message: 'Authentication bypassed.',
    token: 'direct-access-token',
    user: DEFAULT_USER
  });
}

export async function getMe(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, username, email, full_name, role, department, is_active, created_at FROM Users LIMIT 1'
    );
    res.json({
      success: true,
      user: rows[0] || DEFAULT_USER
    });
  } catch (error) {
    res.json({
      success: true,
      user: DEFAULT_USER
    });
  }
}

export async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully.' });
}

export async function getAllUsers(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT user_id, username, email, full_name, role, department, is_active, created_at FROM Users ORDER BY created_at ASC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
}
