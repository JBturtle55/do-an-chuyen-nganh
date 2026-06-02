const router           = require('express').Router();
const jwt              = require('jsonwebtoken');
const User             = require('../models/User');
const ChatMessage      = require('../models/ChatMessage');
const ChatConversation = require('../models/ChatConversation');
const { addUserClient, removeUserClient, broadcastToAdmins } = require('../chatSSE');
const { getAIReply } = require('../aiChat');

// Middleware lấy user nếu có token, không bắt buộc
async function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (_) {}
  next();
}

function getIdentity(req) {
  const convId = req.body?.conversationId || req.query?.conversationId;
  if (req.user) {
    return {
      conversationId: convId || req.user._id.toString(),  // id phiên; fallback userId (tương thích cũ)
      userId:         req.user._id,
      guestId:        null,
      guestName:      null,
      senderName:     req.user.name,
      isGuest:        false,
    };
  }
  const guestId    = convId || req.body?.guestId || req.query?.guestId;
  const guestName  = req.body?.guestName  || 'Khách';
  const guestPhone = req.body?.guestPhone || null;
  const guestEmail = req.body?.guestEmail || null;
  if (!guestId) return null;
  return {
    conversationId: guestId,
    userId:         null,
    guestId,
    guestName,
    guestPhone,
    guestEmail,
    senderName:     guestName,
    isGuest:        true,
  };
}

// User đăng nhập gửi conversationId tuỳ ý → chặn đọc/ghi vào hội thoại của người khác.
// Hội thoại "của mình" = chưa có tin user nào (mới tinh) HOẶC tin user có userId trùng.
async function ownsConversation(req, conversationId) {
  if (!req.user) return true;  // khách: ranh giới là guestId ngẫu nhiên
  const claim = await ChatMessage.findOne({ conversationId, userId: { $ne: null } }).select('userId').lean();
  return !claim || claim.userId.toString() === req.user._id.toString();
}

// GET /api/chat/messages
router.get('/messages', optionalAuth, async (req, res) => {
  try {
    const id = getIdentity(req);
    if (!id) return res.json([]);
    if (!(await ownsConversation(req, id.conversationId))) return res.json([]);
    const messages = await ChatMessage.find({ conversationId: id.conversationId })
      .sort({ createdAt: 1 }).lean();
    await ChatMessage.updateMany(
      { conversationId: id.conversationId, sender: 'admin', read: false },
      { read: true }
    );
    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/chat/messages — gửi tin nhắn đến admin (human support)
router.post('/messages', optionalAuth, async (req, res) => {
  try {
    const id = getIdentity(req);
    if (!id) return res.status(400).json({ message: 'Thiếu conversationId' });
    if (!(await ownsConversation(req, id.conversationId)))
      return res.status(403).json({ message: 'Không có quyền với hội thoại này' });
    const content = req.body.content?.trim();
    if (!content) return res.status(400).json({ message: 'Nội dung không được để trống' });

    const msg = await ChatMessage.create({
      conversationId: id.conversationId,
      userId:         id.userId,
      guestId:        id.guestId,
      guestName:      id.guestName,
      guestPhone:     id.guestPhone,
      guestEmail:     id.guestEmail,
      sender:         'user',
      content:        content.slice(0, 1000),
    });
    // Nếu hội thoại đã được đánh dấu hoàn thành → tự động mở lại
    await ChatConversation.findOneAndUpdate(
      { conversationId: id.conversationId, status: 'completed' },
      { status: 'active', completedAt: null }
    );

    broadcastToAdmins({
      type:           'new_message',
      conversationId: id.conversationId,
      senderName:     id.senderName,
      isGuest:        id.isGuest,
      message:        msg,
    });
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/chat/ai — chatbot AI (trả lời đồng bộ, không lưu DB)
router.post('/ai', optionalAuth, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Thiếu nội dung' });

    const result = await getAIReply(message.trim(), history);
    if (!result?.text) return res.status(503).json({ message: 'AI không khả dụng' });

    res.json({ reply: result.text, action: result.action || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/status — trạng thái cuộc hội thoại (active/completed)
router.get('/status', optionalAuth, async (req, res) => {
  try {
    const id = getIdentity(req);
    if (!id) return res.json({ status: 'active' });
    const conv = await ChatConversation.findOne({ conversationId: id.conversationId });
    res.json({ status: conv?.status || 'active' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/chat/unread
router.get('/unread', optionalAuth, async (req, res) => {
  try {
    const id = getIdentity(req);
    if (!id) return res.json({ count: 0 });
    const count = await ChatMessage.countDocuments({
      conversationId: id.conversationId, sender: 'admin', read: false,
    });
    res.json({ count });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/chat/events — SSE realtime
router.get('/events', async (req, res) => {
  let conversationId;
  const { token, guestId, conversationId: cid } = req.query;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('_id');
      if (!user) return res.status(401).end();
      conversationId = cid || user._id.toString();
      // ownership: không cho subscribe hội thoại của người khác
      const claim = await ChatMessage.findOne({ conversationId, userId: { $ne: null } }).select('userId').lean();
      if (claim && claim.userId.toString() !== user._id.toString()) return res.status(403).end();
    } catch (_) { return res.status(401).end(); }
  } else if (cid || guestId) {
    conversationId = cid || guestId;
  } else {
    return res.status(400).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');

  addUserClient(conversationId, res);
  const ka = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) {} }, 25000);
  req.on('close', () => { clearInterval(ka); removeUserClient(conversationId, res); });
});

module.exports = router;
