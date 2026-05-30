const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // conversationId = userId.toString() nếu đã đăng nhập, hoặc guestId nếu khách
  conversationId: { type: String, required: true, index: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestId:        { type: String, default: null },
  guestName:      { type: String, default: null },
  guestPhone:     { type: String, default: null },
  guestEmail:     { type: String, default: null },
  sender:         { type: String, enum: ['user', 'admin', 'bot'], required: true },
  content:        { type: String, required: true, maxlength: 1000 },
  read:           { type: Boolean, default: false },
}, { timestamps: true });

schema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', schema);
