import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { login, googleLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';

const P   = '#1D7DB8';
const INK = '#0C1825';

export default function Login() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const { loginUser }  = useAuth();
  const navigate       = useNavigate();
  const location       = useLocation();
  const from           = location.state?.from;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.user);
      navigate(from || (res.data.user.role === 'admin' ? '/admin' : '/'));
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập');
    } finally { setLoading(false); }
  };

  const handleGoogle = async (credentialResponse) => {
    setError('');
    try {
      const res = await googleLogin({ credential: credentialResponse.credential });
      loginUser(res.data.token, res.data.user);
      navigate(from || (res.data.user.role === 'admin' ? '/admin' : '/'));
    } catch (err) {
      setError(err.response?.data?.message || 'Tiếp tục với Google');
    }
  };

  return (
    <div style={{ minHeight:'100vh', position:'relative', display:'flex', alignItems:'center',
      backgroundImage:'url(/hero.png)', backgroundSize:'cover', backgroundPosition:'center 55%',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;max-height:0} to{opacity:1;max-height:400px} }
        .auth-input:focus { border-color:${P}!important; box-shadow:0 0 0 3px ${P}1a!important; }
        .auth-btn:hover { opacity:.88; transform:translateY(-1px); }
        .auth-btn { transition:opacity .15s,transform .15s; }
        .email-opt:hover { background:#f0f7ff!important; color:${P}!important; }
        @media(max-width:860px){ .login-left{display:none!important} .login-wrap{justify-content:center!important; padding:80px 20px 40px!important} }
        @media(max-width:480px){ .login-card{border-radius:16px!important} }
      `}</style>

      {/* overlay — lighter left, darker right to contrast tagline */}
      <div style={{ position:'absolute', inset:0,
        background:'linear-gradient(105deg, rgba(5,12,25,0.55) 0%, rgba(5,12,25,0.35) 45%, rgba(5,12,25,0.70) 100%)',
      }}/>

      <div className="login-wrap" style={{ position:'relative', zIndex:1, width:'100%', maxWidth:1200,
        margin:'0 auto', padding:'80px 56px 40px',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:40,
      }}>

        {/* ── Left: tagline ── */}
        <div className="login-left" style={{ flex:1, color:'#fff', animation:'fadeUp .6s ease both' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.6)',
            letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:20,
          }}></div>
          <h1 style={{ fontSize:52, fontWeight:900, lineHeight:1.08, letterSpacing:'-0.03em',
            margin:'0 0 20px', textShadow:'0 2px 24px rgba(0,0,0,0.5)',
          }}>
            Hành Trình Của Bạn<br/>
            <span style={{ color:'#D4B84A' }}>Bắt Đầu Từ Đây.</span>
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.72)', maxWidth:420, lineHeight:1.7, margin:0 }}>
            Đặt vé xe khách toàn quốc nhanh chóng, tiện lợi và an toàn. Hơn 200 nhà xe uy tín trên khắp Việt Nam.
          </p>
        </div>

        {/* ── Right: card ── */}
        <div style={{ flex:'0 0 380px', animation:'fadeUp .5s .1s ease both' }}>
          {/* above-card link */}
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'rgba(255,255,255,0.85)',
            fontSize:13, fontWeight:600, textDecoration:'none', marginBottom:14,
            transition:'color .15s',
          }}
          onMouseEnter={e=>e.currentTarget.style.color='#fff'}
          onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.85)'}
          >← Về trang chủ FASTBUS</Link>

          {/* card */}
          <div className="login-card" style={{ background:'#fff', borderRadius:20,
            overflow:'hidden', boxShadow:'0 28px 80px rgba(0,0,0,0.45)',
          }}>

            {/* promo banner */}
            <div style={{ background:'linear-gradient(135deg, #dbeeff 0%, #c5e8fb 60%, #d9f0e8 100%)',
              padding:'20px 24px 18px', display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <div>
                <div style={{ fontSize:15, fontWeight:800, color:INK, lineHeight:1.3, marginBottom:4 }}>
                  🎁 Ưu đãi đặc biệt cho thành viên mới
                </div>
                <div style={{ fontSize:12, color:'#5E7A96' }}>Đăng ký ngay và nhận ngay 500 điểm thưởng + voucher giảm 20% cho chuyến đầu tiên!</div>
              </div>
              <div style={{ fontSize:36 }}>🎁</div>
            </div>

            <div style={{ padding:'24px' }}>
              {error && (
                <div style={{ background:'#fff0eb', color:'#c93a10', padding:'9px 12px', borderRadius:8,
                  fontSize:13, marginBottom:14, borderLeft:`3px solid #f87171`,
                }}>{error}</div>
              )}

              {/* Google */}
              <div style={{ marginBottom:12 }}>
                <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Tiếp tục với Google')}
                  text="signin_with" shape="rectangular" locale="vi" width="332"/>
              </div>

              {/* Email toggle */}
              {!showEmail ? (
                <button className="email-opt" onClick={() => setShowEmail(true)} style={{
                  width:'100%', padding:'11px', border:'1.5px solid #e8e8e8', borderRadius:10,
                  background:'#fafafa', fontSize:14, fontWeight:600, color:'#444',
                  cursor:'pointer', transition:'background .15s, color .15s',
                }}>
                  Đăng nhập bằng email
                </button>
              ) : (
                <div style={{ animation:'slideDown .25s ease' }}>
                  <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom:12 }}>
                      <label style={s.label}>Email</label>
                      <input className="auth-input" placeholder="ten@email.com" type="email" required
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        style={s.input} autoFocus/>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                        <label style={s.label}>Mật khẩu</label>
                        <Link to="/forgot-password" style={{ color:P, fontSize:11, fontWeight:600, textDecoration:'none' }}>
                          Quên mật khẩu?
                        </Link>
                      </div>
                      <input className="auth-input" placeholder="••••••••" type="password" required
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                        style={s.input}/>
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading} style={s.btn}>
                      {loading ? '...' : 'Đăng nhập →'}
                    </button>
                  </form>
                  <button onClick={() => setShowEmail(false)} style={{
                    width:'100%', marginTop:8, padding:'8px', border:'none', background:'none',
                    fontSize:12, color:'#aaa', cursor:'pointer',
                  }}>← Quay lại</button>
                </div>
              )}

              {/* description */}
              {!showEmail && (
                <p style={{ textAlign:'center', fontSize:12, color:'#999', marginTop:16, lineHeight:1.6 }}>
                  Đăng ký ngay và nhận ngay 500 điểm thưởng + voucher giảm 20% cho chuyến đầu tiên!
                </p>
              )}

              {/* register */}
              <p style={{ textAlign:'center', marginTop:14, fontSize:13, color:'#888', paddingTop:14, borderTop:'1px solid #f0f0f0' }}>
                Chưa có tài khoản?{' '}
                <Link to="/register" style={{ color:P, fontWeight:700, textDecoration:'none' }}>
                  Đăng ký ngay
                </Link>
              </p>

              {/* terms */}
              <p style={{ textAlign:'center', fontSize:11, color:'#bbb', marginTop:10, lineHeight:1.6 }}>
                Bằng cách đăng nhập, bạn đồng ý với{' '}
                <Link to="/dieu-khoan" style={{ color:P, textDecoration:'none' }}>Điều khoản sử dụng</Link>
                {' '}và{' '}
                <Link to="/bao-mat" style={{ color:P, textDecoration:'none' }}>Chính sách bảo mật</Link>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const s = {
  label: { display:'block', fontSize:11, fontWeight:700, color:'#666', marginBottom:5, letterSpacing:.3 },
  input: { display:'block', width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e8e8e8', fontSize:14, boxSizing:'border-box', background:'#fafafa', outline:'none', transition:'border-color .15s, box-shadow .15s' },
  btn:   { width:'100%', padding:'12px', background:P, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:`0 4px 14px ${P}44` },
};
