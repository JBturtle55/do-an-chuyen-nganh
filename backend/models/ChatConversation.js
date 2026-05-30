const mongoose = require('mongoose');

// Lưu trạng thái cuộc hội thoại (active/completed)
const schema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true, index: true },
  status:         { type: String, enum: ['active', 'completed'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('ChatConversation', schema);
