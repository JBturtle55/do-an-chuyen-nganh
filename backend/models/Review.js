const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  bus:     { type: mongoose.Schema.Types.ObjectId, ref: 'Bus',     required: true, index: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 500 },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
