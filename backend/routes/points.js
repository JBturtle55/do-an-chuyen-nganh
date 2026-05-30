const router           = require('express').Router();
const User             = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const { protect }      = require('../middleware/auth');

// GET /points — số điểm + lịch sử
router.get('/', protect, async (req, res) => {
  try {
    const [user, transactions] = await Promise.all([
      User.findById(req.user.id, 'loyaltyPoints'),
      PointTransaction.find({ user: req.user.id })
        .sort('-createdAt').limit(50),
    ]);
    res.json({ points: user?.loyaltyPoints || 0, transactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
