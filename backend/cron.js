const cron        = require('node-cron');
const nodemailer  = require('nodemailer');
const Booking     = require('./models/Booking');
const Trip        = require('./models/Trip');
const User        = require('./models/User');
const { broadcast } = require('./sseClients');

require('./models/Route');
require('./models/Bus');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendReminderEmail(booking, user) {
  try {
    const trip    = booking.trip;
    const depTime = new Date(trip.departureTime).toLocaleString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const seats = booking.seats.sort((a, b) => a - b).join(', ');
    await transporter.sendMail({
      from:    `"FASTBUS" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: `Nhac nho: Chuyen xe ${trip.route?.from} → ${trip.route?.to} khoi hanh sau 24 gio`,
      html: `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
  <tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">
    <tr><td style="background:#f26522;padding:28px 36px;">
      <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:1px;">FASTBUS</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px;">An tam moi hanh trinh</div>
    </td></tr>
    <tr><td style="padding:32px 36px;">
      <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a1a;">🔔 Nhac nho chuyen di cua ban</h2>
      <p style="color:#555;margin:0 0 24px;">Xin chao <strong>${user.name}</strong>, chuyen xe cua ban se khoi hanh sau khong day 24 gio!</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:20px;margin-bottom:24px;">
        <tr><td style="padding:6px 0;font-size:14px;color:#555;">Tuyen duong</td><td style="text-align:right;font-weight:700;color:#1a1a1a;">${trip.route?.from} → ${trip.route?.to}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#555;">Gio khoi hanh</td><td style="text-align:right;font-weight:700;color:#f26522;">${depTime}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#555;">Ghe so</td><td style="text-align:right;font-weight:700;color:#1a1a1a;">${seats}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#555;">Hanh khach</td><td style="text-align:right;font-weight:700;color:#1a1a1a;">${booking.passengerName}</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#555;">Ma ve</td><td style="text-align:right;font-weight:700;color:#1a1a1a;">${booking._id.toString().slice(-8).toUpperCase()}</td></tr>
      </table>
      <p style="color:#888;font-size:13px;margin:0;">Vui long co mat truoc gio khoi hanh it nhat <strong>15 phut</strong>. Mang theo CMND/CCCD hoac ma QR ve tren ung dung FASTBUS.</p>
    </td></tr>
    <tr><td style="background:#fafafa;padding:16px 36px;text-align:center;font-size:12px;color:#aaa;">FASTBUS — hotline ho tro: 1900 xxxx</td></tr>
  </table>
  </td></tr>
</table>
</body></html>`,
    });
  } catch (err) {
    console.error('[Cron Reminder] Lỗi gửi email:', err.message);
  }
}

// Chạy mỗi phút — kiểm tra booking hết hạn + reset processing cũ
cron.schedule('* * * * *', async () => {
  try {
    // 1. Huỷ pending đã hết hạn
    const expired = await Booking.find({
      status:    'pending',
      expiresAt: { $lt: new Date() }
    });

    for (const b of expired) {
      await Booking.findByIdAndUpdate(b._id, { status: 'cancelled' });
      await Trip.findByIdAndUpdate(b.trip, {
        $inc: { availableSeats: b.seats.length }
      });
      broadcast(b.trip.toString(), { type: 'seats_updated' });
    }

    if (expired.length > 0)
      console.log(`[Cron] Đã huỷ ${expired.length} booking hết hạn`);

    // 2. Reset processing > 30 phút → pending (để pending cron xử lý tiếp)
    const staleThreshold = new Date(Date.now() - 30 * 60 * 1000);
    const stale = await Booking.updateMany(
      { status: 'processing', updatedAt: { $lt: staleThreshold } },
      { $set: { status: 'pending' } }
    );
    if (stale.modifiedCount > 0)
      console.log(`[Cron] Reset ${stale.modifiedCount} booking processing → pending`);
  } catch (err) {
    console.error('[Cron] Lỗi:', err.message);
  }
});

// Chạy mỗi giờ — gửi email nhắc nhở 24h trước khởi hành
// Dùng cửa sổ ±10 phút để mỗi booking chỉ được gửi đúng 1 lần mỗi lần chạy
cron.schedule('0 * * * *', async () => {
  try {
    const now  = new Date();
    const lo   = new Date(now.getTime() + 23 * 60 * 60 * 1000 + 50 * 60 * 1000); // +23h50m
    const hi   = new Date(now.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000); // +24h10m

    const bookings = await Booking.find({ status: 'confirmed' })
      .populate({ path: 'trip', populate: ['route', 'bus'] })
      .lean();

    const due = bookings.filter(b => {
      const dep = new Date(b.trip?.departureTime);
      return dep >= lo && dep <= hi;
    });

    for (const b of due) {
      const user = await User.findById(b.user).select('name email').lean();
      if (user?.email) await sendReminderEmail(b, user);
    }

    if (due.length > 0)
      console.log(`[Cron Reminder] Đã gửi ${due.length} email nhắc nhở khởi hành`);
  } catch (err) {
    console.error('[Cron Reminder] Lỗi:', err.message);
  }
});

// Chạy mỗi giờ phút :10 — archive trip đã qua giờ khởi hành + mark booking completed
cron.schedule('10 * * * *', async () => {
  try {
    // Tìm các trip sắp archive để lấy _id
    const tripsToComplete = await Trip.find(
      { status: 'scheduled', departureTime: { $lt: new Date() } },
      '_id'
    ).lean();

    if (tripsToComplete.length > 0) {
      const tripIds = tripsToComplete.map(t => t._id);

      const [tripResult, bookingResult] = await Promise.all([
        Trip.updateMany({ _id: { $in: tripIds } }, { status: 'completed' }),
        Booking.updateMany(
          { trip: { $in: tripIds }, status: 'confirmed' },
          { status: 'completed' }
        ),
      ]);

      console.log(`[Cron Archive] ${tripResult.modifiedCount} chuyến, ${bookingResult.modifiedCount} vé → completed`);
    }
  } catch (err) {
    console.error('[Cron Archive] Lỗi:', err.message);
  }
});


console.log('[Cron] Đã khởi động — kiểm tra booking hết hạn mỗi phút');
