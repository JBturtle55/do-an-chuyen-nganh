const router  = require('express').Router();
const Voucher = require('../models/Voucher');
const { protect, isAdmin } = require('../middleware/auth');

// Helper: tính số tiền giảm từ voucher
function calcDiscount(voucher, orderAmount) {
  if (voucher.type === 'fixed') {
    return Math.min(voucher.value, orderAmount);
  }
  // percent
  const discount = Math.round(orderAmount * voucher.value / 100);
  if (voucher.maxDiscount > 0) return Math.min(discount, voucher.maxDiscount);
  return discount;
}

// POST /vouchers/validate — kiểm tra voucher (không áp dụng)
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ message: 'Vui lòng nhập mã voucher' });

    const voucher = await Voucher.findOne({ code: code.trim().toUpperCase() });
    if (!voucher) return res.status(404).json({ message: 'Mã voucher không tồn tại' });
    if (!voucher.isActive) return res.status(400).json({ message: 'Mã voucher đã bị vô hiệu hoá' });
    if (voucher.expiresAt && new Date() > voucher.expiresAt)
      return res.status(400).json({ message: 'Mã voucher đã hết hạn' });
    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit)
      return res.status(400).json({ message: 'Mã voucher đã hết lượt sử dụng' });
    if (amount && voucher.minOrder > 0 && amount < voucher.minOrder)
      return res.status(400).json({
        message: `Đơn hàng tối thiểu ${voucher.minOrder.toLocaleString('vi-VN')}đ để dùng mã này`,
      });

    const discount = calcDiscount(voucher, amount || 0);
    res.json({
      valid: true,
      discount,
      finalPrice: Math.max(0, (amount || 0) - discount),
      voucher: {
        code: voucher.code,
        description: voucher.description,
        type: voucher.type,
        value: voucher.value,
        maxDiscount: voucher.maxDiscount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /vouchers/public — voucher đang active, chưa hết hạn, còn lượt (public)
router.get('/public', async (req, res) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({
      isActive: true,
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
        { $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
      ],
    })
      .select('code description type value minOrder maxDiscount expiresAt')
      .sort('-createdAt')
      .limit(6)
      .lean();
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin CRUD ──────────────────────────────────────────────

// GET /vouchers — lấy tất cả voucher (admin)
router.get('/', protect, isAdmin, async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort('-createdAt');
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /vouchers — tạo voucher mới (admin)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.create(req.body);
    res.status(201).json(voucher);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: `Mã "${req.body.code}" đã tồn tại` });
    res.status(500).json({ message: err.message });
  }
});

// PUT /vouchers/:id — cập nhật voucher (admin)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!voucher) return res.status(404).json({ message: 'Không tìm thấy voucher' });
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /vouchers/:id — xoá voucher (admin)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xoá voucher' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.calcDiscount = calcDiscount;
