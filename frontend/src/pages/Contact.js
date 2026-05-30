import { useState } from 'react';
import { submitContact } from '../services/api';
import useSEO from '../hooks/useSEO';
import { useToast } from '../components/Toast';

const P     = '#1D7DB8';
const INK   = '#0C1825';
const MUTED = '#5E7A96';

const SUBJECTS = [
  'Hỗ trợ đặt vé',
  'Khiếu nại',
  'Hợp tác nhà xe',
  'Góp ý',
  'Khác',
];

const FAQ_LIST = [
  {
    q: 'Làm sao để huỷ vé?',
    a: 'Vào mục "Vé của tôi" trong trang cá nhân, chọn vé có trạng thái "Chờ TT" và nhấn nút "Huỷ vé". Lưu ý: chỉ có thể huỷ vé ở trạng thái chờ thanh toán.',
  },
  {
    q: 'Tiền hoàn về đâu sau khi huỷ?',
    a: 'Nếu thanh toán qua ví FASTPAY, tiền được hoàn về ví ngay lập tức. Nếu thanh toán qua VNPay, thời gian hoàn tiền từ 3–5 ngày làm việc tùy ngân hàng.',
  },
  {
    q: 'Tôi quên mật khẩu thì phải làm sao?',
    a: 'Nhấn vào "Quên mật khẩu" trên trang đăng nhập, nhập email đã đăng ký và làm theo hướng dẫn gửi về email của bạn để đặt lại mật khẩu.',
  },
  {
    q: 'Làm sao để đăng ký nhà xe hợp tác?',
    a: 'Gửi email đến partner@fastbus.vn với thông tin nhà xe, số lượng xe và tuyến đường hoạt động. Đội ngũ của chúng tôi sẽ liên hệ lại trong 2–3 ngày làm việc.',
  },
];

const INFO_CARDS = [
  {
    icon: '📞',
    title: 'Hotline',
    line1: '1900 6789',
    line2: 'Thứ 2 – CN, 6:00 – 22:00',
    bold1: true,
  },
  {
    icon: '📧',
    title: 'Email',
    line1: 'support@fastbus.vn',
    line2: 'Phản hồi trong 24h làm việc',
    bold1: false,
  },
  {
    icon: '📍',
    title: 'Địa chỉ',
    line1: '123 Nguyễn Huệ, Quận 1',
    line2: 'TP. Hồ Chí Minh',
    bold1: false,
  },
  {
    icon: '💬',
    title: 'Chat trực tiếp',
    line1: 'Nhấn vào icon chat góc phải màn hình',
    line2: 'Hỗ trợ ngay lập tức',
    bold1: false,
  },
];

const EMPTY_FORM = { name: '', email: '', phone: '', subject: 'Hỗ trợ đặt vé', message: '' };

export default function Contact() {
  useSEO({ title: 'Liên hệ — FASTBUS' });
  const { addToast } = useToast();

  const [form, setForm]       = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitContact(form);
      addToast('Gửi thành công! Chúng tôi sẽ phản hồi trong 24h.', 'success');
      setForm(EMPTY_FORM);
    } catch {
      addToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    border: `1.5px solid #E0E7EF`,
    borderRadius: 10,
    padding: '11px 14px',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: 14,
    color: INK,
    outline: 'none',
    transition: 'border-color .2s',
    fontFamily: 'inherit',
    background: '#fff',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: INK,
    marginBottom: 6,
  };

  const fieldWrap = { marginBottom: 18 };

  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <style>{`
        .contact-input:focus { border-color: ${P} !important; box-shadow: 0 0 0 3px rgba(29,125,184,0.12); }
        .contact-btn:hover:not(:disabled) { background: #0f5f8c !important; }
        .faq-item:hover { background: #f5faff !important; }
        @media (max-width: 768px) {
          .contact-main { flex-direction: column !important; }
          .contact-right { flex: none !important; width: 100% !important; }
        }
      `}</style>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0e3a5c 0%, #1D7DB8 60%, #2caae2 100%)',
        position: 'relative',
        height: 160,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(5,18,35,0.35)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>
            Liên hệ với chúng tôi
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>
            Chúng tôi sẵn sàng hỗ trợ bạn 24/7
          </p>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>
        <div className="contact-main" style={{ display: 'flex', gap: 32 }}>

          {/* Left — form */}
          <div style={{ flex: 1 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32,
                          boxShadow: '0 2px 16px rgba(29,125,184,0.08)' }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 800, color: INK }}>
                Gửi tin nhắn cho chúng tôi
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Họ và tên <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input
                    className="contact-input"
                    style={inputStyle}
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Email <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input
                    className="contact-input"
                    style={inputStyle}
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Số điện thoại</label>
                  <input
                    className="contact-input"
                    style={inputStyle}
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0901 234 567"
                  />
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Chủ đề</label>
                  <select
                    className="contact-input"
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                  >
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>Nội dung <span style={{ color: '#e53e3e' }}>*</span></label>
                  <textarea
                    className="contact-input"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Nhập nội dung bạn muốn gửi..."
                    required
                  />
                </div>

                <button
                  className="contact-btn"
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 48,
                    background: P,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'background .2s',
                    fontFamily: 'inherit',
                    letterSpacing: 0.3,
                  }}
                >
                  {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </button>
              </form>
            </div>
          </div>

          {/* Right — info cards */}
          <div className="contact-right" style={{ flex: '0 0 320px' }}>
            {INFO_CARDS.map((card) => (
              <div key={card.title} style={{
                background: '#fff',
                borderRadius: 14,
                padding: '20px 22px',
                border: '1px solid #C8D5E4',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                boxShadow: '0 1px 6px rgba(29,125,184,0.06)',
              }}>
                {/* Icon circle */}
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: `${P}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                {/* Text */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P, marginBottom: 4 }}>
                    {card.title}
                  </div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: card.bold1 ? 800 : 600,
                    color: INK,
                    marginBottom: 2,
                  }}>
                    {card.line1}
                  </div>
                  <div style={{ fontSize: 13, color: MUTED }}>
                    {card.line2}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ section */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '32px 36px',
          marginTop: 40,
          boxShadow: '0 2px 16px rgba(29,125,184,0.08)',
        }}>
          <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 800, color: INK }}>
            Câu hỏi thường gặp
          </h2>

          {FAQ_LIST.map((item, i) => (
            <div
              key={i}
              className="faq-item"
              style={{
                borderBottom: i < FAQ_LIST.length - 1 ? '1px solid #E0E7EF' : 'none',
                borderRadius: 8,
                transition: 'background .15s',
                padding: '4px 0',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 8px',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>
                  {item.q}
                </span>
                <span style={{
                  fontSize: 18,
                  color: P,
                  flexShrink: 0,
                  marginLeft: 16,
                  transition: 'transform .25s',
                  display: 'inline-block',
                  transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  ›
                </span>
              </button>

              {openFaq === i && (
                <div style={{
                  padding: '0 8px 16px',
                  fontSize: 14,
                  color: MUTED,
                  lineHeight: 1.7,
                }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
