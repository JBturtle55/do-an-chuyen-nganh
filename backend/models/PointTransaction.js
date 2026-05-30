const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['earn', 'redeem'], required: true },
  points:      { type: Number, required: true },   // luôn dương
  balance:     { type: Number, required: true },   // số điểm SAU giao dịch
  description: { type: String, default: '' },
  booking:     { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
}, { timestamps: true });

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
