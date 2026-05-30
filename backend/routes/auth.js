const router     = require('express').Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const User       = require('../models/User');
const { protect } = require('../middleware/auth');
const { validate, required, isEmail, minLen, maxLen, isPhone } = require('../middleware/validate');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Đăng ký
router.post('/register',
  validate({
    name:     [required, minLen(2), maxLen(60)],
    email:    [required, isEmail],
    password: [required, minLen(6), maxLen(100)],
  }),
  async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email đã tồn tại' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: user._id, name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Đăng nhập Google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({ name, email, googleId });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch {
    res.status(401).json({ message: 'Google token không hợp lệ' });
  }
});

// Đăng nhập
router.post('/login',
  validate({ email: [required, isEmail], password: [required] }),
  async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email không tồn tại' });
    if (!user.password) return res.status(400).json({ message: 'Tài khoản này đăng nhập bằng Google' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Sai mật khẩu' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Lấy thông tin user đang đăng nhập
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

// Cập nhật thông tin cá nhân
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Đổi mật khẩu
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Quên mật khẩu — gửi OTP 6 số qua email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email không tồn tại' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp        = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await user.save();

    await transporter.sendMail({
      from:    `"FASTBUS" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: '🔑 Mã xác nhận đặt lại mật khẩu FASTBUS',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#f26522">Đặt lại mật khẩu</h2>
          <p>Mã OTP của bạn là:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#f26522;padding:16px 0">${otp}</div>
          <p style="color:#888;font-size:13px">Mã có hiệu lực trong 10 phút. Không chia sẻ mã này cho bất kỳ ai.</p>
        </div>
      `
    });

    res.json({ message: 'Đã gửi mã OTP về email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Đặt lại mật khẩu bằng OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.resetOtp || !user.resetOtpExpires)
      return res.status(400).json({ message: 'Yêu cầu không hợp lệ' });

    if (new Date() > user.resetOtpExpires)
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });

    const match = await bcrypt.compare(otp, user.resetOtp);
    if (!match) return res.status(400).json({ message: 'Mã OTP không đúng' });

    user.password        = await bcrypt.hash(newPassword, 10);
    user.resetOtp        = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
