const jwt = require('jsonwebtoken');

// Kiểm tra user đã đăng nhập chưa
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  if (!token) return res.status(401).json({ message: 'Không có token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // gắn thông tin user vào request
    next();
  } catch {
    res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Kiểm tra user có phải admin không
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ message: 'Không có quyền admin' });
  next();
};

module.exports = { protect, isAdmin };
