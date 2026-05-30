const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  type:        { type: String, enum: ['percent', 'fixed'], required: true },
  value:       { type: Number, required: true },   // % hoặc số tiền cố định
  minOrder:    { type: Number, default: 0 },        // đơn hàng tối thiểu
  maxDiscount: { type: Number, default: 0 },        // giảm tối đa (chỉ áp dụng cho type=percent, 0=không giới hạn)
  usageLimit:  { type: Number, default: 0 },        // tổng số lần dùng (0=không giới hạn)
  usedCount:   { type: Number, default: 0 },
  expiresAt:   { type: Date, default: null },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
