const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  route:         { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  bus:           { type: mongoose.Schema.Types.ObjectId, ref: 'Bus',   required: true },
  departureTime: { type: Date, required: true },
  arrivalTime:   { type: Date },
  price:         { type: Number, required: true },
  availableSeats:{ type: Number },
  status:        { type: String, enum: ['scheduled','cancelled','completed'], default: 'scheduled' },
  salePercent:   { type: Number, default: 0, min: 0, max: 100 },
  saleEndsAt:    { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
