import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, getPublicVouchers, getCities } from '../services/api';
import useSEO from '../hooks/useSEO';

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.05, rootMargin: '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line
  return [ref, inView];
}

const P = '#1D7DB8';   // primary
const INK = '#0C1825'; // ink
const INK2 = '#1C3351';
const MUTED = '#5E7A96';
const SOFT = '#E3F1FA';


const POPULAR = [
  { from:'TP. Hồ Chí Minh', to:'Đà Lạt',    km:310, price:'290.000đ', img:'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=900&q=80' },
  { from:'Hà Nội',           to:'Sapa',       km:320, price:'280.000đ', img:'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&q=80' },
  { from:'Đà Nẵng',          to:'Huế',        km:100, price:'90.000đ',  img:'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900&q=80' },
  { from:'TP. Hồ Chí Minh', to:'Nha Trang',  km:430, price:'320.000đ', img:'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&q=80' },
  { from:'Hà Nội',           to:'Hải Phòng', km:120, price:'95.000đ',  img:'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=900&q=80' },
  { from:'TP. Hồ Chí Minh', to:'Vũng Tàu',  km:125, price:'120.000đ', img:'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=900&q=80' },
];

const IcTicket = ({ c }) => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    <rect x="8" y="20" width="56" height="32" rx="6" fill={c} opacity=".15"/>
    <rect x="8" y="20" width="56" height="32" rx="6" stroke={c} strokeWidth="2.5"/>
    <circle cx="8" cy="36" r="5" fill="white" stroke={c} strokeWidth="2.5"/>
    <circle cx="64" cy="36" r="5" fill="white" stroke={c} strokeWidth="2.5"/>
    <line x1="20" y1="36" x2="52" y2="36" stroke={c} strokeWidth="2" strokeDasharray="4 3"/>
    <rect x="16" y="26" width="18" height="4" rx="2" fill={c} opacity=".7"/>
    <rect x="16" y="32" width="12" height="3" rx="1.5" fill={c} opacity=".4"/>
    <rect x="44" y="26" width="12" height="10" rx="3" fill={c} opacity=".25" stroke={c} strokeWidth="1.5"/>
    <path d="M47 31l2 2 4-3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcShield = ({ c }) => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    <path d="M36 8L14 18v16c0 13.3 9.3 25.7 22 29 12.7-3.3 22-15.7 22-29V18L36 8z" fill={c} opacity=".15" stroke={c} strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M26 36l7 7 14-14" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="52" cy="20" r="8" fill="#16A34A" opacity=".9"/>
    <path d="M49 20l2 2 4-3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcSeat = ({ c }) => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    <rect x="10" y="10" width="22" height="22" rx="5" fill={c} opacity=".8"/>
    <rect x="40" y="10" width="22" height="22" rx="5" fill={c} opacity=".25" stroke={c} strokeWidth="2"/>
    <rect x="10" y="40" width="22" height="22" rx="5" fill={c} opacity=".25" stroke={c} strokeWidth="2"/>
    <rect x="40" y="40" width="22" height="22" rx="5" fill={c} opacity=".25" stroke={c} strokeWidth="2"/>
    <path d="M17 21l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="51" cy="21" r="3" fill={c} opacity=".5"/>
    <circle cx="21" cy="51" r="3" fill={c} opacity=".5"/>
    <circle cx="51" cy="51" r="3" fill={c} opacity=".5"/>
  </svg>
);
const IcTag = ({ c }) => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
    <path d="M38 8H56a4 4 0 0 1 4 4v18L36 54 18 36l20-28z" fill={c} opacity=".15" stroke={c} strokeWidth="2.5" strokeLinejoin="round"/>
    <circle cx="50" cy="22" r="4" fill={c} opacity=".7"/>
    <path d="M14 42l16 16" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="20" y="52" width="22" height="10" rx="5" fill="#D4A020" opacity=".9"/>
    <text x="31" y="61" textAnchor="middle" fontSize="7" fontWeight="800" fill="white">SALE</text>
  </svg>
);

const FEATURES = [
  { Icon: IcTicket, t: 'Đặt vé chỉ trong 60 giây', d: 'Quy trình đặt vé được tối giản tối đa — chỉ cần chọn tuyến, chọn ghế và thanh toán là xong. Vé điện tử gửi ngay qua email và SMS, không cần in, không cần xếp hàng. Bạn có thể đặt bất cứ lúc nào, kể cả lúc nửa đêm.' },
  { Icon: IcShield, t: 'Thanh toán an toàn, hoàn tiền minh bạch', d: 'Toàn bộ giao dịch được mã hoá bằng chuẩn bảo mật ngân hàng. Nếu chuyến xe bị huỷ hoặc bạn huỷ đúng chính sách, tiền sẽ được hoàn về ví FASTPAY trong vài phút — không cần liên hệ, không cần chờ đợi.' },
  { Icon: IcSeat,   t: 'Chọn ghế trực quan theo sơ đồ thực tế', d: 'Xem chính xác vị trí từng ghế trên xe trước khi đặt — biết ngay đâu là ghế cửa sổ, đâu là lối đi, tầng trên hay tầng dưới. Ghế nào đã có người đặt hiển thị rõ theo thời gian thực, tránh nhầm lẫn hoàn toàn.' },
  { Icon: IcTag,    t: 'Giá tốt nhất, nhiều ưu đãi hàng ngày', d: 'FASTBUS cam kết mức giá thấp nhất so với mua trực tiếp tại bến. Thêm vào đó, thành viên còn được tích điểm thưởng 1% mỗi chuyến, nhận voucher giảm giá độc quyền và ưu tiên truy cập các đợt flash sale giới hạn.' },
];

const STATS = [
  { v: '500K+', l: 'Lượt đặt vé' },
  { v: '200+',  l: 'Nhà xe đối tác' },
  { v: '4.8★',  l: 'Đánh giá trung bình' },
  { v: '24/7',  l: 'Hỗ trợ khách hàng' },
];

const BANNERS = [
  { id: 1, tag: 'TUẦN LỄ ƯU ĐÃI', tagColor: '#D4A020',
    bg: 'linear-gradient(135deg, #0C1825 0%, #1C3351 50%, #1D7DB8 100%)',
    img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=700&q=80',
    title: 'Giảm đến 30%', sub: 'Cho lần đặt vé đầu tiên trên FASTBUS',
    code: 'FIRSTRIDE', cta: 'Đặt ngay', ctaTo: '/search',
  },
  { id: 2, tag: 'DEAL CUỐI TUẦN', tagColor: '#16A34A',
    bg: 'linear-gradient(135deg, #0f2920 0%, #145c38 50%, #16a34a 100%)',
    img: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=700&q=80',
    title: 'Combo tiết kiệm', sub: 'Đặt 2 vé cùng chuyến, giảm thêm 20%',
    code: 'COMBO20', cta: 'Xem tuyến', ctaTo: '/search',
  },
  { id: 3, tag: 'THÀNH VIÊN MỚI', tagColor: '#7c3aed',
    bg: 'linear-gradient(135deg, #1a0535 0%, #3b0f6e 50%, #7c3aed 100%)',
    img: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=700&q=80',
    title: '+500 điểm thưởng', sub: 'Khi đăng ký tài khoản FASTBUS miễn phí',
    code: null, cta: 'Đăng ký ngay', ctaTo: '/register',
  },
];

const QUICK = [
  ['TP. Hồ Chí Minh','Đà Lạt'],
  ['Hà Nội','Sapa'],
  ['Đà Nẵng','Huế'],
  ['TP. Hồ Chí Minh','Nha Trang'],
];

// icon/color palette xoay vòng cho voucher cards
const VOUCHER_STYLES = [
  { icon:'🎟️', iconBg:'#E3F1FA',  badgeColor: P          },
  { icon:'⭐',  iconBg:'#fef9c3',  badgeColor: '#D4A020'  },
  { icon:'🎁',  iconBg:'#f0fdf4',  badgeColor: '#16A34A'  },
  { icon:'🚌',  iconBg:'#f5f3ff',  badgeColor: '#7c3aed'  },
  { icon:'💳',  iconBg:'#fff0f0',  badgeColor: '#e11d48'  },
  { icon:'🏷️',  iconBg:'#fff7ed',  badgeColor: '#ea580c'  },
];

function fmtVoucherTitle(v) {
  if (v.type === 'percent') return `Giảm ${v.value}%`;
  return `Giảm ${v.value.toLocaleString('vi-VN')}đ`;
}

function fmtVoucherBadge(v) {
  if (v.minOrder > 0) return `Đơn từ ${v.minOrder.toLocaleString('vi-VN')}đ`;
  return 'Toàn tuyến';
}

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function Home() {
  const navigate = useNavigate();
  const [from,       setFrom]      = useState('TP. Hồ Chí Minh');
  const [to,         setTo]        = useState('Đà Lạt');
  const [fromInput,  setFromInput] = useState('TP. Hồ Chí Minh');
  const [toInput,    setToInput]   = useState('Đà Lạt');
  const [date,       setDate]      = useState(today());
  const [passengers, setPassengers] = useState(1);
  const [fromOpen,   setFromOpen]  = useState(false);
  const [toOpen,     setToOpen]    = useState(false);
  const [cities, setCities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [voucherIdx, setVoucherIdx] = useState(0);
  const [copied, setCopied] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [popularRef, popularInView] = useInView();
  const [whyRef,     whyInView]     = useInView();
  const newsRef = useRef(null);
  const [newsInView, setNewsInView] = useState(false);

  useSEO({ title: 'FASTBUS — Đặt vé xe khách trực tuyến', description: 'Đặt vé xe khách trực tuyến nhanh chóng, tiện lợi. Hàng trăm tuyến xe khắp Việt Nam.' });

  useEffect(() => {
    getCities().then(r => setCities(r.data || [])).catch(() => {});
    getPosts({ limit: 3, status: 'published' }).then(r => setPosts(r.data.posts || r.data || [])).catch(() => {});
    getPublicVouchers().then(r => setVouchers(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (vouchers.length < 2) return;
    const t = setInterval(() => setVoucherIdx(i => (i + 1) % vouchers.length), 3500);
    return () => clearInterval(t);
  }, [vouchers.length]);

  useEffect(() => {
    if (posts.length === 0) return;
    const el = newsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setNewsInView(true); obs.disconnect(); } },
      { threshold: 0.05, rootMargin: '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [posts.length]); // eslint-disable-line

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const swap = () => {
    const tmpVal = from; const tmpInput = fromInput;
    setFrom(to);       setFromInput(toInput);
    setTo(tmpVal);     setToInput(tmpInput);
  };
  const search = () => {
    if (!from || !to) return;
    navigate(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&passengers=${passengers}`);
  };

  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes pulse    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.6} }
        @keyframes floatY   { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-8px)} }
        .hm-inview          { animation:fadeIn .65s ease both; }
        .hm-pop-card:hover  { transform:translateY(-4px); box-shadow:0 16px 40px rgba(11,31,58,0.15)!important; }
        .hm-pop-card        { transition:transform .2s,box-shadow .2s; }
        .hm-route-row:hover { background:var(--primary-soft)!important; }
        .hm-feat-card:hover { transform:translateY(-4px); box-shadow:0 10px 32px rgba(11,31,58,0.1)!important; }
        .hm-feat-card       { transition:transform .2s,box-shadow .2s; }
        .hm-search-btn:hover { box-shadow:0 8px 28px rgba(29,125,184,0.45)!important; transform:translateY(-1px); }
        .hm-search-btn      { transition:box-shadow .15s,transform .15s; }
        .hm-city-drop { position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,0.12);z-index:100;max-height:240px;overflow-y:auto; }
        .hm-city-opt:hover { background:var(--primary-soft)!important; color:var(--primary)!important; }
        @media(max-width:900px){
          .hm-search-row{flex-direction:column!important;}
          .hm-search-divider{display:none!important;}
          .hm-pop-grid{grid-template-columns:repeat(2,1fr)!important;}
          .hm-feat-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
        @media(max-width:600px){
          .hm-pop-grid{grid-template-columns:1fr!important;}
          .hm-feat-grid{grid-template-columns:1fr!important;}
          .hm-stats-row{grid-template-columns:repeat(2,1fr)!important;}
          .hm-hero-title{font-size:34px!important;}
        }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ position:'relative', overflow:'hidden',
        backgroundImage:'url(/hero.png)', backgroundSize:'cover', backgroundPosition:'center 55%',
      }}>
        {/* dark overlay — graduated so pier/water area still visible */}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(180deg, rgba(8,16,30,0.62) 0%, rgba(8,16,30,0.38) 45%, rgba(8,16,30,0.60) 100%)',
        }}/>
        {/* subtle vignette edges */}
        <div style={{ position:'absolute', inset:0,
          background:'radial-gradient(ellipse at 50% 0%, transparent 50%, rgba(8,16,30,0.30) 100%)',
        }}/>

        <div style={{ position:'relative', maxWidth:1280, margin:'0 auto', padding:'80px 32px 200px', color:'#fff',
          animation:'fadeUp .6s ease both',
        }}>
          {/* badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px',
            borderRadius:999, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)',
            backdropFilter:'blur(8px)',
            fontSize:12, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:24,
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#D4A020', animation:'pulse 2s ease-in-out infinite' }}/>
            {'Đặt vé xe khách trực tuyến · 100+ tuyến'}
          </div>

          <h1 className="hm-hero-title" style={{ fontSize:54, fontWeight:800, lineHeight:1.07,
            margin:'0 0 18px', letterSpacing:'-0.03em', maxWidth:680,
            textShadow:'0 2px 20px rgba(0,0,0,0.4)',
          }}>
            {'Đặt vé xe khách'}<br/>
            <span style={{ color:'#D4B84A' }}>{'nhanh, an toàn,'}</span> {'đáng tin cậy.'}
          </h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.80)', maxWidth:500, lineHeight:1.75, margin:0,
            textShadow:'0 1px 8px rgba(0,0,0,0.3)',
          }}>
            {'Hơn 200 nhà xe uy tín trên toàn quốc. Chọn ghế trực quan, thanh toán an toàn, nhận vé điện tử ngay.'}
          </p>

          {/* stats */}
          <div className="hm-stats-row" style={{ display:'grid', gridTemplateColumns:'repeat(4,auto)', gap:'28px 40px', marginTop:34, width:'fit-content' }}>
            {STATS.map((s,i) => (
              <div key={i}>
                <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.02em', textShadow:'0 1px 6px rgba(0,0,0,0.4)' }}>{s.v}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.60)', fontWeight:600, marginTop:2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FLOATING SEARCH CARD ── */}
      <div style={{ maxWidth:1280, margin:'-110px auto 0', padding:'0 32px', position:'relative', zIndex:10 }}>
        <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 20px 60px rgba(11,31,58,0.15), 0 4px 16px rgba(11,31,58,0.08)',
          padding:'28px 28px 24px', border:'1px solid var(--line)',
        }}>
          <div className="hm-search-row" style={{ display:'flex', gap:0, alignItems:'flex-end' }}>
            {/* From */}
            <div style={{ flex:1, position:'relative' }}>
              <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{'Từ'}</div>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none', zIndex:1, lineHeight:1 }}>📍</span>
                <input type="text" value={fromInput}
                  onChange={e => { setFromInput(e.target.value); setFromOpen(true); }}
                  onFocus={e => { e.target.style.borderColor = P; setFromInput(''); setFromOpen(true); }}
                  onBlur={e => { e.target.style.borderColor = 'var(--line)'; setTimeout(() => { setFromOpen(false); setFromInput(from); }, 150); }}
                  placeholder="Nhập tên thành phố..."
                  style={{ width:'100%', border:'1.5px solid var(--line)', borderRadius:12,
                    padding:'0 14px 0 36px', fontSize:15, fontWeight:600, color:INK,
                    background:'#fff', outline:'none', height:46, boxSizing:'border-box', fontFamily:'inherit',
                  }}
                />
              </div>
              {fromOpen && (
                <div className="hm-city-drop">
                  {(cities.filter(c => !fromInput || c.toLowerCase().includes(fromInput.toLowerCase())))
                    .map(c => (
                      <div key={c} className="hm-city-opt"
                        onMouseDown={() => { setFrom(c); setFromInput(c); setFromOpen(false); }}
                        style={{ padding:'10px 16px', fontSize:14, fontWeight:600, cursor:'pointer',
                          background: from===c ? 'var(--primary-soft)' : '#fff',
                          color: from===c ? P : INK,
                        }}>
                        {c}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Swap */}
            <div className="hm-search-divider" style={{ display:'flex', flexDirection:'column', padding:'0 8px' }}>
              <div style={{ height:22 }}/>
              <button onClick={swap} style={{
                width:38, height:38, borderRadius:'50%', border:`1.5px solid var(--line)`,
                background:'#fff', cursor:'pointer', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:16, color:MUTED,
                transition:'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background=P; e.currentTarget.style.color='#fff'; e.currentTarget.style.borderColor=P; }}
              onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color=MUTED; e.currentTarget.style.borderColor='var(--line)'; }}
              >⇄</button>
            </div>

            {/* To */}
            <div style={{ flex:1, position:'relative' }}>
              <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{'Đến'}</div>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none', zIndex:1, lineHeight:1 }}>📍</span>
                <input type="text" value={toInput}
                  onChange={e => { setToInput(e.target.value); setToOpen(true); }}
                  onFocus={e => { e.target.style.borderColor = P; setToInput(''); setToOpen(true); }}
                  onBlur={e => { e.target.style.borderColor = 'var(--line)'; setTimeout(() => { setToOpen(false); setToInput(to); }, 150); }}
                  placeholder="Nhập tên thành phố..."
                  style={{ width:'100%', border:'1.5px solid var(--line)', borderRadius:12,
                    padding:'0 14px 0 36px', fontSize:15, fontWeight:600, color:INK,
                    background:'#fff', outline:'none', height:46, boxSizing:'border-box', fontFamily:'inherit',
                  }}
                />
              </div>
              {toOpen && (
                <div className="hm-city-drop">
                  {(cities.filter(c => !toInput || c.toLowerCase().includes(toInput.toLowerCase())))
                    .map(c => (
                      <div key={c} className="hm-city-opt"
                        onMouseDown={() => { setTo(c); setToInput(c); setToOpen(false); }}
                        style={{ padding:'10px 16px', fontSize:14, fontWeight:600, cursor:'pointer',
                          background: to===c ? 'var(--primary-soft)' : '#fff',
                          color: to===c ? P : INK,
                        }}>
                        {c}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div style={{ flex:'0 0 200px', paddingLeft:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{'Ngày đi'}</div>
              <input type="date" value={date} min={today()} onChange={e => setDate(e.target.value)}
                style={{ width:'100%', border:'1.5px solid var(--line)', borderRadius:12, padding:'0 14px',
                  fontSize:15, fontWeight:700, color:INK, background:'#fff', cursor:'pointer',
                  outline:'none', height:46, boxSizing:'border-box',
                }}
                onFocus={e => e.target.style.borderColor = P}
                onBlur={e => e.target.style.borderColor = 'var(--line)'}
              />
            </div>

            {/* Passengers */}
            <div style={{ flex:'0 0 140px', paddingLeft:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{'Hành khách'}</div>
              <div style={{ display:'flex', alignItems:'center', gap:0, border:'1.5px solid var(--line)', borderRadius:12, padding:'0 8px 0 14px', background:'#fff', height:46, boxSizing:'border-box' }}>
                <span style={{ fontSize:18, marginRight:6 }}>👤</span>
                <button onClick={() => setPassengers(p => Math.max(1, p-1))}
                  style={{ border:'none', background:'none', color:'#888', fontSize:20, cursor:'pointer', padding:'0 6px', lineHeight:1, fontWeight:300 }}>−</button>
                <span style={{ fontSize:15, fontWeight:700, color:INK, minWidth:20, textAlign:'center' }}>{passengers}</span>
                <button onClick={() => setPassengers(p => Math.min(10, p+1))}
                  style={{ border:'none', background:'none', color:'#888', fontSize:20, cursor:'pointer', padding:'0 6px', lineHeight:1, fontWeight:300 }}>+</button>
              </div>
            </div>

            {/* Search button */}
            <div style={{ display:'flex', flexDirection:'column', paddingLeft:16 }}>
              <div style={{ height:22 }}/>
              <button className="hm-search-btn" onClick={search}
                style={{ padding:'0 32px', background:P, color:'#fff', border:'none', borderRadius:12,
                  fontSize:15, fontWeight:800, cursor:'pointer', whiteSpace:'nowrap',
                  boxShadow:`0 4px 16px rgba(29,125,184,0.35)`,
                  height:46, boxSizing:'border-box',
                }}>
                {'Tìm chuyến'}
              </button>
            </div>
          </div>

          {/* Quick suggestions */}
          <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, color:MUTED, letterSpacing:'0.05em', textTransform:'uppercase' }}>{'Tuyến phổ biến'}:</span>
            {QUICK.map(([f,t]) => (
              <button key={f+t}
                onClick={() => { setFrom(f); setTo(t); }}
                style={{ padding:'5px 12px', borderRadius:999, background:'#fff', border:'1px solid var(--line)',
                  fontSize:13, fontWeight:600, color:INK2, cursor:'pointer',
                  transition:'all .12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=P; e.currentTarget.style.color=P; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--line)'; e.currentTarget.style.color=INK2; }}
              >
                {f.replace('TP. Hồ Chí Minh','TP.HCM')} → {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROMO BANNER CAROUSEL ── */}
      <div style={{ maxWidth:1280, margin:'32px auto 0', padding:'0 32px' }}>
        <div style={{ position:'relative', borderRadius:18, overflow:'hidden',
          boxShadow:'0 8px 32px rgba(11,31,58,0.14)', border:'1px solid rgba(255,255,255,0.1)',
        }}>
          {/* slides */}
          <div style={{ display:'flex', transition:'transform .5s cubic-bezier(.4,0,.2,1)',
            transform:`translateX(-${bannerIdx * 100}%)`,
          }}>
            {BANNERS.map(b => (
              <div key={b.id} style={{ minWidth:'100%', display:'flex', alignItems:'stretch',
                background: b.bg, minHeight:180, position:'relative', overflow:'hidden',
              }}>
                {/* photo right side */}
                <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'45%', overflow:'hidden' }}>
                  <img src={b.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.45 }}
                    onError={e => e.target.style.display='none'}/>
                  <div style={{ position:'absolute', inset:0,
                    background:'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 70%)' }}/>
                </div>

                {/* text left */}
                <div style={{ position:'relative', zIndex:1, padding:'28px 36px', maxWidth:'65%', color:'#fff' }}>
                  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999,
                    background: b.tagColor, color:'#fff', fontSize:11, fontWeight:800,
                    letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:14,
                  }}>{b.tag}</span>

                  <div style={{ fontSize:34, fontWeight:900, lineHeight:1.05,
                    letterSpacing:'-0.03em', marginBottom:8,
                    textShadow:'0 2px 12px rgba(0,0,0,0.4)',
                  }}>{b.title}</div>
                  <div style={{ fontSize:14, color:'rgba(255,255,255,0.82)', marginBottom:18, fontWeight:500 }}>
                    {b.sub}
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    {b.code && (
                      <div style={{ display:'flex', alignItems:'center', gap:8,
                        background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
                        border:'1.5px dashed rgba(255,255,255,0.45)', borderRadius:10,
                        padding:'7px 14px',
                      }}>
                        <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>{'MÃ:'}</span>
                        <span style={{ fontSize:15, fontWeight:800, letterSpacing:'0.1em' }}>{b.code}</span>
                        <button onClick={() => copyCode(b.code)} style={{
                          background: copied===b.code ? '#16A34A' : 'rgba(255,255,255,0.25)',
                          border:'none', borderRadius:6, color:'#fff', fontSize:12, fontWeight:700,
                          padding:'3px 10px', cursor:'pointer', transition:'background .2s',
                        }}>{copied===b.code ? 'Đã sao chép!' : 'Sao chép mã'}</button>
                      </div>
                    )}
                    <button onClick={() => navigate(b.ctaTo)} style={{
                      background:'#fff', color: b.id===2 ? '#145c38' : b.id===3 ? '#4c1d95' : P,
                      border:'none', borderRadius:10, padding:'9px 22px',
                      fontSize:14, fontWeight:800, cursor:'pointer',
                      boxShadow:'0 4px 14px rgba(0,0,0,0.2)', transition:'transform .15s',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                    onMouseLeave={e=>e.currentTarget.style.transform=''}
                    >{b.cta} →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* arrow left */}
          <button onClick={() => setBannerIdx(i => (i - 1 + BANNERS.length) % BANNERS.length)}
            style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
              width:36, height:36, borderRadius:'50%', border:'none',
              background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)',
              color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background .15s', zIndex:2,
            }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.32)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
          >‹</button>

          {/* arrow right */}
          <button onClick={() => setBannerIdx(i => (i + 1) % BANNERS.length)}
            style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
              width:36, height:36, borderRadius:'50%', border:'none',
              background:'rgba(255,255,255,0.18)', backdropFilter:'blur(8px)',
              color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background .15s', zIndex:2,
            }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.32)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'}
          >›</button>

          {/* dots */}
          <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)',
            display:'flex', gap:7, zIndex:2,
          }}>
            {BANNERS.map((_,i) => (
              <button key={i} onClick={() => setBannerIdx(i)} style={{
                width: i===bannerIdx ? 22 : 8, height:8, borderRadius:999, border:'none',
                background: i===bannerIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor:'pointer', padding:0, transition:'all .3s',
              }}/>
            ))}
          </div>
        </div>
      </div>

      {/* ── VOUCHERS CAROUSEL ── */}
      {vouchers.length > 0 && (
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'40px 32px 0' }}>
          {/* header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22 }}>🎁</span>
              <div>
                <h2 style={{ fontSize:20, fontWeight:800, color:INK, margin:0, letterSpacing:'-0.02em' }}>{'Ưu đãi hôm nay'}</h2>
                <p style={{ margin:0, fontSize:12, color:MUTED }}>{'Áp dụng ngay khi đặt vé'}</p>
              </div>
            </div>
            {/* dots */}
            {vouchers.length > 1 && (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {vouchers.map((_,i) => (
                  <button key={i} onClick={() => setVoucherIdx(i)} style={{
                    width: i===voucherIdx ? 22 : 8, height:8, borderRadius:999, border:'none', padding:0,
                    background: i===voucherIdx ? P : '#C8D5E4',
                    cursor:'pointer', transition:'all .3s',
                  }}/>
                ))}
              </div>
            )}
          </div>

          {/* slider */}
          <div style={{ position:'relative' }}>
            <div style={{ overflow:'hidden', borderRadius:14,
              boxShadow:'0 2px 12px rgba(11,31,58,0.08)', border:'1px solid var(--line)',
            }}>
              <div style={{ display:'flex', transition:'transform .5s cubic-bezier(.4,0,.2,1)',
                transform:`translateX(-${voucherIdx * 100}%)`,
              }}>
                {vouchers.map((v, idx) => {
                  const st = VOUCHER_STYLES[idx % VOUCHER_STYLES.length];
                  return (
                    <div key={v.code} style={{ minWidth:'100%', display:'flex', alignItems:'stretch',
                      background:'#fff', overflow:'hidden',
                    }}>
                      {/* left icon block */}
                      <div style={{ width:96, flexShrink:0, background:st.iconBg,
                        display:'grid', placeItems:'center', fontSize:38,
                      }}>{st.icon}</div>

                      {/* middle info */}
                      <div style={{ flex:1, padding:'22px 28px', minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                          <span style={{ fontSize:22, fontWeight:900, color:INK, letterSpacing:'-0.02em' }}>
                            {fmtVoucherTitle(v)}
                          </span>
                          <span style={{ fontSize:11, fontWeight:700, color:st.badgeColor,
                            background: st.badgeColor + '18', padding:'3px 10px', borderRadius:999,
                          }}>{fmtVoucherBadge(v)}</span>
                        </div>
                        <p style={{ margin:'0 0 10px', fontSize:13, color:MUTED, lineHeight:1.6 }}>
                          {v.description || (v.maxDiscount > 0
                            ? `Giảm tối đa ${v.maxDiscount.toLocaleString('vi-VN')}đ`
                            : 'Áp dụng cho tất cả tuyến đường')}
                        </p>
                        <div style={{ display:'flex', gap:16, fontSize:12, color:MUTED, flexWrap:'wrap' }}>
                          {v.minOrder > 0 && (
                            <span>Đơn tối thiểu <b style={{color:INK2}}>{v.minOrder.toLocaleString('vi-VN')}đ</b></span>
                          )}
                          {v.maxDiscount > 0 && (
                            <span>Giảm tối đa <b style={{color:INK2}}>{v.maxDiscount.toLocaleString('vi-VN')}đ</b></span>
                          )}
                          {v.expiresAt && (
                            <span>HSD: <b style={{color:INK2}}>{new Date(v.expiresAt).toLocaleDateString('vi-VN')}</b></span>
                          )}
                        </div>
                      </div>

                      {/* dashed divider */}
                      <div style={{ position:'relative', width:0, flexShrink:0, alignSelf:'stretch' }}>
                        <div style={{ position:'absolute', top:0, bottom:0, left:0,
                          borderLeft:'1.5px dashed var(--line)',
                        }}/>
                        <div style={{ position:'absolute', top:-1, left:-8, width:16, height:16,
                          borderRadius:'50%', background:'var(--surface-2)', border:'1px solid var(--line)',
                        }}/>
                        <div style={{ position:'absolute', bottom:-1, left:-8, width:16, height:16,
                          borderRadius:'50%', background:'var(--surface-2)', border:'1px solid var(--line)',
                        }}/>
                      </div>

                      {/* right code + copy */}
                      <div style={{ flexShrink:0, width:190, display:'flex', flexDirection:'column',
                        alignItems:'center', justifyContent:'center', gap:12, padding:'22px 24px',
                      }}>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:11, color:MUTED, fontWeight:600, marginBottom:4, letterSpacing:'0.05em' }}>{'MÃ GIẢM GIÁ'}</div>
                          <div style={{ fontSize:17, fontWeight:900, letterSpacing:'0.12em', color:INK }}>{v.code}</div>
                        </div>
                        <button onClick={() => copyCode(v.code)} style={{
                          width:'100%', padding:'9px 0', borderRadius:9, border:'none', cursor:'pointer',
                          fontSize:13, fontWeight:700,
                          background: copied===v.code ? '#16A34A' : SOFT,
                          color: copied===v.code ? '#fff' : P,
                          transition:'background .2s, color .2s',
                        }}>
                          {copied===v.code ? 'Đã sao chép!' : 'Sao chép mã'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* arrows */}
            {vouchers.length > 1 && (<>
              <button onClick={() => setVoucherIdx(i => (i - 1 + vouchers.length) % vouchers.length)}
                style={{ position:'absolute', left:-16, top:'50%', transform:'translateY(-50%)',
                  width:32, height:32, borderRadius:'50%', border:'1px solid var(--line)',
                  background:'#fff', color:MUTED, fontSize:16, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 2px 8px rgba(11,31,58,0.1)', transition:'all .15s', zIndex:2,
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=P;e.currentTarget.style.color=P;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)';e.currentTarget.style.color=MUTED;}}
              >‹</button>
              <button onClick={() => setVoucherIdx(i => (i + 1) % vouchers.length)}
                style={{ position:'absolute', right:-16, top:'50%', transform:'translateY(-50%)',
                  width:32, height:32, borderRadius:'50%', border:'1px solid var(--line)',
                  background:'#fff', color:MUTED, fontSize:16, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 2px 8px rgba(11,31,58,0.1)', transition:'all .15s', zIndex:2,
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=P;e.currentTarget.style.color=P;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--line)';e.currentTarget.style.color=MUTED;}}
              >›</button>
            </>)}
          </div>
        </div>
      )}

      {/* ── POPULAR ROUTES ── */}
      <div ref={popularRef} style={{ maxWidth:1280, margin:'0 auto', padding:'80px 32px 40px',
        opacity: popularInView ? 1 : 0, transform: popularInView ? 'none' : 'translateY(32px)',
        transition: 'opacity .7s ease, transform .7s ease',
      }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:P, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
              ─── {'Tuyến phổ biến'}
            </div>
            <h2 style={{ fontSize:30, fontWeight:800, color:INK, margin:0, letterSpacing:'-0.02em' }}>
              {'Tuyến xe phổ biến'}
            </h2>
          </div>
          <button onClick={() => navigate('/search')}
            style={{ fontSize:14, fontWeight:700, color:P, background:'none', border:'none', cursor:'pointer' }}>
            {'Xem tất cả tuyến →'}
          </button>
        </div>

        <div className="hm-pop-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {POPULAR.map((r, idx) => (
            <div key={r.from+r.to} style={{
              opacity: popularInView ? 1 : 0,
              transform: popularInView ? 'none' : 'translateY(28px)',
              transition: `opacity .55s ease ${idx * 0.09}s, transform .55s ease ${idx * 0.09}s`,
            }}>
            <div className="hm-pop-card"
              onClick={() => navigate(`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`)}
              style={{ background:'#fff', borderRadius:16, overflow:'hidden', cursor:'pointer',
                boxShadow:'0 2px 8px rgba(11,31,58,0.07)', border:'1px solid var(--line)',
              }}>
              {/* image */}
              <div style={{ position:'relative', height:160, overflow:'hidden' }}>
                <img src={r.img} alt={r.to}
                  style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  onError={e => e.target.style.display='none'}/>
                <div style={{ position:'absolute', inset:0,
                  background:'linear-gradient(0deg, rgba(11,31,58,0.8) 0%, rgba(11,31,58,0.05) 55%)' }}/>
                <div style={{ position:'absolute', bottom:14, left:16, right:16, color:'#fff' }}>
                  <div style={{ fontSize:11, fontWeight:700, opacity:.8, letterSpacing:'0.06em', marginBottom:4 }}>
                    {r.from.replace('TP. Hồ Chí Minh','TP.HCM').toUpperCase()} →
                  </div>
                  <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.01em' }}>{r.to}</div>
                </div>
              </div>
              {/* info */}
              <div style={{ padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:11, color:MUTED, fontWeight:600 }}>{'Từ'}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:P }}>{r.price}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, color:MUTED }}>{r.km} km</div>
                  <div style={{ fontSize:12, color:MUTED, fontWeight:600 }}>~{Math.round(r.km/60)}{' giờ'}</div>
                </div>
              </div>
            </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY FASTBUS ── */}
      <div ref={whyRef} style={{ background:'#fff', padding:'72px 32px',
        opacity: whyInView ? 1 : 0, transform: whyInView ? 'none' : 'translateY(32px)',
        transition: 'opacity .7s ease, transform .7s ease',
      }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', fontSize:26, fontWeight:900, color:INK,
            margin:'0 0 56px', letterSpacing:'-0.02em', lineHeight:1.35,
          }}>
            {'Tại sao chọn FASTBUS?'}
          </h2>

          {FEATURES.map((f, i) => {
            const even = i % 2 === 0;
            const illus = (
              <div style={{ flex:'0 0 220px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:180, height:180, borderRadius:'50%',
                  background: even ? '#E3F1FA' : '#EEF9F2',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  position:'relative',
                  boxShadow: even
                    ? '0 8px 32px rgba(29,125,184,0.15)'
                    : '0 8px 32px rgba(22,163,74,0.12)',
                  animation: whyInView ? `floatY 3.5s ease-in-out ${i * 0.4}s infinite` : 'none',
                }}>
                  <f.Icon c={even ? P : '#16A34A'}/>
                </div>
              </div>
            );
            const text = (
              <div style={{ flex:1 }}>
                <div style={{ fontSize:21, fontWeight:800, color:INK, marginBottom:14, letterSpacing:'-0.02em', lineHeight:1.3 }}>
                  {f.t}
                </div>
                <div style={{ fontSize:15, color:MUTED, lineHeight:1.9 }}>{f.d}</div>
              </div>
            );
            return (
              <div key={i} className="why-row" style={{
                display:'flex', alignItems:'center', gap:56,
                marginBottom: i < FEATURES.length - 1 ? 64 : 0,
                flexDirection: even ? 'row' : 'row-reverse',
              }}>
                {illus}
                {text}
              </div>
            );
          })}
        </div>
        <style>{`
          @media (max-width: 640px) {
            .why-row { flex-direction: column !important; gap: 20px !important; text-align: center; }
          }
        `}</style>
      </div>

      {/* ── NEWS ── */}
      {posts.length > 0 && (
        <div ref={newsRef} style={{ background:'#fff', borderTop:'1px solid var(--line)',
          opacity: newsInView ? 1 : 0,
          transform: newsInView ? 'none' : 'translateY(32px)',
          transition: 'opacity .7s ease, transform .7s ease',
        }}>
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'60px 32px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:28 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:800, color:P, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
                  ─── {'Tin tức & Khuyến mãi'}
                </div>
                <h2 style={{ fontSize:30, fontWeight:800, color:INK, margin:0, letterSpacing:'-0.02em' }}>{'Cập nhật mới nhất từ FASTBUS'}</h2>
              </div>
              <a href="/tin-tuc" style={{ fontSize:14, fontWeight:700, color:P, textDecoration:'none' }}>{'Xem tất cả tin tức →'}</a>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
              {posts.slice(0,3).map(p => (
                <a key={p._id} href={`/tin-tuc/${p.slug}`}
                  style={{ display:'block', textDecoration:'none', color:'inherit',
                    background:'#fff', borderRadius:16, overflow:'hidden',
                    border:'1px solid var(--line)', transition:'box-shadow .2s,transform .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 28px rgba(11,31,58,0.1)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}
                >
                  {p.thumbnail && (
                    <div style={{ height:160, overflow:'hidden' }}>
                      <img src={p.thumbnail} alt={p.title}
                        style={{ width:'100%', height:'100%', objectFit:'cover' }}
                        onError={e => e.target.style.display='none'}/>
                    </div>
                  )}
                  <div style={{ padding:18 }}>
                    <div style={{ fontSize:11, color:MUTED, fontWeight:600, marginBottom:8 }}>
                      {new Date(p.publishedAt || p.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:INK, lineHeight:1.4 }}>{p.title}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
