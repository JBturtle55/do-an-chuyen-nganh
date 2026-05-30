const router   = require('express').Router();
const Booking  = require('../models/Booking');
const Trip     = require('../models/Trip');
const Review   = require('../models/Review');
const { protect } = require('../middleware/auth');
const { broadcast } = require('../sseClients');
const { validate, required, isMongoId, isArray, isPhone, minLen, maxLen } = require('../middleware/validate');

// Đặt vé
router.post('/', protect,
  validate({
    tripId:         [required, isMongoId],
    seats:          [required, isArray],
    passengerName:  [required, minLen(2), maxLen(80)],
    passengerPhone: [required, isPhone],
  }),
  async (req, res) => {
  try {
    const { tripId, seats, passengerName, passengerPhone } = req.body;
    const trip = await Trip.findById(tripId).populate('bus');
    if (!trip) return res.status(404).json({ message: 'Không tìm thấy chuyến' });

    // Validate danh sách ghế
    const seatCount = trip.bus?.seatCount || 45;
    const uniqueSeats = [...new Set(seats.map(Number))];
    if (uniqueSeats.length !== seats.length)
      return res.status(400).json({ message: 'Danh sách ghế có số ghế trùng lặp' });
    const invalidSeats = uniqueSeats.filter(s => !Number.isInteger(s) || s < 1 || s > seatCount);
    if (invalidSeats.length)
      return res.status(400).json({ message: `Số ghế không hợp lệ: ${invalidSeats.join(', ')} (xe có ${seatCount} ghế)` });

    // Kiểm tra ghế đã được đặt chưa
    const bookedSeats = await Booking.find({
      trip: tripId,
      status: { $in: ['pending', 'processing', 'confirmed'] },
    }).distinct('seats');
    const conflict = uniqueSeats.filter(s => bookedSeats.includes(s));
    if (conflict.length)
      return res.status(400).json({ message: `Ghế ${conflict.join(', ')} đã được đặt` });

    // Áp dụng flash sale nếu còn hiệu lực
    const now = new Date();
    const effectivePrice = (trip.salePercent > 0 && trip.saleEndsAt && now < trip.saleEndsAt)
      ? Math.round(trip.price * (1 - trip.salePercent / 100))
      : trip.price;
    const totalPrice = effectivePrice * seats.length;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const booking = await Booking.create({
      user: req.user.id,
      trip: tripId,
      seats,
      totalPrice,
      passengerName,
      passengerPhone,
      expiresAt
    });

    // Trừ số ghế còn lại
    await Trip.findByIdAndUpdate(tripId, {
      $inc: { availableSeats: -seats.length }
    });

    broadcast(tripId, { type: 'seats_updated' });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xem lịch sử đặt vé của user đang đăng nhập
router.get('/me', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({ path: 'trip', populate: ['route', 'bus'] })
      .sort('-createdAt');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Xem chi tiết 1 booking (dùng cho trang checkout) — phải đặt SAU /me
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id })
      .populate({ path: 'trip', populate: ['route', 'bus'] });
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy vé' });

    // Tự động huỷ booking hết hạn
    if (booking.status === 'pending' && booking.expiresAt && new Date() > booking.expiresAt) {
      await Booking.findByIdAndUpdate(booking._id, { status: 'cancelled' });
      await Trip.findByIdAndUpdate(booking.trip._id, { $inc: { availableSeats: booking.seats.length } });
      booking.status = 'cancelled';
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Huỷ vé
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy vé' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Vé đã huỷ rồi' });

    const wasConfirmed = booking.status === 'confirmed';
    booking.status = 'cancelled';

    if (wasConfirmed) {
      const Payment           = require('../models/Payment');
      const User              = require('../models/User');
      const WalletTransaction = require('../models/WalletTransaction');
      const PointTransaction  = require('../models/PointTransaction');

      const payment = await Payment.findOne({ booking: booking._id, status: 'success' });

      // Hoàn tiền về ví nếu thanh toán FASTPAY
      if (payment?.method === 'wallet') {
        const user = await User.findByIdAndUpdate(
          booking.user,
          { $inc: { walletBalance: booking.totalPrice } },
          { new: true }
        );
        await WalletTransaction.create({
          user:        booking.user,
          type:        'refund',
          amount:      booking.totalPrice,
          balance:     user.walletBalance,
          description: 'Hoàn tiền vé đã huỷ',
          booking:     booking._id,
        });
        booking.refundStatus = 'completed';
      } else {
        booking.refundStatus = 'pending';
      }

      // Xử lý điểm thưởng liên quan đến booking
      const pointTxs = await PointTransaction.find({ booking: booking._id });
      if (pointTxs.length > 0) {
        let pointDelta = 0;
        for (const tx of pointTxs) {
          // earn: đã tích điểm → trừ lại; redeem: đã dùng điểm → hoàn lại
          pointDelta += tx.type === 'earn' ? -tx.points : tx.points;
        }
        if (pointDelta !== 0) {
          const updatedUser = await User.findByIdAndUpdate(
            booking.user,
            { $inc: { loyaltyPoints: pointDelta } },
            { new: true }
          );
          await PointTransaction.create({
            user:        booking.user,
            type:        pointDelta > 0 ? 'earn' : 'redeem',
            points:      Math.abs(pointDelta),
            balance:     updatedUser.loyaltyPoints,
            description: 'Điều chỉnh điểm do huỷ vé',
            booking:     booking._id,
          });
        }
      }
    }

    await booking.save();

    // Hoàn lại ghế
    await Trip.findByIdAndUpdate(booking.trip, {
      $inc: { availableSeats: booking.seats.length }
    });

    broadcast(booking.trip.toString(), { type: 'seats_updated' });
    res.json({ message: 'Huỷ vé thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Gửi đánh giá chuyến đi
router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating phải từ 1 đến 5' });

    const booking = await Booking.findById(req.params.id).populate({ path: 'trip', populate: 'bus' });
    if (!booking)
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    if (booking.user.toString() !== req.user.id.toString())
      return res.status(403).json({ message: 'Không có quyền' });
    if (!['confirmed', 'completed'].includes(booking.status))
      return res.status(400).json({ message: 'Chỉ có thể đánh giá chuyến đã thanh toán' });

    const existing = await Review.findOne({ booking: booking._id });
    if (existing)
      return res.status(409).json({ message: 'Bạn đã đánh giá nhà xe này rồi' });

    const busId = booking.trip.bus._id;
    await Review.create({
      user:    req.user.id,
      booking: booking._id,
      bus:     busId,
      rating:  Number(rating),
      comment: (comment || '').trim().slice(0, 500),
    });

    // Cập nhật avgRating + reviewCount trên Bus (denormalized)
    const Bus = require('../models/Bus');
    const agg = await Review.aggregate([
      { $match: { bus: busId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (agg.length > 0) {
      await Bus.findByIdAndUpdate(busId, {
        avgRating:   Math.round(agg[0].avg * 10) / 10,
        reviewCount: agg[0].count,
      });
    }

    res.status(201).json({ message: 'Đánh giá thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy đánh giá của 1 booking (để check đã đánh giá chưa)
router.get('/:id/review', protect, async (req, res) => {
  try {
    const review = await Review.findOne({ booking: req.params.id }).lean();
    res.json(review || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
