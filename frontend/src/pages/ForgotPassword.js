import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../services/api';

const ORANGE = '#1D7DB8';
const DARK   = '#0f172a';

const STEPS = ['Email', 'Mã OTP', 'Hoàn thành'];

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? ORANGE : active ? ORANGE : '#e8e8e8',
                color:      done || active ? '#fff' : '#aaa',
                border:     active ? `2px solid ${ORANGE}` : 'none',
                boxShadow:  active ? `0 0 0 4px ${ORANGE}22` : 'none',
                transition: 'all .2s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, color: active ? ORANGE : done ? '#888' : '#bbb', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? ORANGE : '#e8e8e8', margin: '0 6px', marginBottom: 18, transition: 'background .3s' }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ForgotPassword() {
  const navigate          = useNavigate();
  const [step, setStep]   = useState(0); // 0=email, 1=otp, 2=done
  const [email, setEmail] = useState('');
  const [otp, setOtp]     = useState('');
  const [newPass, setNewPass]   = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await forgotPassword({ email });
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi mã OTP');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPass !== confirm) return setError('Xác nhận mật khẩu');
    if (newPass.length < 6)  return setError('Mật khẩu mới');
    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword: newPass });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fp-input:focus { border-color: ${ORANGE} !important; box-shadow: 0 0 0 3px ${ORANGE}18 !important; }
        .fp-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .fp-btn { transition: opacity .15s, transform .15s; }
      `}</style>

      <div style={s.card}>
        <Link to="/" style={s.backLink}>← Về trang chủ</Link>
        <div style={s.brand}>FASTBUS</div>

        <StepBar current={step}/>

        <div style={{ animation: 'fadeIn .4s ease both' }} key={step}>
          {step === 0 && (
            <>
              <h2 style={s.title}>Quên mật khẩu</h2>
              <p style={s.sub}>Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.</p>
              {error && <div style={s.error}>{error}</div>}
              <form onSubmit={handleSendOtp}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Email</label>
                  <input className="fp-input" type="email" required placeholder="ten@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} style={s.input}/>
                </div>
                <button type="submit" className="fp-btn" disabled={loading} style={s.btn}>
                  {loading ? '...' : 'Gửi mã OTP →'}
                </button>
              </form>
            </>
          )}

          {step === 1 && (
            <>
              <h2 style={s.title}>Nhập mã OTP</h2>
              <p style={s.sub}>Mã OTP đã được gửi đến email của bạn. Có hiệu lực trong 10 phút. <strong style={{ color: DARK }}>{email}</strong></p>
              {error && <div style={s.error}>{error}</div>}
              <form onSubmit={handleReset}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Mã OTP (6 chữ số)</label>
                  <input className="fp-input" required maxLength={6} placeholder="123456"
                    value={otp} onChange={e => setOtp(e.target.value)}
                    style={{ ...s.input, letterSpacing: 10, fontSize: 22, textAlign: 'center' }}/>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Mật khẩu mới</label>
                  <input className="fp-input" type="password" required placeholder="Ít nhất 6 ký tự"
                    value={newPass} onChange={e => setNewPass(e.target.value)} style={s.input}/>
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Xác nhận mật khẩu</label>
                  <input className="fp-input" type="password" required placeholder="Nhập lại mật khẩu mới"
                    value={confirm} onChange={e => setConfirm(e.target.value)} style={s.input}/>
                </div>
                <button type="submit" className="fp-btn" disabled={loading} style={s.btn}>
                  {loading ? '...' : 'Đặt lại mật khẩu →'}
                </button>
              </form>
              <button onClick={() => { setStep(0); setError(''); }}
                style={s.linkBtn}>← Quay lại đăng nhập</button>
            </>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={s.successIcon}>✓</div>
              <h2 style={{ ...s.title, textAlign: 'center', marginBottom: 8 }}>Đặt lại thành công!</h2>
              <p style={{ ...s.sub, marginBottom: 28 }}>Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập với mật khẩu mới.</p>
              <button className="fp-btn" onClick={() => navigate('/login')} style={s.btn}>
                Đăng nhập ngay →
              </button>
            </div>
          )}
        </div>

        {step < 2 && (
          <p style={s.footer}>
            Chưa có tài khoản?{' '}
            <Link to="/login" style={{ color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>Đăng nhập</Link>
          </p>
        )}
      </div>
    </div>
  );
}

const s = {
  page:   { minHeight: '100vh', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:   { width: '100%', maxWidth: 420, background: '#fff', borderRadius: 20, padding: '36px 36px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' },
  backLink: { display: 'inline-block', color: '#888', fontSize: 13, textDecoration: 'none', marginBottom: 20 },
  brand:  { color: ORANGE, fontSize: 20, fontWeight: 900, letterSpacing: 1.5, marginBottom: 24 },

  title:  { fontSize: 22, fontWeight: 900, color: DARK, margin: '0 0 6px' },
  sub:    { fontSize: 14, color: '#999', margin: '0 0 20px', lineHeight: 1.6 },
  error:  { background: '#fff0eb', color: '#c93a10', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16, borderLeft: `3px solid ${ORANGE}` },

  fieldGroup: { marginBottom: 14 },
  label:  { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .3 },
  input:  { display: 'block', width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 15, boxSizing: 'border-box', background: '#fafafa', outline: 'none', transition: 'border-color .15s, box-shadow .15s' },
  btn:    { width: '100%', padding: 13, background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, marginTop: 6, cursor: 'pointer', boxShadow: `0 4px 16px ${ORANGE}44` },

  successIcon: {
    width: 72, height: 72, borderRadius: '50%',
    background: `linear-gradient(135deg, ${ORANGE}, #f5a020)`,
    color: '#fff', fontSize: 32, fontWeight: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px', boxShadow: `0 8px 24px ${ORANGE}44`,
  },

  footer:  { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' },
  linkBtn: { display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: ORANGE, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
};
