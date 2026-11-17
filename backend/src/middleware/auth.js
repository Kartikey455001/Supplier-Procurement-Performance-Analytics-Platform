// Authentication & authorization bypassed - direct access enabled
export function authenticateToken(req, res, next) {
  req.user = {
    id: 1,
    full_name: 'Procurement Admin',
    username: 'admin',
    email: 'admin@jewellery-analytics.com',
    role: 'admin',
    department: 'Procurement & Supply Chain'
  };
  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    next();
  };
}
