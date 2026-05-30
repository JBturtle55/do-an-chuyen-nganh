const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking:   { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  amount:    { type: Number, required: true },
  method:    { type: String, enum: ['vnpay','wallet'], required: true },
  status:    { type: String, enum: ['pending','success','failed'], default: 'pending' },
  transactionId: { type: String, unique: true, sparse: true },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
