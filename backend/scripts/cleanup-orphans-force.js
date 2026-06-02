// Xoá TẤT CẢ dữ liệu orphan bất kể status (trip→bus/route đã xoá, booking→trip đã xoá).
// Cascade: Payment/WalletTransaction/PointTransaction/Review của các booking bị xoá.
// Chạy: cd backend && node scripts/cleanup-orphans-force.js
require('dotenv').config();
const mongoose = require('mongoose');
const Trip    = require('../models/Trip');
const Bus     = require('../models/Bus');
const Route   = require('../models/Route');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');
const PointTransaction  = require('../models/PointTransaction');
const Review  = require('../models/Review');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/booking-xe');

  const busIds   = new Set((await Bus.find({}, '_id').lean()).map(b => String(b._id)));
  const routeIds = new Set((await Route.find({}, '_id').lean()).map(r => String(r._id)));
  const trips    = await Trip.find({}, 'bus route').lean();
  const orphanTripIds = trips.filter(t => !busIds.has(String(t.bus)) || !routeIds.has(String(t.route))).map(t => t._id);

  const allBk = await Booking.find({}, 'trip').lean();
  // booking bị xoá = thuộc orphan trip HOẶC trip đã không còn tồn tại
  const validTripIds = new Set(trips.map(t => String(t._id)));
  const orphanTripIdSet = new Set(orphanTripIds.map(String));
  const delBookingIds = allBk
    .filter(b => orphanTripIdSet.has(String(b.trip)) || !validTripIds.has(String(b.trip)))
    .map(b => b._id);

  const [pay, wt, pt, rv] = await Promise.all([
    Payment.deleteMany({ booking: { $in: delBookingIds } }),
    WalletTransaction.deleteMany({ booking: { $in: delBookingIds } }),
    PointTransaction.deleteMany({ booking: { $in: delBookingIds } }),
    Review.deleteMany({ booking: { $in: delBookingIds } }),
  ]);
  const delBk   = await Booking.deleteMany({ _id: { $in: delBookingIds } });
  const delTrip = await Trip.deleteMany({ _id: { $in: orphanTripIds } });

  console.log('=== FORCE CLEANUP ORPHANS ===');
  console.log('Trip orphan xoá:', delTrip.deletedCount);
  console.log('Booking orphan xoá (mọi status):', delBk.deletedCount);
  console.log('Cascade → Payment:', pay.deletedCount, '| Wallet:', wt.deletedCount, '| Point:', pt.deletedCount, '| Review:', rv.deletedCount);

  await mongoose.disconnect();
  process.exit(0);
})().catch(err => { console.error('[Force Cleanup] Lỗi:', err.message); process.exit(1); });
