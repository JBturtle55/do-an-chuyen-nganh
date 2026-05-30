const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  trip:        { type: mongoose.Schema.Types.ObjectId, ref: 'Trip',    required: true },
  seats:       [{ type: Number }],    // danh sách số ghế VD: [3, 4]
  totalPrice:  { type: Number, required: true },
  passengerName:  { type: String, required: true },
  passengerPhone: { type: String, required: true },
  status:       { type: String, enum: ['pending','processing','confirmed','completed','cancelled'], default: 'pending' },
  refundStatus: { type: String, enum: ['none','pending','completed'], default: 'none' },
  discountAmount: { type: Number, default: 0 },
  voucherCode:    { type: String, default: '' },
  pointsUsed:     { type: Number, default: 0 },
  expiresAt:    { type: Date },
  paidAt:       { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
