import { Link } from 'react-router-dom';

const INK  = '#0C1825';
const P    = '#1D7DB8';
const MUTED = 'rgba(255,255,255,0.5)';

const COL = {
  title: { fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.1em',
    textTransform: 'uppercase', marginBottom: 14 },
  link:  { display: 'block', fontSize: 13.5, color: 'rgba(255,255,255,0.65)',
    textDecoration: 'none', marginBottom: 9, transition: 'color .15s', lineHeight: 1.4 },
};

function ColLink({ to, href, children }) {
  const style = COL.link;
  const hover = e => e.currentTarget.style.color = '#fff';
  const leave = e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
  if (href) return <a href={href} style={style} onMouseEnter={hover} onMouseLeave={leave} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <Link to={to} style={style} onMouseEnter={hover} onMouseLeave={leave}>{children}</Link>;
}

/* SVG icons */
const IconFacebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconYoutube = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon fill="#0C1825" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
);
const IconTiktok = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.78a4.85 4.85 0 0 1-1.07-.09z"/>
  </svg>
);
const IconZalo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.52-4.48-10-10-10zm0 18c-4.42 0-8-3.58-8-8 0-4.42 3.58-8 8-8 4.42 0 8 3.58 8 8 0 4.42-3.58 8-8 8zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"/>
  </svg>
);
const IconPhone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconMapPin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

export default function Footer() {
  return (
    <footer style={{ background: INK, color: '#fff', marginTop: 0 }}>
      {/* ── Top divider gradient ── */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${P}, #2caae2, #D4A020, ${P})` }}/>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 32px 36px', display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40,
      }}>
        {/* Col 1 — Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, background: P, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em',
            }}>F</div>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>FASTBUS</span>
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, margin: '0 0 20px', maxWidth: 280 }}>
            Nền tảng đặt vé xe khách trực tuyến hàng đầu Việt Nam. Nhanh chóng, tiện lợi, an toàn.
          </p>
          {/* Social */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { icon: <IconFacebook/>, label: 'Facebook', href: '#' },
              { icon: <IconYoutube/>,  label: 'Youtube',  href: '#' },
              { icon: <IconTiktok/>,   label: 'TikTok',   href: '#' },
              { icon: <IconZalo/>,     label: 'Zalo',     href: '#' },
            ].map(({ icon, label, href }) => (
              <a key={label} href={href} aria-label={label}
                style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.65)', textDecoration: 'none', transition: 'background .15s, color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = P; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >{icon}</a>
            ))}
          </div>
        </div>

        {/* Col 2 — Services */}
        <div>
          <div style={COL.title}>Dịch vụ</div>
          <ColLink to="/search">Tìm chuyến xe</ColLink>
          <ColLink to="/profile">Vé của tôi</ColLink>
          <ColLink to="/profile">Ví FASTPAY</ColLink>
          <ColLink to="/profile">Tích điểm thưởng</ColLink>
          <ColLink to="/tin-tuc">Tin tức & Ưu đãi</ColLink>
        </div>

        {/* Col 3 — Support */}
        <div>
          <div style={COL.title}>Hỗ trợ</div>
          <ColLink to="/lien-he">Liên hệ hỗ trợ</ColLink>
          <ColLink to="/lien-he">Câu hỏi thường gặp</ColLink>
          <ColLink to="/chinh-sach-hoan-ve">Chính sách hoàn vé</ColLink>
          <ColLink to="/dieu-khoan">Điều khoản sử dụng</ColLink>
          <ColLink to="/bao-mat">Chính sách bảo mật</ColLink>
        </div>

        {/* Col 4 — Company */}
        <div>
          <div style={COL.title}>Công ty</div>
          <ColLink to="/ve-chung-toi">Về FASTBUS</ColLink>
          <ColLink to="/lien-he">Đối tác nhà xe</ColLink>
          <ColLink to="/lien-he">Tuyển dụng</ColLink>
        </div>
      </div>

      {/* ── Contact strip ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 32px',
          display: 'flex', flexWrap: 'wrap', gap: '12px 40px', alignItems: 'center',
        }}>
          {[
            { icon: <IconPhone/>, text: '1900 6789' },
            { icon: <IconMail/>,  text: 'support@fastbus.vn' },
            { icon: <IconMapPin/>,text: '123 Nguyễn Huệ, Q.1, TP.HCM' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: 'rgba(255,255,255,0.6)',
            }}>
              <span style={{ color: P }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <p style={{ fontSize: 12.5, color: MUTED, margin: 0 }}>
          © 2025 FASTBUS. All rights reserved.
        </p>

        {/* Payment badges */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[
            { label: 'VNPay', bg: '#005BAA', color: '#fff' },
            { label: 'Visa',  bg: '#1A1F71', color: '#fff' },
            { label: 'MC',    bg: '#EB001B', color: '#fff' },
            { label: 'Momo',  bg: '#A50064', color: '#fff' },
          ].map(({ label, bg, color }) => (
            <div key={label} style={{ background: bg, color, fontSize: 10, fontWeight: 800,
              padding: '4px 9px', borderRadius: 5, letterSpacing: '0.03em',
            }}>{label}</div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
          Đã đăng ký Bộ Công Thương
        </p>
      </div>

      {/* ── Responsive ── */}
      <style>{`
        @media (max-width: 860px) {
          footer > div:nth-child(2) { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 520px) {
          footer > div:nth-child(2) { grid-template-columns: 1fr !important; padding: 36px 20px 24px !important; }
        }
      `}</style>
    </footer>
  );
}
