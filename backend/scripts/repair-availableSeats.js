// Repair: availableSeats = bus.seatCount - (số ghế active đã đặt) cho mọi scheduled trip.
// Sửa drift seed cũ + drift do các bug huỷ/hết-hạn trước đây. Idempotent.
// Chạy: cd backend && node scripts/repair-availableSeats.js
require('dotenv').config();
const mongoose = require('mongoose');
const Trip     = require('../models/Trip');
const Booking  = require('../models/Booking');
require('../models/Bus');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/booking-xe');

  // Đếm số ghế active theo từng trip
  const agg = await Booking.aggregate([
    { $match: { status: { $in: ['pending', 'processing', 'confirmed'] } } },
    { $unwind: '$seats' },
    { $group: { _id: '$trip', seats: { $addToSet: '$seats' } } },
  ]);
  const bookedCount = new Map(agg.map(r => [String(r._id), r.seats.length]));

  const trips = await Trip.find({ status: 'scheduled' }).populate('bus', 'seatCount').lean();
  const ops = [];
  let changed = 0;
  for (const t of trips) {
    const cap = t.bus?.seatCount || 45;
    const want = cap - (bookedCount.get(String(t._id)) || 0);
    if (t.availableSeats !== want) {
      ops.push({ updateOne: { filter: { _id: t._id }, update: { $set: { availableSeats: want } } } });
      changed++;
    }
  }
  if (ops.length) await Trip.bulkWrite(ops);

  console.log(`[Repair] Quét ${trips.length} scheduled trip | sửa availableSeats: ${changed}`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(err => { console.error('[Repair] Lỗi:', err.message); process.exit(1); });
