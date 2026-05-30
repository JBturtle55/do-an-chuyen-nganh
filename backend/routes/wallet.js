const router = require('express').Router();
const User              = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { protect }       = require('../middleware/auth');

const MIN_TOPUP    = 10_000;
const MAX_TOPUP    = 50_000_000;
const MIN_WITHDRAW = 10_000;

// GET /wallet — số dư + lịch sử giao dịch
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    const transactions = await WalletTransaction.find({ user: req.user.id })
      .sort('-createdAt').limit(50)
      .populate('booking', 'passengerName seats totalPrice');
    res.json({ balance: user.walletBalance, transactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /wallet/topup — nạp tiền
router.post('/topup', protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount < MIN_TOPUP)
      return res.status(400).json({ message: `Số tiền nạp tối thiểu ${MIN_TOPUP.toLocaleString('vi-VN')}đ` });
    if (amount > MAX_TOPUP)
      return res.status(400).json({ message: `Số tiền nạp tối đa ${MAX_TOPUP.toLocaleString('vi-VN')}đ` });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { walletBalance: amount } },
      { new: true }
    );

    const tx = await WalletTransaction.create({
      user:        req.user.id,
      type:        'topup',
      amount,
      balance:     user.walletBalance,
      description: 'Nạp tiền vào ví FASTPAY',
    });

    res.json({ balance: user.walletBalance, transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /wallet/withdraw — rút tiền
router.post('/withdraw', protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!amount || amount < MIN_WITHDRAW)
      return res.status(400).json({ message: `Số tiền rút tối thiểu ${MIN_WITHDRAW.toLocaleString('vi-VN')}đ` });

    const user = await User.findOneAndUpdate(
      { _id: req.user.id, walletBalance: { $gte: amount } },
      { $inc: { walletBalance: -amount } },
      { new: true }
    );
    if (!user) return res.status(400).json({ message: 'Số dư không đủ để rút' });

    const tx = await WalletTransaction.create({
      user:        req.user.id,
      type:        'withdraw',
      amount,
      balance:     user.walletBalance,
      description: 'Rút tiền từ ví FASTPAY',
    });

    res.json({ balance: user.walletBalance, transaction: tx });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
