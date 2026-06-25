const router     = require('express').Router();
const Trip       = require('../models/Trip');
const Bus        = require('../models/Bus');
const Review     = require('../models/Review');
const { protect, isAdmin } = require('../middleware/auth');
const { addClient, removeClient } = require('../sseClients');

// Lấy tất cả chuyến (có thể lọc theo from, to, date)
router.get('/', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    let filter = { status: 'scheduled' };

    // Lọc theo ngày nếu có
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.departureTime = { $gte: start, $lte: end };
    }

    const trips = await Trip.find(filter)
      .populate('route')
      .populate('bus')
      .sort('departureTime');

    let result = trips;
    if (from) result = result.filter(t => t.route.from.toLowerCase().includes(from.toLowerCase()));
    if (to)   result = result.filter(t => t.route.to.toLowerCase().includes(to.toLowerCase()));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy chi tiết 1 chuyến
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('route').populate('bus');
    if (!trip) return res.status(404).json({ message: 'Không tìm thấy chuyến' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tạo hàng loạt chuyến (admin)
router.post('/bulk', protect, isAdmin, async (req, res) => {
  try {
    const { routeId, busId, times, startDate, endDate, daysOfWeek, price, availableSeats } = req.body;
    if (!routeId || !busId || !times?.length || !startDate || !endDate) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const bus = await Bus.findById(busId).lean();
    if (!bus) return res.status(404).json({ message: 'Không tìm thấy xe' });
    const seats = availableSeats ?? bus.seatCount;

    const trips = [];
    const start = new Date(startDate);
    const end   = new Date(endDate);
    const allowedDays = daysOfWeek?.length ? daysOfWeek.map(Number) : [0,1,2,3,4,5,6];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (!allowedDays.includes(d.getDay())) continue;
      for (const time of times) {
        const [h, m] = time.split(':').map(Number);
        const dep = new Date(d);
        dep.setHours(h, m, 0, 0);
        trips.push({ route: routeId, bus: busId, departureTime: dep, price, availableSeats: seats });
      }
    }

    if (!trips.length) return res.status(400).json({ message: 'Không có ngày nào phù hợp' });
    const created = await Trip.insertMany(trips);
    res.status(201).json({ count: created.length, message: `Đã tạo ${created.length} chuyến xe` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Tạo chuyến mới (admin)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { route, bus: busId, departureTime, price, availableSeats, salePercent, saleEndsAt } = req.body;
    const bus = await Bus.findById(busId).lean();
    if (!bus) return res.status(404).json({ message: 'Không tìm thấy xe' });
    const trip = await Trip.create({
      route, bus: busId, departureTime, price,
      availableSeats: availableSeats ?? bus.seatCount,
      ...(salePercent  !== undefined && { salePercent }),
      ...(saleEndsAt   !== undefined && { saleEndsAt }),
    });
    res.status(201).json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sửa chuyến (admin)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    // populate route + bus để frontend render đúng tên tuyến / số ghế sau khi cập nhật
    const trip = await Trip.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('route').populate('bus');
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xoá chuyến (admin)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xoá chuyến' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy danh sách đánh giá nhà xe của 1 chuyến (public)
router.get('/:id/reviews', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).select('bus').lean();
    if (!trip) return res.status(404).json({ message: 'Không tìm thấy chuyến' });
    const reviews = await Review.find({ bus: trip.bus })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SSE — realtime seat updates
router.get('/:id/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');

  const tripId = req.params.id;
  addClient(tripId, res);

  const keepAlive = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_) {}
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeClient(tripId, res);
  });
});

// Lấy danh sách ghế đã đặt của 1 chuyến
router.get('/:id/booked-seats', async (req, res) => {
  try {
    const bookings = await require('../models/Booking').find({
      trip: req.params.id,
      status: { $in: ['pending', 'processing', 'confirmed'] }
    }).select('seats status');

    // Trả về object: { confirmed: [1,3,5], pending: [2,4], processing: [6] }
    const result = { confirmed: [], pending: [], processing: [] };
    bookings.forEach(b => {
      const key = b.status === 'processing' ? 'processing' : b.status;
      b.seats.forEach(seat => result[key].push(seat));
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
