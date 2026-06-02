// Dọn dữ liệu orphan: trip trỏ tới bus/route đã xoá + booking trỏ tới trip đã xoá.
// AN TOÀN: chỉ xoá trip orphan KHÔNG có booking active, và chỉ xoá booking 'cancelled'.
// BẢO TOÀN: mọi vé pending/processing/confirmed/completed (dữ liệu đã/đang thanh toán).
// Cascade: xoá Payment/WalletTransaction/PointTransaction/Review của các booking bị xoá.
// Chạy: cd backend && node scripts/cleanup-orphans.js
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

const ACTIVE = ['pending', 'processing', 'confirmed', 'completed'];

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/booking-xe');

  const busIds   = new Set((await Bus.find({}, '_id').lean()).map(b => String(b._id)));
  const routeIds = new Set((await Route.find({}, '_id').lean()).map(r => String(r._id)));
  const trips    = await Trip.find({}, 'bus route').lean();
  const tripIds  = new Set(trips.map(t => String(t._id)));

  const orphanTrips = trips.filter(t => !busIds.has(String(t.bus)) || !routeIds.has(String(t.route)));
  const orphanTripIds = orphanTrips.map(t => t._id);

  // Trip orphan nào còn vé active → GIỮ LẠI
  const activeOnOrphan = await Booking.find({ trip: { $in: orphanTripIds }, status: { $in: ACTIVE } }, 'trip').lean();
  const keepTripIds = new Set(activeOnOrphan.map(b => String(b.trip)));
  const safeTripIds = orphanTripIds.filter(id => !keepTripIds.has(String(id)));

  // Booking cancelled trên safe trip → xoá
  const cancelledOnSafe = await Booking.find({ trip: { $in: safeTripIds }, status: 'cancelled' }, '_id').lean();

  // Booking orphan (trip đã xoá)
  const allBk = await Booking.find({}, 'trip status').lean();
  const orphanBk = allBk.filter(b => !tripIds.has(String(b.trip)));
  const cancelledOrphanBk = orphanBk.filter(b => b.status === 'cancelled').map(b => b._id);
  const keptOrphanBk      = orphanBk.filter(b => b.status !== 'cancelled');

  const delBookingIds = [...cancelledOnSafe.map(b => b._id), ...cancelledOrphanBk];

  // Cascade xoá bản ghi phụ thuộc
  const [pay, wt, pt, rv] = await Promise.all([
    Payment.deleteMany({ booking: { $in: delBookingIds } }),
    WalletTransaction.deleteMany({ booking: { $in: delBookingIds } }),
    PointTransaction.deleteMany({ booking: { $in: delBookingIds } }),
    Review.deleteMany({ booking: { $in: delBookingIds } }),
  ]);
  const delBk   = await Booking.deleteMany({ _id: { $in: delBookingIds } });
  const delTrip = await Trip.deleteMany({ _id: { $in: safeTripIds } });

  console.log('=== CLEANUP ORPHANS ===');
  console.log('Trip orphan tổng:', orphanTrips.length, '| xoá:', delTrip.deletedCount, '| giữ (có vé active):', keepTripIds.size);
  console.log('Booking xoá (cancelled):', delBk.deletedCount,
    `(trên safe trip: ${cancelledOnSafe.length}, orphan: ${cancelledOrphanBk.length})`);
  console.log('Cascade xoá → Payment:', pay.deletedCount, '| Wallet:', wt.deletedCount, '| Point:', pt.deletedCount, '| Review:', rv.deletedCount);
  console.log('BẢO TOÀN — vé active orphan giữ lại:', keptOrphanBk.length, '(trip đã xoá) +', keepTripIds.size, '(trip orphan còn bus/route lỗi)');
  console.log('   keptOrphanBookings:', keptOrphanBk.map(b => `${b._id}(${b.status})`).join(', ') || '(none)');

  await mongoose.disconnect();
  process.exit(0);
})().catch(err => { console.error('[Cleanup] Lỗi:', err.message); process.exit(1); });
