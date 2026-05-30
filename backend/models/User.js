const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String },
  googleId:  { type: String },
  phone:     { type: String },
  role:           { type: String, enum: ['user', 'admin'], default: 'user' },
  walletBalance:  { type: Number, default: 0 },
  loyaltyPoints:  { type: Number, default: 0 },
  resetOtp:       { type: String },
  resetOtpExpires:{ type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
