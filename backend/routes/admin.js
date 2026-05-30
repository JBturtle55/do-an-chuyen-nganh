const router      = require('express').Router();
const Booking     = require('../models/Booking');
const Trip        = require('../models/Trip');
const User        = require('../models/User');
const Bus         = require('../models/Bus');
const Route       = require('../models/Route');
const ChatMessage      = require('../models/ChatMessage');
const ChatConversation = require('../models/ChatConversation');
const jwt              = require('jsonwebtoken');
const multer      = require('multer');
const path        = require('path');
const { protect, isAdmin } = require('../middleware/auth');
const { addAdminClient, removeAdminClient, broadcastToUser } = require('../chatSSE');

// Cấu hình multer upload ảnh — chỉ chấp nhận image, tối đa 5MB
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, ...)'));
  },
});

// Tất cả admin routes đều cần protect + isAdmin
router.use(protect, isAdmin);
// Xác nhận booking
router.put('/bookings/:id/confirm', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Thống kê tổng quan
router.get('/stats', async (req, res) => {
  try {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate()-1);
    const yesterdayEnd   = new Date(todayEnd);   yesterdayEnd.setDate(yesterdayEnd.getDate()-1);

    const [
      totalBookings, totalUsers, totalTrips, totalBuses,
      pendingBookings, confirmedBookings, cancelledBookings,
      revenueAgg,
      todayBookings, todayRevAgg,
      yesterdayBookings, yesterdayRevAgg,
    ] = await Promise.all([
      Booking.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Trip.countDocuments(),
      Bus.countDocuments(),
      Booking.countDocuments({ status: { $in: ['pending', 'processing'] } }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.aggregate([{ $match:{ status:'confirmed' } }, { $group:{ _id:null, total:{ $sum:'$totalPrice' } } }]),
      Booking.countDocuments({ createdAt:{ $gte:todayStart, $lte:todayEnd } }),
      Booking.aggregate([{ $match:{ status:'confirmed', createdAt:{ $gte:todayStart, $lte:todayEnd } } }, { $group:{ _id:null, total:{ $sum:'$totalPrice' } } }]),
      Booking.countDocuments({ createdAt:{ $gte:yesterdayStart, $lte:yesterdayEnd } }),
      Booking.aggregate([{ $match:{ status:'confirmed', createdAt:{ $gte:yesterdayStart, $lte:yesterdayEnd } } }, { $group:{ _id:null, total:{ $sum:'$totalPrice' } } }]),
    ]);

    const totalRevenue    = revenueAgg[0]?.total || 0;
    const todayRevenue    = todayRevAgg[0]?.total || 0;
    const yesterdayRevenue= yesterdayRevAgg[0]?.total || 0;

    // Doanh thu 14 ngày gần nhất
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });

    const revenueByDay = await Promise.all(last14.map(async date => {
      const start = new Date(date);
      const end   = new Date(date); end.setDate(end.getDate() + 1);
      const agg = await Booking.aggregate([
        { $match: { status:'confirmed', createdAt:{ $gte:start, $lt:end } } },
        { $group: { _id:null, revenue:{ $sum:'$totalPrice' }, count:{ $sum:1 } } }
      ]);
      return { date, revenue: agg[0]?.revenue||0, count: agg[0]?.count||0 };
    }));

    // Top 5 tuyến đường đặt nhiều nhất
    const topRoutes = await Booking.aggregate([
      { $match: { status:{ $ne:'cancelled' } } },
      { $lookup: { from:'trips', localField:'trip', foreignField:'_id', as:'tripData' } },
      { $unwind: '$tripData' },
      { $lookup: { from:'routes', localField:'tripData.route', foreignField:'_id', as:'routeData' } },
      { $unwind: '$routeData' },
      { $group: { _id:'$routeData._id', from:{ $first:'$routeData.from' }, to:{ $first:'$routeData.to' }, count:{ $sum:1 }, revenue:{ $sum:'$totalPrice' } } },
      { $sort: { count:-1 } },
      { $limit: 5 }
    ]);

    // Đặt vé gần nhất (8 cái)
    const recentBookingsList = await Booking.find()
      .populate('user', 'name email')
      .populate({ path:'trip', populate:['route','bus'] })
      .sort('-createdAt').limit(8);

    res.json({
      totalBookings, totalUsers, totalTrips, totalBuses,
      pendingBookings, confirmedBookings, cancelledBookings,
      totalRevenue, revenueByDay,
      todayBookings, todayRevenue,
      yesterdayBookings, yesterdayRevenue,
      topRoutes, recentBookingsList,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Huỷ booking (từ phía admin)
router.put('/bookings/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });

    // Hoàn lại ghế
    await Trip.findByIdAndUpdate(booking.trip, {
      $inc: { availableSeats: booking.seats.length }
    });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Xem tất cả booking
router.get('/bookings', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const { status, search } = req.query;

    let filter = {};
    if (status && status !== 'all') filter.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email phone')
        .populate({ path: 'trip', populate: ['route', 'bus'] })
        .sort('-createdAt').skip(skip).limit(limit),
      Booking.countDocuments(filter),
    ]);

    // Lọc search theo tên/SĐT phía app sau khi populate (tránh lookup phức tạp)
    const filtered = search
      ? bookings.filter(b =>
          b.passengerName?.toLowerCase().includes(search.toLowerCase()) ||
          b.passengerPhone?.includes(search))
      : bookings;

    res.json({ bookings: filtered, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xem tất cả user (có pagination)
router.get('/users', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find().select('-password').sort('-createdAt').skip(skip).limit(limit),
      User.countDocuments(),
    ]);
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hoàn tiền — lấy danh sách cần hoàn
// ?status=pending|completed (mặc định pending)
router.get('/refunds', async (req, res) => {
  try {
    const status = req.query.status === 'completed' ? 'completed' : 'pending';
    const bookings = await Booking.find({ refundStatus: status })
      .populate('user', 'name email phone')
      .populate({ path: 'trip', populate: ['route', 'bus'] })
      .sort('-updatedAt')
      .limit(200);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hoàn tiền — xác nhận đã hoàn
router.put('/bookings/:id/refund', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, { refundStatus: 'completed' }, { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy booking' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xoá user (admin)
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ message: 'Không thể xoá chính mình' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    res.json({ message: 'Đã xoá user' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cập nhật thông tin user (admin)
router.put('/users/:id', async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CRUD Bus
router.get('/buses', async (req, res) => res.json(await Bus.find()));
router.post('/buses', upload.single('image'), async (req, res) => {
  try {
    const { name, plate, seatCount, type, seatLayout } = req.body;
    let amenities = req.body.amenities;
    if (typeof amenities === 'string') {
      try { amenities = JSON.parse(amenities); } catch { amenities = amenities ? [amenities] : []; }
    }
    const data = { name, plate, seatCount, type, seatLayout, amenities: amenities || [] };
    if (req.file) data.image = '/uploads/' + req.file.filename;
    const bus = await Bus.create(data);
    res.status(201).json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/buses/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, plate, seatCount, type, seatLayout } = req.body;
    let amenities = req.body.amenities;
    if (typeof amenities === 'string') {
      try { amenities = JSON.parse(amenities); } catch { amenities = amenities ? [amenities] : []; }
    }
    const data = { name, plate, seatCount, type, seatLayout, amenities: amenities || [] };
    if (req.file) data.image = '/uploads/' + req.file.filename;
    const bus = await Bus.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete('/buses/:id', async (req, res) => {
  await Bus.findByIdAndDelete(req.params.id);
  res.json({ message: 'Đã xoá' });
});

// CRUD Route
router.get('/routes', async (req, res) => res.json(await Route.find()));
router.post('/routes', async (req, res) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json(route);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/routes/:id', async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(route);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete('/routes/:id', async (req, res) => {
  await Route.findByIdAndDelete(req.params.id);
  res.json({ message: 'Đã xoá' });
});

// ── Chat admin ───────────────────────────────────────────────

// SSE cho admin (EventSource không gửi được header → dùng token query)
router.get('/chat/events', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role');
    if (!user || user.role !== 'admin') return res.status(403).end();
  } catch (_) { return res.status(401).end(); }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');

  addAdminClient(res);
  const ka = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) {} }, 25000);
  req.on('close', () => { clearInterval(ka); removeAdminClient(res); });
});

// Tổng số tin nhắn chưa đọc (từ user) để hiện badge
router.get('/chat/unread-count', async (req, res) => {
  try {
    const count = await ChatMessage.countDocuments({ sender: 'user', read: false });
    res.json({ count });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Danh sách hội thoại — group by conversationId, hỗ trợ cả logged-in và guest
// ?status=active|completed (mặc định active)
router.get('/chat/conversations', async (req, res) => {
  try {
    const statusFilter = req.query.status === 'completed' ? 'completed' : 'active';

    const convos = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: {
          _id:         '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unread:      { $sum: { $cond: [{ $and: [{ $eq: ['$sender','user'] }, { $eq: ['$read',false] }] }, 1, 0] } },
      }},
      // Lookup trạng thái hội thoại
      { $lookup: { from: 'chatconversations', localField: '_id', foreignField: 'conversationId', as: 'conv' } },
      // Lọc theo status (active nếu chưa có record trong chatconversations)
      { $match: {
        $expr: {
          $cond: [
            { $eq: [statusFilter, 'completed'] },
            { $eq: [{ $ifNull: [{ $arrayElemAt: ['$conv.status', 0] }, 'active'] }, 'completed'] },
            { $ne: [{ $ifNull: [{ $arrayElemAt: ['$conv.status', 0] }, 'active'] }, 'completed'] },
          ]
        }
      }},
      { $lookup: { from: 'users', localField: 'lastMessage.userId', foreignField: '_id', as: 'user' } },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);
    res.json(convos);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Đánh dấu hoàn thành cuộc hội thoại
router.put('/chat/:conversationId/complete', async (req, res) => {
  try {
    await ChatConversation.findOneAndUpdate(
      { conversationId: req.params.conversationId },
      { status: 'completed', completedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Mở lại cuộc hội thoại (reopen)
router.put('/chat/:conversationId/reopen', async (req, res) => {
  try {
    await ChatConversation.findOneAndUpdate(
      { conversationId: req.params.conversationId },
      { status: 'active', completedAt: null },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Lịch sử chat theo conversationId
router.get('/chat/:conversationId', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 }).lean();
    await ChatMessage.updateMany(
      { conversationId: req.params.conversationId, sender: 'user', read: false },
      { read: true }
    );
    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Admin trả lời theo conversationId
router.post('/chat/:conversationId/reply', async (req, res) => {
  try {
    const content = req.body.content?.trim();
    if (!content) return res.status(400).json({ message: 'Nội dung không được để trống' });
    const msg = await ChatMessage.create({
      conversationId: req.params.conversationId,
      sender:         'admin',
      content:        content.slice(0, 1000),
    });
    broadcastToUser(req.params.conversationId, { type: 'new_message', message: msg });
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── CSV Export: xuất báo cáo đặt vé ─────────────────────
router.get('/bookings/export', async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (from) filter.createdAt = { ...filter.createdAt, $gte: new Date(from) };
    if (to)   filter.createdAt = { ...filter.createdAt, $lte: new Date(to + 'T23:59:59') };

    const bookings = await Booking.find(filter)
      .populate({ path: 'trip', populate: ['route', 'bus'] })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const rows = [
      ['Ma ve', 'Khach hang', 'Email', 'SDT', 'Tuyen', 'Gio di', 'So ghe', 'Gia', 'Voucher', 'Diem dung', 'Phuong thuc', 'Trang thai', 'Ngay dat'].join(','),
      ...bookings.map(b => [
        ('FB' + b._id.toString().slice(-8)).toUpperCase(),
        b.passengerName || '',
        b.user?.email || '',
        b.passengerPhone || '',
        b.trip?.route ? `${b.trip.route.from} - ${b.trip.route.to}` : '',
        b.trip?.departureTime ? new Date(b.trip.departureTime).toLocaleString('vi-VN') : '',
        (b.seats || []).join(' '),
        b.totalPrice || 0,
        b.voucherCode || '',
        b.pointsUsed || 0,
        '',
        b.status,
        new Date(b.createdAt).toLocaleString('vi-VN'),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="fastbus-bookings-${Date.now()}.csv"`);
    res.send('﻿' + rows.join('\r\n')); // BOM for Excel UTF-8
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
