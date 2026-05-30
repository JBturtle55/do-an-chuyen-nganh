const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  from:      { type: String, required: true },
  to:        { type: String, required: true },
  distance:  { type: Number },           // km
  duration:  { type: Number },           // phút
  basePrice: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
