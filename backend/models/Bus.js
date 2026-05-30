const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  plate:      { type: String, required: true, unique: true },
  seatCount:  { type: Number, required: true },
  type:       { type: String, enum: ['ghế', 'giường', 'limousine'], default: 'ghế' },
  image:      { type: String },
  avgRating:  { type: Number, default: 0 },
  reviewCount:{ type: Number, default: 0 },
  seatLayout: { type: String, default: '' },
  amenities:  { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);
