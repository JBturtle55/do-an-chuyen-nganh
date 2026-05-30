const express     = require('express');
const nodemailer  = require('nodemailer');
const { validate, required, isEmail } = require('../middleware/validate');

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// POST /api/contact — public, không cần auth
router.post(
  '/',
  validate({
    name:    [required],
    email:   [required, isEmail],
    message: [required],
  }),
  async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    const subjectLine = subject || 'Liên hệ chung';

    const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
  <tr><td align="center">
  <table width="580" cellpadding="0" cellspacing="0"
         style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">
    <tr>
      <td style="background:linear-gradient(135deg,#0e3a5c 0%,#1D7DB8 60%,#2caae2 100%);padding:28px 36px;">
        <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:1px;">FASTBUS</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:2px;">An tâm mọi hành trình</div>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 36px;">
        <h2 style="margin:0 0 20px;font-size:20px;color:#0C1825;">📩 Liên hệ mới từ khách hàng</h2>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background:#EBF2FA;border-radius:10px;padding:20px;margin-bottom:24px;border:1px solid #C8D5E4;">
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#5E7A96;width:140px;">Họ và tên</td>
            <td style="font-weight:700;color:#0C1825;font-size:14px;">${name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#5E7A96;">Email</td>
            <td style="font-weight:700;color:#1D7DB8;font-size:14px;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#5E7A96;">Số điện thoại</td>
            <td style="font-weight:700;color:#0C1825;font-size:14px;">${phone || '(không cung cấp)'}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:14px;color:#5E7A96;">Chủ đề</td>
            <td style="font-weight:700;color:#0C1825;font-size:14px;">${subjectLine}</td>
          </tr>
        </table>
        <div style="background:#fff;border:1px solid #C8D5E4;border-radius:10px;padding:20px;">
          <div style="font-size:13px;color:#5E7A96;margin-bottom:8px;font-weight:600;">NỘI DUNG</div>
          <div style="font-size:15px;color:#0C1825;line-height:1.7;white-space:pre-wrap;">${message}</div>
        </div>
        <p style="margin:20px 0 0;font-size:13px;color:#5E7A96;">
          Vui lòng phản hồi đến <strong style="color:#1D7DB8;">${email}</strong> trong vòng 24 giờ làm việc.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#EBF2FA;padding:16px 36px;text-align:center;font-size:12px;color:#5E7A96;border-top:1px solid #C8D5E4;">
        FASTBUS — hotline hỗ trợ: 1900 6789
      </td>
    </tr>
  </table>
  </td></tr>
</table>
</body></html>`;

    try {
      await transporter.sendMail({
        from:    `"FASTBUS Contact" <${process.env.EMAIL_USER}>`,
        to:      process.env.EMAIL_USER,
        replyTo: email,
        subject: `[FASTBUS] Liên hệ từ ${name}`,
        html,
      });
    } catch (err) {
      console.error('[Contact] Lỗi gửi email:', err.message);
      // Vẫn trả 200 — không để lỗi email ảnh hưởng UX
    }

    res.json({ message: 'Đã gửi thành công' });
  }
);

module.exports = router;
