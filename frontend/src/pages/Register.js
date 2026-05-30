import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ORANGE = '#1D7DB8';
const DARK   = '#0f172a';

export default function Register() {
  const [form, setForm]     = useState({ name:'', email:'', phone:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser }       = useAuth();
  const navigate            = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await register(form);
      loginUser(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo tài khoản');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .auth-input:focus { border-color: ${ORANGE} !important; box-shadow: 0 0 0 3px ${ORANGE}18 !important; }
        .auth-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .auth-btn { transition: opacity .15s, transform .15s; }
      `}</style>

      {/* Left panel */}
      <div style={s.left} className="login-left">
        <div style={s.leftContent}>
          <div style={s.brand}>FASTBUS</div>
          <h2 style={s.leftTitle}><span>Tham gia cùng</span><br/><span>hàng triệu hành khách</span></h2>
          <p style={s.leftSub}>Đăng ký miễn phí và trải nghiệm đặt vé xe khách toàn quốc nhanh nhất Việt Nam.</p>
          <div style={s.features}>
            {['Tích điểm 1% mỗi chuyến đi', 'Ví FASTPAY hoàn tiền tức thì', 'Chọn ghế, đặt vé chỉ 60 giây'].map(f => (
              <div key={f} style={s.featureItem}>
                <div style={s.featureDot}/>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={s.leftPattern}/>
      </div>

      {/* Right panel */}
      <div style={s.right} className="login-right">
        <div style={s.form} className="login-form">
          <Link to="/" style={s.backLink}>← Về trang chủ</Link>

          <div style={{ animation: 'fadeIn .5s ease both' }}>
            <h1 style={s.title}>Tạo tài khoản</h1>
            <p style={s.sub}>Tạo tài khoản</p>

            {error && <div style={s.error}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {[
                { key:'name',     label: 'Họ và tên',        type:'text',     placeholder: 'Nguyen Van A' },
                { key:'email',    label: 'Email',             type:'email',    placeholder: 'email@example.com' },
                { key:'phone',    label: 'Số điện thoại',     type:'text',     placeholder: '0901234567' },
                { key:'password', label: 'Mật khẩu',          type:'password', placeholder: '••••••••' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} style={s.fieldGroup}>
                  <label style={s.label}>{label}</label>
                  <input className="auth-input" type={type} required placeholder={placeholder}
                    value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={s.input}/>
                </div>
              ))}

              <button type="submit" className="auth-btn" disabled={loading} style={s.btn}>
                {loading ? '...' : 'Tạo tài khoản →'}
              </button>
            </form>

            <p style={s.footer}>
              Đã có tài khoản?{' '}
              <Link to="/login" style={{ color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh' },

  left: { flex: '0 0 420px', background: DARK, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' },
  leftContent: { position: 'relative', zIndex: 2, padding: '52px 48px' },
  leftPattern: {
    position: 'absolute', inset: 0, zIndex: 1,
    background: `radial-gradient(circle at 80% 20%, ${ORANGE}22 0%, transparent 55%), radial-gradient(circle at 10% 90%, ${ORANGE}15 0%, transparent 45%)`,
  },
  brand:       { color: ORANGE, fontSize: 26, fontWeight: 900, letterSpacing: 1.5, marginBottom: 32 },
  leftTitle:   { color: '#fff', fontSize: 28, fontWeight: 900, lineHeight: 1.3, margin: '0 0 14px' },
  leftSub:     { color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, margin: '0 0 28px' },
  features:    { display: 'flex', flexDirection: 'column', gap: 10 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  featureDot:  { width: 7, height: 7, borderRadius: '50%', background: ORANGE, flexShrink: 0 },

  right:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '24px' },
  form:     { width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20, padding: '40px 36px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' },
  backLink: { display: 'inline-block', color: '#888', fontSize: 13, textDecoration: 'none', marginBottom: 24 },

  title: { fontSize: 24, fontWeight: 900, color: DARK, margin: '0 0 4px' },
  sub:   { fontSize: 14, color: '#999', margin: '0 0 24px' },
  error: { background: '#fff0eb', color: '#c93a10', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16, borderLeft: `3px solid ${ORANGE}` },

  fieldGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .3 },
  input: { display: 'block', width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e8e8e8', fontSize: 15, boxSizing: 'border-box', background: '#fafafa', outline: 'none', transition: 'border-color .15s, box-shadow .15s' },
  btn:   { width: '100%', padding: '13px', background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, marginTop: 8, cursor: 'pointer', boxShadow: `0 4px 16px ${ORANGE}44` },

  footer: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#888' },
};
