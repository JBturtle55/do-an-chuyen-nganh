const router    = require('express').Router();
const Payment   = require('../models/Payment');
const Booking   = require('../models/Booking');
const { protect } = require('../middleware/auth');
const nodemailer  = require('nodemailer');
const axios       = require('axios');
const crypto      = require('crypto');

// Đảm bảo các model được register trước khi populate
require('../models/Trip');
require('../models/Route');
require('../models/Bus');

// ── Email ─────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

async function sendConfirmEmail(booking, user) {
  try {
    const trip = booking.trip;
    const depTime = new Date(trip.departureTime).toLocaleString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const bookingDate = new Date(booking.createdAt || Date.now()).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const seatList = booking.seats.sort((a,b) => a - b).join(', ');
    const totalFormatted = booking.totalPrice.toLocaleString('vi-VN') + '\u0111';

    await transporter.sendMail({
      from:    `"FASTBUS" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: `Xac nhan dat ve thanh cong — ${trip.route?.from} den ${trip.route?.to}`,
      html: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Xac nhan dat ve</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
  <tr><td align="center">
  <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.10);">
    <tr>
      <td style="background:#f26522;padding:32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">FASTBUS</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px;letter-spacing:.5px;">An tam moi hanh trinh</div>
            </td>
            <td align="right">
              <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:3px;padding:6px 14px;display:inline-block;">
                <div style="font-size:10px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:.8px;">Trang thai</div>
                <div style="font-size:13px;font-weight:700;color:#ffffff;margin-top:1px;">Da thanh toan</div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px 0;">
        <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#1a202c;">Xin chao, ${user.name}</p>
        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
          Thanh toan cua ban da duoc ghi nhan. Duoi day la thong tin ve cua ban.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e8edf4;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:40%;vertical-align:top;">
                    <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">Diem di</div>
                    <div style="font-size:20px;font-weight:800;color:#1a202c;">${trip.route?.from}</div>
                  </td>
                  <td style="width:20%;text-align:center;vertical-align:middle;padding-top:16px;">
                    <div style="border-top:2px solid #e2e8f0;position:relative;margin:0 8px;">
                      <div style="position:absolute;right:-4px;top:-6px;width:0;height:0;border-left:8px solid #e2e8f0;border-top:5px solid transparent;border-bottom:5px solid transparent;"></div>
                    </div>
                  </td>
                  <td style="width:40%;vertical-align:top;text-align:right;">
                    <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">Diem den</div>
                    <div style="font-size:20px;font-weight:800;color:#1a202c;">${trip.route?.to}</div>
                  </td>
                </tr>
                <tr>
                  <td colspan="3" style="padding-top:16px;border-top:1px dashed #e2e8f0;">
                    <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;">Gio khoi hanh</div>
                    <div style="font-size:14px;font-weight:600;color:#1a202c;">${depTime}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 0;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:12px;border-bottom:1px solid #f1f5f9;padding-bottom:8px;">Chi tiet ve</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
          <tr><td style="padding:10px 0;color:#64748b;width:45%;">Ma dat ve</td><td style="padding:10px 0;font-weight:600;color:#1a202c;text-align:right;font-family:monospace;">${booking._id.toString().slice(-10).toUpperCase()}</td></tr>
          <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f8fafc;">Ten hanh khach</td><td style="padding:10px 0;font-weight:600;color:#1a202c;text-align:right;border-bottom:1px solid #f8fafc;">${booking.passengerName}</td></tr>
          <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f8fafc;">So dien thoai</td><td style="padding:10px 0;font-weight:600;color:#1a202c;text-align:right;border-bottom:1px solid #f8fafc;">${booking.passengerPhone}</td></tr>
          <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f8fafc;">Xe</td><td style="padding:10px 0;font-weight:600;color:#1a202c;text-align:right;border-bottom:1px solid #f8fafc;">${trip.bus?.name || 'Chua cap nhat'}</td></tr>
          <tr><td style="padding:10px 0;color:#64748b;border-bottom:1px solid #f8fafc;">So ghe</td><td style="padding:10px 0;font-weight:600;color:#1a202c;text-align:right;border-bottom:1px solid #f8fafc;">${seatList}</td></tr>
          <tr><td style="padding:14px 0 0;font-weight:700;color:#1a202c;font-size:15px;">Tong tien</td><td style="padding:14px 0 0;font-weight:800;color:#f26522;font-size:20px;text-align:right;">${totalFormatted}</td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f5;border-left:3px solid #f26522;border-radius:0 4px 4px 0;">
          <tr>
            <td style="padding:14px 16px;">
              <div style="font-size:12px;font-weight:700;color:#7a3800;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Luu y quan trong</div>
              <ul style="margin:0;padding-left:16px;font-size:13px;color:#7a3800;line-height:1.9;">
                <li>Co mat tai diem don truoc gio khoi hanh it nhat <strong>15 phut</strong></li>
                <li>Mang theo CCCD hoac CMND de doi chieu khi len xe</li>
                <li>Lien he hotline <strong>1900 599 997</strong> neu can ho tro</li>
              </ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="padding:32px 40px 0;"><hr style="border:none;border-top:1px solid #f1f5f9;margin:0;"/></td></tr>
    <tr>
      <td style="padding:20px 40px 32px;">
        <div style="font-size:12px;color:#94a3b8;line-height:1.8;">
          Email nay duoc gui tu he thong FASTBUS. Vui long khong tra loi truc tiep.
        </div>
      </td>
    </tr>
  </table>
  </td></tr>
</table>
</body>
</html>`
    });
  } catch (e) {
    console.log('Email error (non-fatal):', e.message);
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://booking.longvan.vn';

// POST /payments/wallet — thanh toán bằng ví FASTPAY
router.post('/wallet', protect, async (req, res) => {
  const { bookingId, voucherCode, pointsToUse = 0 } = req.body;
  let bookingClaimed = false;
  // Theo dõi side-effect tiền/điểm đã thực hiện để rollback CHÍNH XÁC nếu lỗi giữa chừng
  // (MongoDB standalone không hỗ trợ transaction → dùng compensating update)
  let deductedWallet = 0, redeemedPoints = 0, earnedPointsApplied = 0, confirmed = false;

  try {
    const WalletTransaction = require('../models/WalletTransaction');
    const PointTransaction  = require('../models/PointTransaction');
    const User    = require('../models/User');
    const Voucher = require('../models/Voucher');
    const { calcDiscount } = require('./vouchers');

    // ATOMIC: đổi pending → processing, chỉ 1 request thành công
    let booking = await Booking.findOneAndUpdate(
      { _id: bookingId, user: req.user.id, status: 'pending' },
      { $set: { status: 'processing' } },
      { new: false }
    ).populate({ path: 'trip', populate: ['route', 'bus'] });

    let isRetry = false;
    if (!booking) {
      const existing = await Booking.findOne({ _id: bookingId, user: req.user.id })
        .populate({ path: 'trip', populate: ['route', 'bus'] });
      if (!existing)                       return res.status(404).json({ message: 'Không tìm thấy booking' });
      if (existing.status === 'cancelled') return res.status(400).json({ message: 'Booking đã bị huỷ' });
      if (existing.status === 'confirmed') return res.status(400).json({ message: 'Booking đã được thanh toán' });
      if (existing.status === 'processing') {
        const paid = await Payment.findOne({ booking: bookingId, status: 'success' });
        if (paid) return res.status(400).json({ message: 'Booking đã được thanh toán' });
        booking = existing;
        isRetry = true;
      } else {
        return res.status(400).json({ message: 'Booking không hợp lệ' });
      }
    }
    bookingClaimed = true;

    // Kiểm tra hết hạn
    if (booking.expiresAt && new Date() > booking.expiresAt) {
      await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
      await require('../models/Trip').findByIdAndUpdate(booking.trip._id, {
        $pull: { bookedSeats: { $in: booking.seats } },
        $inc:  { availableSeats: booking.seats.length }
      });
      bookingClaimed = false;
      return res.status(400).json({ message: 'Booking đã hết hạn, vui lòng đặt lại' });
    }

    const route = booking.trip?.route;
    const tripDesc = `${route?.from || ''} → ${route?.to || ''}`;
    const currentUser = await User.findById(req.user.id);

    let finalPrice, discountAmount = 0, appliedVoucher = null, usedPoints = 0;

    if (isRetry) {
      // Retry: dùng totalPrice đã lưu (đã trừ discount/points từ lần đầu)
      finalPrice = booking.totalPrice;
    } else {
      // 1. Áp dụng voucher
      if (voucherCode) {
        const voucher = await Voucher.findOne({ code: voucherCode.trim().toUpperCase() });
        if (!voucher || !voucher.isActive ||
            (voucher.expiresAt && new Date() > voucher.expiresAt) ||
            (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) ||
            (voucher.minOrder > 0 && booking.totalPrice < voucher.minOrder)) {
          await Booking.findByIdAndUpdate(bookingId, { status: 'pending' });
          bookingClaimed = false;
          return res.status(400).json({ message: 'Mã voucher không hợp lệ hoặc đã hết hạn' });
        }
        discountAmount = calcDiscount(voucher, booking.totalPrice);
        appliedVoucher = voucher;
      }
      const afterVoucher = Math.max(0, booking.totalPrice - discountAmount);
      // 2. Tính điểm
      const maxPoints = Math.floor(afterVoucher * 0.3);
      usedPoints  = Math.min(Math.max(0, Math.floor(pointsToUse)), maxPoints, currentUser.loyaltyPoints);
      finalPrice  = Math.max(0, afterVoucher - usedPoints);
    }

    // 3. ATOMIC: trừ ví — chỉ thành công nếu đủ số dư
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id, walletBalance: { $gte: finalPrice } },
      { $inc: { walletBalance: -finalPrice } },
      { new: true }
    );
    if (!updatedUser) {
      if (!isRetry) { await Booking.findByIdAndUpdate(bookingId, { status: 'pending' }); bookingClaimed = false; }
      return res.status(400).json({
        message: `Số dư ví không đủ. Cần ${finalPrice.toLocaleString('vi-VN')}đ, hiện có ${currentUser.walletBalance.toLocaleString('vi-VN')}đ`,
      });
    }
    deductedWallet = finalPrice;

    // 4. Ghi lịch sử ví
    await WalletTransaction.create({
      user: req.user.id, type: 'payment', amount: finalPrice,
      balance: updatedUser.walletBalance,
      description: `Thanh toán vé ${tripDesc}`, booking: bookingId,
    });

    // 5. ATOMIC: trừ điểm thưởng nếu có (chỉ lần đầu)
    let pointsBalance = updatedUser.loyaltyPoints;
    if (!isRetry && usedPoints > 0) {
      const afterPoints = await User.findOneAndUpdate(
        { _id: req.user.id, loyaltyPoints: { $gte: usedPoints } },
        { $inc: { loyaltyPoints: -usedPoints } },
        { new: true }
      );
      if (afterPoints) redeemedPoints = usedPoints;
      pointsBalance = afterPoints ? afterPoints.loyaltyPoints : pointsBalance;
      await PointTransaction.create({
        user: req.user.id, type: 'redeem', points: usedPoints,
        balance: pointsBalance,
        description: `Dùng điểm thanh toán vé ${tripDesc}`, booking: bookingId,
      });
    }

    // 6. Tích điểm mới (1% finalPrice)
    const earnedPoints = Math.floor(finalPrice * 0.01);
    if (earnedPoints >= 1) {
      const afterEarn = await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { loyaltyPoints: earnedPoints } },
        { new: true }
      );
      earnedPointsApplied = earnedPoints;
      await PointTransaction.create({
        user: req.user.id, type: 'earn', points: earnedPoints,
        balance: afterEarn.loyaltyPoints,
        description: `Tích điểm 1% vé ${tripDesc}`, booking: bookingId,
      });
      pointsBalance = afterEarn.loyaltyPoints;
    }

    // 7. Tạo Payment record + confirm booking
    const transactionId = 'WALLET' + Date.now();
    await Payment.create({
      booking: bookingId, user: req.user.id,
      amount: finalPrice, method: 'wallet',
      status: 'success', transactionId,
    });

    const bookingUpdate = { status: 'confirmed', paidAt: new Date(), totalPrice: finalPrice };
    if (!isRetry && discountAmount > 0) {
      bookingUpdate.discountAmount = discountAmount;
      bookingUpdate.voucherCode    = appliedVoucher.code;
    }
    if (!isRetry && usedPoints > 0) bookingUpdate.pointsUsed = usedPoints;
    await Booking.findByIdAndUpdate(bookingId, bookingUpdate);
    bookingClaimed = false;
    confirmed = true;   // qua mốc này tiền đã hợp lệ → KHÔNG rollback dù bước sau (voucher/email) lỗi

    // 8. Tăng usedCount voucher sau khi booking đã confirmed (chỉ lần đầu)
    if (!isRetry && appliedVoucher) {
      await Voucher.findByIdAndUpdate(appliedVoucher._id, { $inc: { usedCount: 1 } });
    }

    sendConfirmEmail(booking, updatedUser);

    res.json({
      success: true,
      balance:       updatedUser.walletBalance,
      loyaltyPoints: pointsBalance,
      transactionId,
      earnedPoints:  earnedPoints >= 1 ? earnedPoints : 0,
    });
  } catch (err) {
    // Rollback: booking CHƯA confirmed → hoàn lại MỌI side-effect tiền/điểm đã thực hiện
    if (!confirmed && bookingId) {
      const User              = require('../models/User');
      const WalletTransaction = require('../models/WalletTransaction');
      const PointTransaction  = require('../models/PointTransaction');
      const netPoints = redeemedPoints - earnedPointsApplied; // hoàn điểm đã dùng, trừ điểm đã tích nhầm
      if (deductedWallet > 0 || netPoints !== 0) {
        await User.findByIdAndUpdate(req.user.id, {
          $inc: { walletBalance: deductedWallet, loyaltyPoints: netPoints },
        }).catch(() => {});
      }
      // Xoá bản ghi của lần thanh toán hỏng (tránh lịch sử rác + để retry tạo lại Payment được)
      await Promise.all([
        WalletTransaction.deleteMany({ booking: bookingId }).catch(() => {}),
        PointTransaction.deleteMany({ booking: bookingId }).catch(() => {}),
        Payment.deleteMany({ booking: bookingId, status: 'success' }).catch(() => {}),
      ]);
      if (bookingClaimed) {
        await Booking.findByIdAndUpdate(bookingId, { status: 'pending' }).catch(() => {});
      }
    }
    res.status(500).json({ message: err.message });
  }
});

// ── VNPay config ──────────────────────────────────────────
const VNPAY_TMN_CODE    = process.env.VNPAY_TMN_CODE    || 'DEMOV210';
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ';
const VNPAY_URL         = process.env.VNPAY_URL         || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNPAY_RETURN_URL  = process.env.VNPAY_RETURN_URL  || 'https://booking.longvan.vn/payment/return';

function getClientIp(req) {
  const raw = req.headers['x-real-ip']
    || (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket.remoteAddress
    || '1.1.1.1';
  // Chuẩn hoá ::ffff:x.x.x.x → x.x.x.x
  return raw.replace(/^::ffff:/, '');
}

// VNPay v2.1.0: ký trên URLSearchParams string (spaces = '+', special chars = '%XX')
function buildVnpayUrl({ orderId, amount, orderInfo, ipAddr }) {
  const date = new Date();
  const pad = (n, l=2) => String(n).padStart(l, '0');
  const createDate = `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

  const params = {
    vnp_Version:    '2.1.0',
    vnp_Command:    'pay',
    vnp_TmnCode:    VNPAY_TMN_CODE,
    vnp_Locale:     'vn',
    vnp_CurrCode:   'VND',
    vnp_TxnRef:     orderId,
    vnp_OrderInfo:  orderInfo,
    vnp_OrderType:  'other',
    vnp_Amount:     String(Math.round(amount) * 100),
    vnp_ReturnUrl:  VNPAY_RETURN_URL,
    vnp_IpAddr:     ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  // Build URL với URLSearchParams (chuẩn encoding của VNPay)
  const redirectUrl = new URL(VNPAY_URL);
  const urlParams = new URLSearchParams();
  Object.keys(params).sort().forEach(k => urlParams.append(k, String(params[k])));
  redirectUrl.search = urlParams.toString();

  // Ký trên search string (không có dấu ?)
  const signData  = redirectUrl.search.slice(1);
  const signature = crypto.createHmac('sha512', VNPAY_HASH_SECRET).update(Buffer.from(signData, 'utf-8')).digest('hex');

  redirectUrl.searchParams.append('vnp_SecureHash', signature);
  return redirectUrl.toString();
}

function verifyVnpayReturn(query) {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query;
  // Rebuild URLSearchParams để verify đúng chuẩn
  const urlParams = new URLSearchParams();
  Object.keys(rest).sort().forEach(k => urlParams.append(k, String(rest[k])));
  const signData = urlParams.toString();
  const expected = crypto.createHmac('sha512', VNPAY_HASH_SECRET).update(Buffer.from(signData, 'utf-8')).digest('hex');
  return expected === vnp_SecureHash;
}

// POST /payments/vnpay/create — tạo link thanh toán vé qua VNPay
router.post('/vnpay/create', protect, async (req, res) => {
  const { bookingId, voucherCode, pointsToUse = 0 } = req.body;
  let bookingClaimed = false;

  try {
    const Voucher          = require('../models/Voucher');
    const PointTransaction = require('../models/PointTransaction');
    const User             = require('../models/User');
    const { calcDiscount } = require('./vouchers');

    // ATOMIC: đổi pending → processing, chỉ 1 request thành công
    let booking = await Booking.findOneAndUpdate(
      { _id: bookingId, user: req.user.id, status: 'pending' },
      { $set: { status: 'processing' } },
      { new: false }
    ).populate({ path: 'trip', populate: ['route', 'bus'] });

    let isRetry = false;
    if (!booking) {
      const existing = await Booking.findOne({ _id: bookingId, user: req.user.id })
        .populate({ path: 'trip', populate: ['route', 'bus'] });
      if (!existing)                        return res.status(404).json({ message: 'Không tìm thấy booking' });
      if (existing.status === 'cancelled')  return res.status(400).json({ message: 'Booking đã bị huỷ' });
      if (existing.status === 'confirmed')  return res.status(400).json({ message: 'Booking đã được thanh toán' });
      if (existing.status === 'processing') {
        const paid = await Payment.findOne({ booking: bookingId, status: 'success' });
        if (paid) return res.status(400).json({ message: 'Booking đã được thanh toán' });
        booking = existing;
        isRetry = true;
      } else {
        return res.status(400).json({ message: 'Booking không hợp lệ' });
      }
    }
    bookingClaimed = !isRetry;

    // Kiểm tra hết hạn (chỉ cho lần đầu)
    if (!isRetry && booking.expiresAt && new Date() > booking.expiresAt) {
      await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
      await require('../models/Trip').findByIdAndUpdate(booking.trip._id, {
        $pull: { bookedSeats: { $in: booking.seats } },
        $inc:  { availableSeats: booking.seats.length }
      });
      bookingClaimed = false;
      return res.status(400).json({ message: 'Booking đã hết hạn, vui lòng đặt lại' });
    }

    const tripDesc = `${booking.trip?.route?.from || ''} → ${booking.trip?.route?.to || ''}`;

    // Retry: dùng lại totalPrice đã lưu (discount/points đã áp dụng từ lần trước)
    if (isRetry) {
      const orderId = `VNP${bookingId}${Date.now().toString().slice(-4)}`;
      const payUrl  = buildVnpayUrl({
        orderId, amount: booking.totalPrice,
        orderInfo: `Dat ve FASTBUS ${bookingId}`,
        ipAddr: getClientIp(req),
      });
      return res.json({ payUrl });
    }

    const user = await User.findById(req.user.id);

    let discountAmount = 0, appliedVoucher = null;
    if (voucherCode) {
      const voucher = await Voucher.findOne({ code: voucherCode.trim().toUpperCase() });
      if (!voucher || !voucher.isActive ||
          (voucher.expiresAt && new Date() > voucher.expiresAt) ||
          (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) ||
          (voucher.minOrder > 0 && booking.totalPrice < voucher.minOrder)) {
        await Booking.findByIdAndUpdate(bookingId, { status: 'pending' });
        bookingClaimed = false;
        return res.status(400).json({ message: 'Mã voucher không hợp lệ hoặc đã hết hạn' });
      }
      discountAmount = calcDiscount(voucher, booking.totalPrice);
      appliedVoucher = voucher;
    }
    const afterVoucher = Math.max(0, booking.totalPrice - discountAmount);
    const maxPoints    = Math.floor(afterVoucher * 0.3);
    const usedPoints   = Math.min(Math.max(0, Math.floor(pointsToUse)), maxPoints, user.loyaltyPoints);
    const finalPrice   = Math.max(0, afterVoucher - usedPoints);

    // ATOMIC: trừ điểm trước khi redirect VNPay
    const bookingUpdate = { totalPrice: finalPrice };
    if (discountAmount > 0) {
      bookingUpdate.discountAmount = discountAmount;
      bookingUpdate.voucherCode    = appliedVoucher.code;
    }
    if (usedPoints > 0) {
      const afterPoints = await User.findOneAndUpdate(
        { _id: req.user.id, loyaltyPoints: { $gte: usedPoints } },
        { $inc: { loyaltyPoints: -usedPoints } },
        { new: true }
      );
      if (!afterPoints) {
        await Booking.findByIdAndUpdate(bookingId, { status: 'pending' });
        bookingClaimed = false;
        return res.status(400).json({ message: 'Điểm thưởng không đủ' });
      }
      bookingUpdate.pointsUsed = usedPoints;
      await PointTransaction.create({
        user: req.user.id, type: 'redeem', points: usedPoints,
        balance: afterPoints.loyaltyPoints,
        description: `Dùng điểm thanh toán vé ${tripDesc}`, booking: bookingId,
      });
    }
    await Booking.findByIdAndUpdate(bookingId, bookingUpdate);

    // Edge case: finalPrice = 0 (voucher 100%) — confirm luôn không qua VNPay
    if (finalPrice === 0) {
      await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed' });
      if (usedPoints > 0) {
        await PointTransaction.create({
          user: req.user.id, type: 'earn', points: 0,
          balance: (await require('../models/User').findById(req.user.id).select('loyaltyPoints').lean()).loyaltyPoints,
          description: `Vé miễn phí (voucher 100%) ${tripDesc}`, booking: bookingId,
        }).catch(() => {});
      }
      if (appliedVoucher) await appliedVoucher.updateOne({ $inc: { usedCount: 1 } });
      return res.json({ free: true });
    }

    bookingClaimed = false; // Booking giữ trạng thái 'processing' để VNPay return confirm

    const orderId = `VNP${bookingId}${Date.now().toString().slice(-4)}`;
    const payUrl  = buildVnpayUrl({
      orderId, amount: finalPrice,
      orderInfo: `Dat ve FASTBUS ${bookingId}`,
      ipAddr: getClientIp(req),
    });

    res.json({ payUrl });
  } catch (err) {
    if (bookingClaimed && bookingId) {
      await Booking.findByIdAndUpdate(bookingId, { status: 'pending' }).catch(() => {});
    }
    console.error('[PAY] vnpay/create error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /payments/vnpay/wallet-topup — nạp ví qua VNPay
router.post('/vnpay/wallet-topup', protect, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount < 10_000)  return res.status(400).json({ message: 'Số tiền tối thiểu 10.000đ' });
    if (amount > 50_000_000)         return res.status(400).json({ message: 'Số tiền tối đa 50.000.000đ' });

    const orderId = `VWT${req.user.id}${Date.now().toString().slice(-6)}`; // 3+24+6=33 chars
    const ipAddr  = getClientIp(req);
    const payUrl  = buildVnpayUrl({
      orderId,
      amount,
      orderInfo: `Nap vi FASTPAY ${req.user.id}`,
      ipAddr,
    });

    res.json({ payUrl });
  } catch (err) {
    console.error('[PAY] vnpay/wallet-topup error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /payments/vnpay/return — VNPay redirect về sau thanh toán
router.get('/vnpay/return', async (req, res) => {
  try {
    const query      = req.query;
    const isValid    = verifyVnpayReturn(query);
    const resultCode = query.vnp_ResponseCode;
    const orderId    = query.vnp_TxnRef || '';
    const vnpTxnNo   = query.vnp_TransactionNo || '';
    const amount     = Math.round(Number(query.vnp_Amount) / 100);

    if (!isValid || resultCode !== '00') {
      return res.redirect(`${FRONTEND_URL}/payment/return?resultCode=1&orderId=${orderId}&message=${encodeURIComponent(query.vnp_Message || 'Thanh toán thất bại')}`);
    }

    const User              = require('../models/User');
    const WalletTransaction = require('../models/WalletTransaction');

    // Nạp ví: orderId = VWT + userId(24) + 6digits
    if (orderId.startsWith('VWT')) {
      const userId = orderId.slice(3, 27); // full 24-char ObjectId
      const user   = await User.findById(userId);

      if (user) {
        // Idempotent: dùng vnpayTxnId unique index để chặn xử lý 2 lần
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          { $inc: { walletBalance: amount } },
          { new: true }
        );
        try {
          await WalletTransaction.create({
            user: user._id, type: 'topup', amount,
            balance: updatedUser.walletBalance,
            description: `Nạp tiền qua VNPay [${orderId}]`,
            vnpayTxnId: vnpTxnNo,
          });
        } catch (dupErr) {
          // Duplicate key → đã xử lý rồi, hoàn lại walletBalance
          if (dupErr.code === 11000) {
            await User.findByIdAndUpdate(user._id, { $inc: { walletBalance: -amount } });
          } else throw dupErr;
        }
      }
      return res.redirect(`${FRONTEND_URL}/payment/return?resultCode=0&orderId=${orderId}&amount=${amount}`);
    }

    // Thanh toán vé: orderId = VNP + bookingId(24) + 4digits
    const bookingId = orderId.slice(3, 27);
    const booking   = await Booking.findById(bookingId).populate({ path: 'trip', populate: ['route', 'bus'] });

    // Xử lý booking đang ở trạng thái 'processing' (đã đi qua vnpay/create)
    if (booking && (booking.status === 'processing' || booking.status === 'pending')) {
      const PointTransaction = require('../models/PointTransaction');

      // Idempotent: thử tạo Payment với transactionId unique — nếu đã tồn tại thì bỏ qua
      let paymentCreated = false;
      try {
        await Payment.create({
          booking: bookingId, user: booking.user,
          amount: booking.totalPrice, method: 'vnpay',
          status: 'success', transactionId: vnpTxnNo,
        });
        paymentCreated = true;
      } catch (dupErr) {
        if (dupErr.code !== 11000) throw dupErr;
        // Duplicate key → đã xử lý rồi, chỉ redirect thành công
      }

      if (paymentCreated) {
        await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed', paidAt: new Date() });

        // booking.totalPrice đã được cập nhật về finalPrice trong vnpay/create
        const Voucher = require('../models/Voucher');
        if (booking.voucherCode) {
          const v = await Voucher.findOne({ code: booking.voucherCode });
          if (v) await Voucher.findByIdAndUpdate(v._id, { $inc: { usedCount: 1 } });
        }

        const earnedPoints = Math.floor(booking.totalPrice * 0.01);
        if (earnedPoints >= 1) {
          const earnUser = await User.findByIdAndUpdate(
            booking.user,
            { $inc: { loyaltyPoints: earnedPoints } },
            { new: true }
          );
          if (earnUser) {
            await PointTransaction.create({
              user: booking.user, type: 'earn', points: earnedPoints,
              balance: earnUser.loyaltyPoints,
              description: `Tích điểm 1% vé ${booking.trip?.route?.from || ''} → ${booking.trip?.route?.to || ''}`,
              booking: bookingId,
            });
          }
        }
        const user = await User.findById(booking.user);
        if (user) sendConfirmEmail(booking, user);
      }
    }

    res.redirect(`${FRONTEND_URL}/payment/return?resultCode=0&orderId=${orderId}&amount=${amount}`);
  } catch (e) {
    console.error('VNPay return error:', e.message);
    res.redirect(`${FRONTEND_URL}/payment/return?resultCode=1&message=Loi%20he%20thong`);
  }
});

// GET /payments/me
router.get('/me', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('booking').sort('-createdAt');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
