import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './navbar.css';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const NAV_LINKS = [
    ['/',             'Trang chủ'],
    ['/search',       'Tìm chuyến'],
    ['/tin-tuc',      'Tin tức'],
    ['/lien-he',      'Liên hệ'],
    ['/ve-chung-toi', 'Về chúng tôi'],
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Re-check scroll position on every page navigation
  useEffect(() => {
    setScrolled(window.scrollY > 30);
  }, [location.pathname]);

  const handleLogout = () => { logoutUser(); navigate('/'); setMobileOpen(false); };
  const closeMenu = () => setMobileOpen(false);

  const isHome = location.pathname === '/';
  // Solid when scrolled OR on any page other than Home
  const solid = scrolled || !isHome;

  const fg = solid ? '#1a1a1a' : '#fff';

  return (
    <nav style={{
      ...s.nav,
      background: solid ? 'rgba(255,255,255,0.97)' : 'transparent',
      boxShadow: solid ? '0 2px 24px rgba(0,0,0,0.1)' : 'none',
      backdropFilter: solid ? 'blur(16px)' : 'none',
      borderBottom: solid ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
    }}>
      <div style={s.inner} className="nav-inner">

        {/* ── Logo ── */}
        <div style={{ flex: 1 }}>
          <Link to="/" style={s.brand} onClick={closeMenu}>
            <span style={{ ...s.brandName, color: solid ? '#1D7DB8' : '#fff' }}>FASTBUS</span>
          </Link>
        </div>

        {/* ── Nav links (desktop) ── */}
        <div style={s.links} className="nav-desktop">
          {NAV_LINKS.map(([to, label]) => {
            const active = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);
            return (
              <Link key={to} to={to}
                className={solid ? 'nav-link-scrolled' : 'nav-link-blue'}
                style={{
                  ...s.link,
                  color: fg,
                  fontWeight:   active ? 700 : 500,
                  borderBottom: active
                    ? `3px solid ${solid ? '#1D7DB8' : '#fff'}`
                    : '3px solid transparent',
                }}>
                {label}
              </Link>
            );
          })}
        </div>

        {/* ── Auth (desktop) ── */}
        <div className="nav-desktop" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
          {user ? (
            <>
              <Link to={user.role === 'admin' ? '/admin' : '/profile'} style={s.userBtn}>
                <div style={{
                  ...s.avatar,
                  background: solid ? 'rgba(29,125,184,0.12)' : 'rgba(255,255,255,0.25)',
                  border: solid ? '2px solid #1D7DB8' : '2px solid rgba(255,255,255,0.6)',
                  color: solid ? '#1D7DB8' : '#fff',
                }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ ...s.userName, color: fg }}>{user.name}</span>
              </Link>
              <button onClick={handleLogout} style={{
                ...s.logoutBtn,
                background: solid ? 'rgba(29,125,184,0.08)' : 'rgba(255,255,255,0.15)',
                border: solid ? '1px solid rgba(29,125,184,0.3)' : '1px solid rgba(255,255,255,0.3)',
                color: solid ? '#1D7DB8' : '#fff',
              }} title="Đăng xuất">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </>
          ) : (
            <Link to="/login" style={{
              ...s.loginBtn,
              border: solid ? '1.5px solid #1D7DB8' : '1.5px solid rgba(255,255,255,0.7)',
              color: solid ? '#1D7DB8' : '#fff',
              background: solid ? 'rgba(29,125,184,0.06)' : 'rgba(255,255,255,0.15)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>

        {/* ── Hamburger (mobile only) ── */}
        <button className="nav-hamburger" onClick={() => setMobileOpen(o => !o)} style={{
          ...s.hamburger,
          background: solid ? 'rgba(29,125,184,0.1)' : 'rgba(255,255,255,0.15)',
          color: solid ? '#1D7DB8' : '#fff',
        }} aria-label="Menu">
          {mobileOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>

      </div>

      {/* ── Mobile menu dropdown ── */}
      {mobileOpen && (
        <div style={{
          ...s.mobileMenu,
          background: solid ? 'rgba(255,255,255,0.97)' : 'rgba(15,23,42,0.85)',
          borderTop: solid ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
        }}>
          {NAV_LINKS.map(([to, label]) => {
            const active = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);
            return (
              <Link key={to} to={to} onClick={closeMenu} style={{
                ...s.mobileLink,
                color: solid ? '#1a1a1a' : '#fff',
                fontWeight: active ? 700 : 500,
                background: active
                  ? (solid ? 'rgba(29,125,184,0.08)' : 'rgba(255,255,255,0.12)')
                  : 'transparent',
              }}>
                {label}
              </Link>
            );
          })}
          <div style={{ height: 1, background: solid ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)', margin: '6px 24px' }}/>
          {user ? (
            <>
              <Link to={user.role === 'admin' ? '/admin' : '/profile'} onClick={closeMenu} style={{
                ...s.mobileLink,
                color: solid ? '#1a1a1a' : '#fff',
              }}>
                <div style={{
                  ...s.avatar, width: 28, height: 28, fontSize: 13,
                  background: solid ? 'rgba(29,125,184,0.12)' : 'rgba(255,255,255,0.25)',
                  border: solid ? '2px solid #1D7DB8' : '2px solid rgba(255,255,255,0.6)',
                  color: solid ? '#1D7DB8' : '#fff',
                }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                {user.name}
              </Link>
              <button onClick={handleLogout} style={{
                ...s.mobileLogout,
                color: solid ? '#1D7DB8' : 'rgba(255,255,255,0.75)',
              }}>Đăng xuất</button>
            </>
          ) : (
            <Link to="/login" onClick={closeMenu} style={{
              ...s.mobileLink,
              color: solid ? '#1D7DB8' : '#fff',
              fontWeight: 600,
            }}>
              Đăng nhập / Đăng ký
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

const s = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    transition: 'background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
  },
  inner: {
    maxWidth: '1200px', margin: '0 auto',
    padding: '0 32px', height: '64px',
    display: 'flex', alignItems: 'center',
  },
  brand: { display: 'flex', alignItems: 'center', textDecoration: 'none' },
  brandName: {
    fontSize: '26px', fontWeight: 900,
    fontFamily: "'Arial Black', 'Impact', Arial, sans-serif",
    letterSpacing: '-0.5px', lineHeight: 1, textTransform: 'uppercase',
    transition: 'color 0.3s ease',
  },
  links: { display: 'flex', alignItems: 'center', gap: '2px' },
  link: {
    textDecoration: 'none',
    padding: '11px 16px 5px', fontSize: '14px',
    letterSpacing: '0.2px', whiteSpace: 'nowrap',
    borderRadius: '4px',
    transition: 'color 0.3s ease, background 0.15s',
  },
  userBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    textDecoration: 'none', padding: '5px 8px',
    borderRadius: '8px', transition: 'background .15s',
  },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    fontWeight: 700, fontSize: '15px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.3s ease',
  },
  userName: { fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', transition: 'color 0.3s ease' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '34px', height: '34px', borderRadius: '50%',
    cursor: 'pointer', flexShrink: 0,
    transition: 'all 0.3s ease',
  },
  loginBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 18px', borderRadius: '22px',
    fontSize: '14px', fontWeight: 600, textDecoration: 'none',
    transition: 'all 0.3s ease',
  },
  hamburger: {
    border: 'none', cursor: 'pointer',
    width: '40px', height: '40px', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'all 0.3s ease',
  },
  mobileMenu: {
    paddingBottom: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    transition: 'background 0.3s ease',
  },
  mobileLink: {
    display: 'flex', alignItems: 'center', gap: '10px',
    textDecoration: 'none', fontSize: '16px',
    padding: '14px 24px', transition: 'background .15s',
  },
  mobileLogout: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '15px', padding: '14px 24px',
    width: '100%', textAlign: 'left',
    transition: 'color 0.3s ease',
  },
};
