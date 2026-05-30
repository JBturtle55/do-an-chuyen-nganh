const router = require('express').Router();
const Post   = require('../models/Post');
const { protect, isAdmin } = require('../middleware/auth');

// Helper tạo slug từ title
function makeSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
    + '-' + Date.now();
}

// GET /posts - lấy bài đã published (public)
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    const filter = { published: true };
    if (category) filter.category = category;
    const posts = await Post.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));
    const total = await Post.countDocuments(filter);
    res.json({ posts, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /posts/:slug - chi tiết bài (public)
router.get('/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, published: true })
      .populate('author', 'name');
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Admin routes ---

// GET /posts/admin/all - lấy tất cả (cả draft) cho admin
router.get('/admin/all', protect, isAdmin, async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /posts - tạo bài mới
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { title, excerpt, content, thumbnail, category, published } = req.body;
    const slug = makeSlug(title);
    const post = await Post.create({
      title, slug, excerpt, content, thumbnail,
      category: category || 'Tin tức',
      published: !!published,
      author: req.user._id,
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /posts/:id - cập nhật
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { title, excerpt, content, thumbnail, category, published } = req.body;
    const update = { excerpt, content, thumbnail, category, published };
    if (title) { update.title = title; update.slug = makeSlug(title); }
    const post = await Post.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /posts/:id
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xoá bài viết' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
