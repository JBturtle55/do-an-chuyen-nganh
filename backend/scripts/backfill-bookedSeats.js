// One-off: populate Trip.bookedSeats từ các booking active hiện có (pending/processing/confirmed)
// Chạy: cd backend && node scripts/backfill-bookedSeats.js
require('dotenv').config();
const mongoose = require('mongoose');
const Trip     = require('../models/Trip');
const Booking  = require('../models/Booking');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/booking-xe');
  const agg = await Booking.aggregate([
    { $match: { status: { $in: ['pending', 'processing', 'confirmed'] } } },
    { $unwind: '$seats' },
    { $group: { _id: '$trip', seats: { $addToSet: '$seats' } } },
  ]);

  let updated = 0;
  for (const row of agg) {
    if (!row._id) continue;
    await Trip.updateOne({ _id: row._id }, { $set: { bookedSeats: row.seats } });
    updated++;
  }

  console.log(`[Backfill] ${updated} trip có booking active đã set bookedSeats (tổng ${agg.length} nhóm).`);
  await mongoose.disconnect();
  process.exit(0);
})().catch(err => { console.error('[Backfill] Lỗi:', err); process.exit(1); });
