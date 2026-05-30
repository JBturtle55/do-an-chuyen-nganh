const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  slug:      { type: String, required: true, unique: true },
  excerpt:   { type: String },           // tóm tắt ngắn
  content:   { type: String, required: true },
  thumbnail: { type: String },           // URL ảnh bìa
  category:  { type: String, default: 'Tin tức' },
  published: { type: Boolean, default: false },
  author:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
