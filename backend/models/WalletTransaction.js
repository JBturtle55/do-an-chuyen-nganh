const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['topup', 'withdraw', 'payment', 'refund'], required: true },
  amount:      { type: Number, required: true },   // luôn dương
  balance:     { type: Number, required: true },   // số dư SAU giao dịch
  description: { type: String, default: '' },
  booking:     { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  vnpayTxnId:  { type: String, unique: true, sparse: true }, // VNPay transactionNo, dùng để idempotent
}, { timestamps: true });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
