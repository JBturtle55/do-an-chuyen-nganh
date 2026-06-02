import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import {
  adminGetBookings, adminGetBuses, adminGetRoutes, adminGetUsers,
  adminCreateRoute, adminDeleteRoute, adminUpdateRoute,
  adminDeleteTrip,  adminUpdateTrip,
  adminUpdateUser, adminDeleteUser,
  adminCreateBus,   adminDeleteBus,   adminUpdateBus,
  adminConfirmBooking, adminCancelBooking, adminGetStats,
  adminGetPosts, adminCreatePost, adminUpdatePost, adminDeletePost,
  adminGetRefunds, adminGetRefundHistory, adminConfirmRefund,
  adminGetVouchers, adminCreateVoucher, adminUpdateVoucher, adminDeleteVoucher,
  getTrips,
  adminChatConversations, adminChatMessages, adminChatReply, adminChatUnread,
  adminChatComplete, adminChatReopen,
  adminExportBookings,
  adminBulkTrips,
} from '../services/api';
import { formatPrice, formatDate } from '../utils/format';
import { useToast } from '../components/Toast';

const ORANGE = '#1D7DB8';
const TABS = [
  { id:'dashboard', label:'Tổng quan',   icon:'📊' },
  { id:'bookings',  label:'Đặt vé',      icon:'🎫' },
  { id:'refunds',   label:'Hoàn tiền',   icon:'💸' },
  { id:'trips',     label:'Chuyến đi',   icon:'🚌' },
  { id:'routes',    label:'Tuyến đường', icon:'🗺️'  },
  { id:'buses',     label:'Nhà xe',       icon:'🚐' },
  { id:'vouchers',  label:'Mã giảm giá', icon:'🎟️'  },
  { id:'posts',     label:'Bài viết',    icon:'📝' },
  { id:'users',     label:'Khách hàng',  icon:'👥' },
  { id:'chat',      label:'Hỗ trợ',      icon:'💬' },
];

/* ════════════════════════════════════════
   SHARED COMPONENTS
════════════════════════════════════════ */

function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...s.modal, maxWidth: width }}>
        <div style={s.modalHeader}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title}</span>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={s.overlay}>
      <div style={{ ...s.modal, maxWidth: 360 }}>
        <div style={{ padding: '28px 24px' }}>
          <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
          <p style={{ margin: '0 0 24px', fontSize: 15, color: '#333', textAlign: 'center', lineHeight: 1.6 }}>{message}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{ ...s.outlineBtn, flex: 1 }}>Huỷ</button>
            <button onClick={onConfirm} style={{ ...s.dangerBtn, flex: 1 }}>Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}</label>
      {children}
    </div>
  );
}

function Row({ children, gap = 12 }) {
  return <div style={{ display: 'flex', gap, flexWrap: 'wrap' }}>{children}</div>;
}

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'52px 20px', gap:10, color:'#94a3b8', fontSize:13 }}>
      <div style={{ width:26, height:26, border:'3px solid #e2e8f0', borderTop:`3px solid ${ORANGE}`, borderRadius:'50%', animation:'spin 1s linear infinite', flexShrink:0 }}/>
      Đang tải...
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:   { bg: '#fef3c7', color: '#b45309', label: 'Chờ xác nhận' },
    confirmed: { bg: '#d1fae5', color: '#065f46', label: 'Đã xác nhận'  },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Đã huỷ'       },
  };
  const m = map[status] || { bg: '#f3f4f6', color: '#374151', label: status };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px',
      borderRadius: 20, fontSize: 12, fontWeight: 600, background: m.bg, color: m.color,
      whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  );
}

/* ════════════════════════════════════════
   MAIN LAYOUT
════════════════════════════════════════ */

export default function Admin() {
  const [tab, setTab]           = useState('dashboard');
  const [buses,    setBuses]    = useState([]);
  const [routes,   setRoutes]   = useState([]);
  const [chatUnread, setChatUnread] = useState(0);
  const { addToast } = useToast();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logoutUser(); navigate('/'); };

  useEffect(() => {
    adminGetBuses().then(r => setBuses(r.data)).catch(() => addToast('Không tải được xe', 'error'));
    adminGetRoutes().then(r => setRoutes(r.data)).catch(() => addToast('Không tải được tuyến', 'error'));
  }, []); // eslint-disable-line

  // Poll unread chat count
  useEffect(() => {
    const fetch = () => adminChatUnread().then(r => setChatUnread(r.data.count)).catch(() => {});
    fetch();
    const iv = setInterval(fetch, 15000);
    return () => clearInterval(iv);
  }, []);

  const pendingCount = 0; // BookingsTab tự fetch

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      {/* ── Sidebar (desktop) ── */}
      <aside style={{ ...s.sidebar, display: isMobile ? 'none' : 'flex' }}>
        {/* Brand */}
        <div style={{ padding:'22px 18px 16px', borderBottom:'1px solid #2d3a4f', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${ORANGE},#f59e0b)`,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>🚌</div>
          <div>
            <div style={{ color:'#fff', fontWeight:900, fontSize:16, letterSpacing:'.5px' }}>FASTBUS</div>
            <div style={{ color:'#475569', fontSize:10, marginTop:1, letterSpacing:'.5px', textTransform:'uppercase' }}>Admin Panel</div>
          </div>
        </div>
        <div style={s.sideTop}>
          <div style={s.sideTitle}>Menu</div>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'chat') setChatUnread(0); }}
              style={{ ...s.sideItem, ...(tab === t.id ? s.sideItemOn : {}) }}>
              <span style={{ fontSize: 15, lineHeight: 1, width:20, textAlign:'center', flexShrink:0 }}>{t.icon}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{t.label}</span>
              {t.id === 'bookings' && pendingCount > 0 && (
                <span style={s.sideBadge}>{pendingCount}</span>
              )}
              {t.id === 'chat' && chatUnread > 0 && (
                <span style={s.sideBadge}>{chatUnread > 9 ? '9+' : chatUnread}</span>
              )}
            </button>
          ))}
        </div>

        {/* User info + logout */}
        <div style={{ marginTop:'auto', padding:'14px 16px', borderTop:'1px solid #2d3a4f' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(29,125,184,0.2)',
                          border:'2px solid rgba(29,125,184,0.4)', display:'flex', alignItems:'center',
                          justifyContent:'center', color:ORANGE, fontWeight:700, fontSize:14, flexShrink:0 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ color:'#e2e8f0', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ color:'#475569', fontSize:11 }}>Quản trị viên</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width:'100%', padding:'8px', background:'rgba(220,38,38,0.1)',
            border:'1px solid rgba(220,38,38,0.25)', borderRadius:8, color:'#fca5a5',
            fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', gap:6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main style={{ ...s.main, paddingBottom: isMobile ? 72 : undefined, paddingTop: 0 }}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div>
            <div style={s.topbarTitle}>{TABS.find(t => t.id === tab)?.label || 'Quản trị'}</div>
            <div style={s.topbarSub}>
              {new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' })}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>{user?.email}</div>
            </div>
            <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(135deg,${ORANGE},#f59e0b)`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'#fff', fontWeight:800, fontSize:15, flexShrink:0 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {tab === 'dashboard' && <DashboardTab setTab={setTab}/>}
        {tab === 'bookings'  && <BookingsTab/>}
        {tab === 'refunds'   && <RefundsTab/>}
        {tab === 'trips'     && <TripsTab     routes={routes} buses={buses}/>}
        {tab === 'routes'    && <RoutesTab    routes={routes} setRoutes={setRoutes}/>}
        {tab === 'buses'     && <BusesTab     buses={buses} setBuses={setBuses}/>}
        {tab === 'vouchers'  && <VouchersTab/>}
        {tab === 'posts'     && <PostsTab/>}
        {tab === 'users'     && <UsersTab/>}
        {tab === 'chat'      && <ChatTab/>}
      </main>

      {/* ── Bottom tab bar (mobile) ── */}
      {isMobile && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#1e293b',
                      display:'flex', zIndex:200, borderTop:'1px solid #334155' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex:1, padding:'8px 0', background:'none', border:'none', cursor:'pointer',
                       display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                       color: tab===t.id ? '#1D7DB8' : '#94a3b8', fontSize:10, fontWeight:600 }}>
              <span style={{ fontSize:18 }}>{t.icon}</span>
              <span style={{ fontSize:9 }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════ */
function DashboardTab({ setTab }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminGetStats().then(r => setStats(r.data)).catch(() => {}); }, []);

  if (!stats) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, gap:12, color:'#94a3b8' }}>
      <div style={{ width:24, height:24, border:'3px solid #e2e8f0', borderTop:`3px solid ${ORANGE}`, borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      Đang tải dữ liệu...
    </div>
  );

  const maxRev = Math.max(...stats.revenueByDay.map(d => d.revenue), 1);
  const totalNonCancel = stats.confirmedBookings + stats.pendingBookings;
  const confirmRate = totalNonCancel > 0 ? Math.round((stats.confirmedBookings / totalNonCancel) * 100) : 0;
  const todayVsYesterday = stats.yesterdayRevenue > 0
    ? Math.round(((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100)
    : null;

  const kpiCards = [
    {
      label: 'Tổng doanh thu', value: formatPrice(stats.totalRevenue),
      sub: stats.todayRevenue > 0 ? `Hôm nay: ${formatPrice(stats.todayRevenue)}` : 'Chưa có hôm nay',
      trend: todayVsYesterday, icon: '💰',
      grad: 'linear-gradient(135deg,#16a34a,#22c55e)', tab: null,
    },
    {
      label: 'Tổng đặt vé', value: stats.totalBookings,
      sub: `Hôm nay: ${stats.todayBookings} vé`,
      icon: '🎫', grad: 'linear-gradient(135deg,#2563eb,#3b82f6)', tab: 'bookings',
    },
    {
      label: 'Chờ xác nhận', value: stats.pendingBookings,
      sub: `Tỉ lệ xác nhận: ${confirmRate}%`,
      icon: '⏳', grad: 'linear-gradient(135deg,#d97706,#f59e0b)', tab: 'bookings',
    },
    {
      label: 'Khách hàng', value: stats.totalUsers,
      sub: `${stats.totalTrips} chuyến · ${stats.totalBuses} xe`,
      icon: '👥', grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', tab: 'users',
    },
  ];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ ...s.pageTitle, margin:0 }}>Tổng quan</h2>
        <span style={{ fontSize:12, color:'#94a3b8' }}>
          Cập nhật: {new Date().toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })}
        </span>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {kpiCards.map(c => (
          <div key={c.label} onClick={() => c.tab && setTab(c.tab)}
            style={{ background:c.grad, borderRadius:14, padding:'18px 20px', color:'#fff',
                     cursor:c.tab?'pointer':'default', boxShadow:'0 4px 14px rgba(0,0,0,0.12)',
                     position:'relative', overflow:'hidden' }}>
            {/* bg circle decoration */}
            <div style={{ position:'absolute', right:-14, top:-14, width:72, height:72,
                          background:'rgba(255,255,255,0.12)', borderRadius:'50%' }}/>
            <div style={{ position:'absolute', right:12, top:12, fontSize:26, opacity:.85 }}>{c.icon}</div>
            <div style={{ fontSize:28, fontWeight:900, lineHeight:1, marginBottom:6 }}>{c.value}</div>
            <div style={{ fontSize:13, opacity:.9, fontWeight:600 }}>{c.label}</div>
            <div style={{ fontSize:11, opacity:.75, marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
              {c.sub}
              {c.trend != null && (
                <span style={{ background:'rgba(255,255,255,0.2)', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>
                  {c.trend >= 0 ? '▲' : '▼'} {Math.abs(c.trend)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Chart + Status breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>

        {/* Revenue chart */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={s.cardHeader}>Doanh thu 14 ngày gần nhất</div>
            <div style={{ fontSize:13, fontWeight:700, color:ORANGE }}>
              {formatPrice(stats.revenueByDay.reduce((s,d)=>s+d.revenue,0))}
            </div>
          </div>
          {/* Y-axis gridlines */}
          <div style={{ position:'relative', height:160 }}>
            {[0,25,50,75,100].map(p => (
              <div key={p} style={{ position:'absolute', left:0, right:0, bottom:`${p}%`,
                borderTop:`1px dashed ${p===0?'#cbd5e1':'#f1f5f9'}`, zIndex:0 }}>
                {p > 0 && (
                  <span style={{ position:'absolute', left:0, top:-9, fontSize:9, color:'#cbd5e1' }}>
                    {Math.round(maxRev * p / 100 / 1000)}k
                  </span>
                )}
              </div>
            ))}
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'flex-end', gap:4, paddingLeft:24 }}>
              {stats.revenueByDay.map((d, i) => {
                const isToday = i === stats.revenueByDay.length - 1;
                const hPct = maxRev > 0 ? Math.max((d.revenue/maxRev)*100, d.revenue>0?4:1) : 1;
                const dt = new Date(d.date);
                const label = dt.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'});
                return (
                  <div key={d.date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, height:'100%', justifyContent:'flex-end', cursor:'default' }}
                    title={`${label}: ${formatPrice(d.revenue)} (${d.count} vé)`}>
                    {d.revenue > 0 && (
                      <div style={{ fontSize:9, color: isToday?ORANGE:'#94a3b8', fontWeight:700, whiteSpace:'nowrap' }}>
                        {(d.revenue/1000).toFixed(0)}k
                      </div>
                    )}
                    <div style={{ width:'100%', height:`${hPct}%`, minHeight:3,
                      background: isToday
                        ? `linear-gradient(180deg,${ORANGE},#0f5f8c)`
                        : d.revenue>0 ? 'linear-gradient(180deg,#93c5fd,#3b82f6)' : '#e2e8f0',
                      borderRadius:'4px 4px 0 0',
                      boxShadow: isToday?`0 2px 8px ${ORANGE}66`:undefined }}/>
                    <div style={{ fontSize:9, color: isToday?ORANGE:'#94a3b8', whiteSpace:'nowrap', fontWeight: isToday?700:400 }}>
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display:'flex', gap:16, marginTop:12, fontSize:11, color:'#94a3b8' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:ORANGE, display:'inline-block' }}/> Hôm nay</span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:'#3b82f6', display:'inline-block' }}/> Các ngày trước</span>
          </div>
        </div>

        {/* Booking status breakdown */}
        <div style={s.card}>
          <div style={s.cardHeader}>Trạng thái đặt vé</div>
          <div style={{ marginTop:16 }}>
            {[
              { label:'Đã xác nhận', val:stats.confirmedBookings, color:'#16a34a', bg:'#dcfce7' },
              { label:'Chờ thanh toán', val:stats.pendingBookings, color:'#d97706', bg:'#fef3c7' },
              { label:'Đã huỷ', val:stats.cancelledBookings, color:'#dc2626', bg:'#fee2e2' },
            ].map(item => {
              const pct = stats.totalBookings > 0 ? Math.round((item.val/stats.totalBookings)*100) : 0;
              return (
                <div key={item.label} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                    <span style={{ fontWeight:600, color:'#374151' }}>{item.label}</span>
                    <span style={{ fontWeight:700, color:item.color }}>{item.val} <span style={{ color:'#94a3b8', fontWeight:400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height:8, background:'#f1f5f9', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:item.color, borderRadius:4,
                                  transition:'width .6s ease', minWidth: item.val>0?8:0 }}/>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Quick numbers */}
          <div style={{ marginTop:20, padding:'12px', background:'#f8fafc', borderRadius:8 }}>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>Hôm nay</div>
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:900, color:ORANGE }}>{stats.todayBookings}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>vé đặt</div>
              </div>
              <div style={{ width:1, background:'#e2e8f0' }}/>
              <div style={{ flex:1, textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:900, color:'#16a34a' }}>{formatPrice(stats.todayRevenue)}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>doanh thu</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top routes + Recent bookings */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Top routes */}
        <div style={s.card}>
          <div style={s.cardHeader}>🗺️ Tuyến đường phổ biến nhất</div>
          {stats.topRoutes?.length === 0
            ? <p style={{ color:'#aaa', fontSize:13, marginTop:12 }}>Chưa có dữ liệu</p>
            : stats.topRoutes?.map((r, i) => {
              const maxCount = stats.topRoutes[0].count;
              const pct = Math.round((r.count / maxCount) * 100);
              return (
                <div key={r._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                                          borderBottom: i < stats.topRoutes.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background: i===0?ORANGE:i===1?'#f59e0b':'#94a3b8',
                                display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff', flexShrink:0 }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {r.from} → {r.to}
                    </div>
                    <div style={{ height:5, background:'#f1f5f9', borderRadius:3, marginTop:4, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: i===0?ORANGE:'#3b82f6', borderRadius:3 }}/>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>{r.count}</div>
                    <div style={{ fontSize:10, color:'#94a3b8' }}>vé</div>
                  </div>
                </div>
              );
            })
          }
        </div>

        {/* Recent bookings */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={s.cardHeader}>🎫 Đặt vé gần đây</div>
            <button onClick={() => setTab('bookings')}
              style={{ fontSize:12, color:ORANGE, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              Xem tất cả →
            </button>
          </div>
          {(!stats.recentBookingsList || stats.recentBookingsList.length === 0)
            ? <p style={{ color:'#aaa', fontSize:13 }}>Chưa có đặt vé nào</p>
            : stats.recentBookingsList.map(b => (
              <div key={b._id} style={{ padding:'8px 0', borderBottom:'1px solid #f1f5f9', display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'#f0f4f8',
                              display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                  🧍
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#1e293b' }}>
                    {b.trip?.route?.from} → {b.trip?.route?.to}
                  </div>
                  <div style={{ fontSize:11, color:'#94a3b8', display:'flex', gap:6, alignItems:'center' }}>
                    <span>{b.passengerName}</span>
                    <span>·</span>
                    <span>{formatPrice(b.totalPrice)}</span>
                    <span>·</span>
                    <span>{formatDate(b.createdAt)}</span>
                  </div>
                </div>
                <StatusBadge status={b.status}/>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   BOOKINGS
════════════════════════════════════════ */
function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:20 }}>
      <button onClick={() => onPage(page-1)} disabled={page===1}
        style={{ ...s.outlineBtn, padding:'5px 12px', opacity:page===1?0.4:1 }}>‹</button>
      {Array.from({length:pages},(_,i)=>i+1).map(p => (
        <button key={p} onClick={() => onPage(p)}
          style={{ padding:'5px 12px', borderRadius:6, border:'1.5px solid', fontSize:13, fontWeight:600, cursor:'pointer',
                   borderColor: p===page?ORANGE:'#e2e8f0', background:p===page?ORANGE:'#fff', color:p===page?'#fff':'#64748b' }}>
          {p}
        </button>
      ))}
      <button onClick={() => onPage(page+1)} disabled={page===pages}
        style={{ ...s.outlineBtn, padding:'5px 12px', opacity:page===pages?0.4:1 }}>›</button>
    </div>
  );
}

function BookingsTab() {
  const { addToast } = useToast();
  const [bookings, setBookings]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [page,  setPage]                = useState(1);
  const [pages, setPages]               = useState(1);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [exporting, setExporting]       = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await adminExportBookings({ status: filter === 'all' ? undefined : filter });
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `fastbus-bookings-${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch { addToast('Xuất dữ liệu thất bại', 'error'); }
    finally  { setExporting(false); }
  };

  const load = useCallback((p = page, f = filter, q = search) => {
    setLoading(true);
    adminGetBookings({ page:p, limit:20, status:f, search:q })
      .then(r => { setBookings(r.data.bookings); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => addToast('Lỗi tải dữ liệu', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => { load(1, filter, search); setPage(1); }, [filter, search]); // eslint-disable-line

  const goPage = (p) => { setPage(p); load(p, filter, search); };

  const handleConfirm = async id => {
    try {
      await adminConfirmBooking(id);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'confirmed' } : b));
      addToast('Đã xác nhận vé', 'success');
    } catch { addToast('Lỗi xác nhận', 'error'); }
  };

  const handleCancel = id => setConfirmModal({
    message: 'Huỷ vé này sẽ hoàn trả ghế về chuyến. Tiếp tục?',
    onConfirm: async () => {
      setConfirmModal(null);
      try {
        await adminCancelBooking(id);
        load(page, filter, search);
        addToast('Đã huỷ vé', 'info');
      } catch { addToast('Lỗi huỷ vé', 'error'); }
    },
  });

  return (
    <div>
      {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)}/>}
      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Quản lý đặt vé</h2>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, color:'#94a3b8' }}>Tổng: {total} vé</span>
          <button onClick={handleExport} disabled={exporting} style={{ ...s.primaryBtn, fontSize:13, padding:'6px 14px' }}>
            {exporting ? 'Đang xuất...' : '⬇️ Xuất CSV'}
          </button>
        </div>
      </div>

      <div style={s.filterBar}>
        {[
          { id:'all', label:'Tất cả' },
          { id:'pending',   label:'Chờ xác nhận', color:'#d97706' },
          { id:'confirmed', label:'Đã xác nhận',  color:'#16a34a' },
          { id:'cancelled', label:'Đã huỷ',       color:'#dc2626' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer', border:'1.5px solid',
            borderColor: filter===f.id ? (f.color||ORANGE) : '#e2e8f0',
            background:  filter===f.id ? (f.color||ORANGE) : '#fff',
            color:       filter===f.id ? '#fff' : '#64748b',
          }}>{f.label}</button>
        ))}
        <form style={{ marginLeft:'auto', display:'flex', gap:6 }}
          onSubmit={e => { e.preventDefault(); setSearch(searchInput); }}>
          <input placeholder="🔍  Tìm tên, SĐT..." value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ ...s.input, width:210 }}/>
          <button type="submit" style={s.primaryBtn}>Tìm</button>
        </form>
      </div>

      {loading
        ? <Spinner/>
        : bookings.length === 0
          ? <div style={s.emptyState}>Không tìm thấy kết quả nào</div>
          : bookings.map(b => (
            <div key={b._id} style={{ ...s.listRow }}>
              <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ textAlign:'center', minWidth:60 }}>
                  <div style={{ fontSize:11, color:'#94a3b8', marginBottom:4 }}>Khởi hành</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>
                    {new Date(b.trip?.departureTime).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
                  </div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>
                    {new Date(b.trip?.departureTime).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}
                  </div>
                </div>
                <div style={{ width:1, background:'#e2e8f0', alignSelf:'stretch', margin:'2px 0' }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <span style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>
                      {b.trip?.route?.from} → {b.trip?.route?.to}
                    </span>
                    <StatusBadge status={b.status}/>
                    {b.refundStatus === 'pending' && (
                      <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600, background:'#fef3c7', color:'#b45309' }}>
                        Chờ hoàn tiền
                      </span>
                    )}
                    {b.refundStatus === 'completed' && (
                      <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600, background:'#dcfce7', color:'#15803d' }}>
                        Đã hoàn tiền
                      </span>
                    )}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 20px', fontSize:13, color:'#475569' }}>
                    <span>Tài khoản: <strong>{b.user?.name}</strong></span>
                    <span>Hành khách: <strong>{b.passengerName}</strong></span>
                    <span>SĐT: {b.passengerPhone}</span>
                    <span>Ghế: <strong>{b.seats?.join(', ')}</strong></span>
                    <span>Đặt lúc: {formatDate(b.createdAt)}</span>
                    <span>Tổng tiền: <strong style={{ color:ORANGE }}>{formatPrice(b.totalPrice)}</strong></span>
                  </div>
                </div>
                {(b.status === 'pending' || b.status === 'confirmed') && (
                  <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                    {b.status === 'pending' && (
                      <button onClick={() => handleConfirm(b._id)} style={s.confirmBtn}>✓ Xác nhận</button>
                    )}
                    <button onClick={() => handleCancel(b._id)} style={s.cancelBkBtn}>✕ Huỷ vé</button>
                  </div>
                )}
              </div>
            </div>
          ))
      }
      <Pagination page={page} pages={pages} onPage={goPage}/>
    </div>
  );
}

/* ════════════════════════════════════════
   REFUNDS
════════════════════════════════════════ */
function RefundsTab() {
  const { addToast } = useToast();
  const [view,    setView]    = useState('pending');   // 'pending' | 'history'
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);

  const loadPending = useCallback(() => {
    setLoading(true);
    adminGetRefunds().then(r => setPending(r.data)).catch(() => addToast('Lỗi tải dữ liệu','error')).finally(() => setLoading(false));
  }, [addToast]);

  const loadHistory = useCallback(() => {
    setLoading(true);
    adminGetRefundHistory().then(r => setHistory(r.data)).catch(() => addToast('Lỗi tải lịch sử','error')).finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => {
    if (view === 'pending') loadPending();
    else loadHistory();
  }, [view, loadPending, loadHistory]);

  const handleConfirm = id => setConfirmModal({
    message: 'Xác nhận đã hoàn tiền cho khách hàng này?',
    onConfirm: async () => {
      setConfirmModal(null);
      try {
        await adminConfirmRefund(id);
        addToast('Đã xác nhận hoàn tiền', 'success');
        loadPending();
      } catch { addToast('Lỗi cập nhật', 'error'); }
    },
  });

  const list = view === 'pending' ? pending : history;

  return (
    <div>
      {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)}/>}

      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Hoàn tiền</h2>
        <div style={{ display:'flex', gap:8 }}>
          {[['pending','⏳ Chờ xử lý'],['history','📋 Lịch sử']].map(([k,l]) => (
            <button key={k} onClick={() => setView(k)} style={{
              padding:'7px 18px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer',
              background: view===k ? ORANGE : '#fff',
              color:      view===k ? '#fff'  : '#64748b',
              border:     `1.5px solid ${view===k ? ORANGE : '#e2e8f0'}`,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      {view === 'pending' && pending.length > 0 && (
        <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:10,
                      padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <span style={{ fontSize:13, color:'#92400e', fontWeight:600 }}>
            Có {pending.length} yêu cầu hoàn tiền đang chờ xử lý · Tổng:{' '}
            <strong>{formatPrice(pending.reduce((s,b) => s + b.totalPrice, 0))}</strong>
          </span>
        </div>
      )}

      {loading ? <Spinner/> : list.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize:40, marginBottom:10 }}>{view==='pending' ? '✅' : '📭'}</div>
          <div>{view==='pending' ? 'Không có yêu cầu hoàn tiền nào' : 'Chưa có lịch sử hoàn tiền'}</div>
        </div>
      ) : list.map(b => (
        <div key={b._id} style={s.listRow}>
          <div style={{ display:'flex', gap:16, alignItems:'center' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                <span style={{ fontSize:15, fontWeight:700, color:'#0f172a' }}>
                  {b.trip?.route?.from} → {b.trip?.route?.to}
                </span>
                {view === 'pending' ? (
                  <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                                  background:'#fef3c7', color:'#b45309', whiteSpace:'nowrap' }}>
                    Chờ hoàn tiền
                  </span>
                ) : (
                  <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                                  background:'#dcfce7', color:'#15803d', whiteSpace:'nowrap' }}>
                    Đã hoàn tiền
                  </span>
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',
                            gap:'4px 20px', fontSize:13, color:'#475569' }}>
                <span>Khách hàng: <strong style={{ color:'#1e293b' }}>{b.passengerName}</strong></span>
                <span>SĐT: <strong style={{ color:'#1e293b' }}>{b.passengerPhone}</strong></span>
                <span>Email: {b.user?.email || '—'}</span>
                <span>Số tiền hoàn: <strong style={{ color:'#dc2626', fontSize:14 }}>{formatPrice(b.totalPrice)}</strong></span>
                <span>Ghế: {b.seats?.join(', ')}</span>
                <span>{view==='pending' ? 'Huỷ lúc' : 'Hoàn lúc'}: {formatDate(b.updatedAt)}</span>
              </div>
            </div>
            {view === 'pending' && (
              <button onClick={() => handleConfirm(b._id)}
                style={{ padding:'9px 18px', background:'#16a34a', color:'#fff', border:'none',
                         borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0 }}>
                ✓ Đã hoàn tiền
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   TRIPS
════════════════════════════════════════ */
function todayStr() { return new Date().toISOString().slice(0, 10); }


const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function countTripDays(startDate, endDate, daysOfWeek) {
  if (!startDate || !endDate) return 0;
  let count = 0;
  const end = new Date(endDate);
  for (let d = new Date(startDate); d <= end; d.setDate(d.getDate() + 1)) {
    if (daysOfWeek.includes(d.getDay())) count++;
  }
  return count;
}

function TripFormModal({ trip, routes, buses, onClose, onSave }) {
  const { addToast } = useToast();
  const isEdit = !!trip;

  // Edit state (single trip)
  const [editForm, setEditForm] = useState(() => {
    if (!trip) return {};
    const dt = new Date(trip.departureTime);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
    const saleEndsLocal = trip.saleEndsAt
      ? new Date(new Date(trip.saleEndsAt).getTime() - new Date(trip.saleEndsAt).getTimezoneOffset()*60000).toISOString().slice(0,16)
      : '';
    return {
      route: trip.route?._id||trip.route, bus: trip.bus?._id||trip.bus,
      departureTime: local, price: trip.price,
      salePercent: trip.salePercent || '', saleEndsAt: saleEndsLocal,
    };
  });

  // Create state (multi-day)
  const [createForm, setCreateForm] = useState({
    route: '', bus: '', startDate: todayStr(), endDate: todayStr(),
    time: '08:00', price: '', daysOfWeek: [0,1,2,3,4,5,6],
  });

  const [loading, setLoading] = useState(false);
  const setC = (k, v) => setCreateForm(f => ({ ...f, [k]: v }));
  const toggleDay = d => setC('daysOfWeek',
    createForm.daysOfWeek.includes(d)
      ? createForm.daysOfWeek.filter(x => x !== d)
      : [...createForm.daysOfWeek, d].sort((a,b)=>a-b)
  );

  const multiDay = createForm.startDate !== createForm.endDate;
  const tripCount = countTripDays(createForm.startDate, createForm.endDate, createForm.daysOfWeek);

  const submitEdit = async e => {
    e.preventDefault();
    const selBus   = buses.find(b => b._id === editForm.bus);
    const selRoute = routes.find(r => r._id === editForm.route);
    const payload  = {
      ...editForm,
      price: editForm.price || selRoute?.basePrice,
      availableSeats: selBus?.seatCount || 30,
      salePercent: editForm.salePercent ? Number(editForm.salePercent) : 0,
      saleEndsAt:  editForm.saleEndsAt || null,
    };
    setLoading(true);
    try {
      const res = await adminUpdateTrip(trip._id, payload);
      addToast('Đã cập nhật chuyến', 'success');
      onSave(res.data, 'update');
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Lỗi lưu chuyến', 'error');
    } finally { setLoading(false); }
  };

  const submitCreate = async e => {
    e.preventDefault();
    if (!createForm.route || !createForm.bus || !createForm.time || !createForm.price) {
      return addToast('Vui lòng điền đầy đủ thông tin', 'error');
    }
    if (createForm.daysOfWeek.length === 0) {
      return addToast('Chọn ít nhất 1 ngày trong tuần', 'error');
    }
    setLoading(true);
    try {
      const selBus = buses.find(b => b._id === createForm.bus);
      const res = await adminBulkTrips({
        routeId: createForm.route,
        busId:   createForm.bus,
        times:   [createForm.time],
        startDate:   createForm.startDate,
        endDate:     createForm.endDate,
        daysOfWeek:  createForm.daysOfWeek,
        price:       Number(createForm.price),
        availableSeats: selBus?.seatCount,
      });
      addToast(res.data.message, 'success');
      onSave(null, 'create');
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Lỗi tạo chuyến', 'error');
    } finally { setLoading(false); }
  };

  if (isEdit) return (
    <Modal title="Sửa chuyến đi" onClose={onClose}>
      <form onSubmit={submitEdit}>
        <Field label="Tuyến đường" required>
          <select required value={editForm.route} onChange={e=>setEditForm({...editForm,route:e.target.value})} style={s.input}>
            <option value="">-- Chọn tuyến --</option>
            {routes.map(r=><option key={r._id} value={r._id}>{r.from} → {r.to}</option>)}
          </select>
        </Field>
        <Field label="Xe" required>
          <select required value={editForm.bus} onChange={e=>setEditForm({...editForm,bus:e.target.value})} style={s.input}>
            <option value="">-- Chọn xe --</option>
            {buses.map(b=><option key={b._id} value={b._id}>{b.name} ({b.plate}) — {b.seatCount} ghế</option>)}
          </select>
        </Field>
        <Field label="Ngày & giờ khởi hành" required>
          <input type="datetime-local" required value={editForm.departureTime}
            onChange={e=>setEditForm({...editForm,departureTime:e.target.value})} style={s.input}/>
        </Field>
        <Field label="Giá vé (VND)">
          <input type="number" min="0" placeholder="VD: 250000" value={editForm.price}
            onChange={e=>setEditForm({...editForm,price:e.target.value})} style={s.input}/>
        </Field>
        <div style={{ background:'#fff8f0', border:'1px solid #fed7aa', borderRadius:8, padding:'12px 14px', marginBottom:4 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#c2410c', marginBottom:10 }}>🔥 Flash Sale</div>
          <Row>
            <div style={{ flex:1 }}>
              <Field label="Giảm giá (%)">
                <input type="number" min="0" max="100" placeholder="VD: 20" value={editForm.salePercent}
                  onChange={e=>setEditForm({...editForm,salePercent:e.target.value})} style={s.input}/>
              </Field>
            </div>
            <div style={{ flex:1 }}>
              <Field label="Kết thúc flash sale">
                <input type="datetime-local" value={editForm.saleEndsAt}
                  onChange={e=>setEditForm({...editForm,saleEndsAt:e.target.value})} style={s.input}/>
              </Field>
            </div>
          </Row>
          {editForm.salePercent > 0 && editForm.price && (
            <div style={{ fontSize:12, color:'#b45309', marginTop:-8 }}>
              Giá sau giảm: <strong>{Math.round(Number(editForm.price)*(1-Number(editForm.salePercent)/100)).toLocaleString('vi-VN')}đ</strong>
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          <button type="button" onClick={onClose} style={{ ...s.outlineBtn, flex:1 }}>Huỷ</button>
          <button type="submit" disabled={loading} style={{ ...s.primaryBtn, flex:2, opacity:loading?0.6:1 }}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );

  return (
    <Modal title="Thêm chuyến đi" onClose={onClose}>
      <form onSubmit={submitCreate}>
        <Row>
          <Field label="Tuyến đường *">
            <select required value={createForm.route} onChange={e=>setC('route',e.target.value)} style={s.input}>
              <option value="">-- Chọn tuyến --</option>
              {routes.map(r=><option key={r._id} value={r._id}>{r.from} → {r.to}</option>)}
            </select>
          </Field>
          <Field label="Nhà xe *">
            <select required value={createForm.bus} onChange={e=>setC('bus',e.target.value)} style={s.input}>
              <option value="">-- Chọn nhà xe --</option>
              {buses.map(b=><option key={b._id} value={b._id}>{b.name} ({b.seatCount} ghế)</option>)}
            </select>
          </Field>
        </Row>

        <Row>
          <Field label="Từ ngày *">
            <input type="date" required value={createForm.startDate}
              onChange={e=>setC('startDate', e.target.value)} style={s.input}/>
          </Field>
          <Field label="Đến ngày *">
            <input type="date" required value={createForm.endDate}
              min={createForm.startDate}
              onChange={e=>setC('endDate', e.target.value)} style={s.input}/>
          </Field>
          <Field label="Giờ khởi hành *">
            <input type="time" required value={createForm.time}
              onChange={e=>setC('time', e.target.value)} style={s.input}/>
          </Field>
        </Row>

        {multiDay && (
          <Field label="Các ngày trong tuần">
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
              {DAY_LABELS.map((label, idx) => (
                <button key={idx} type="button" onClick={() => toggleDay(idx)}
                  style={{
                    padding:'5px 11px', borderRadius:20, fontSize:13, fontWeight:700,
                    cursor:'pointer', border:'1.5px solid',
                    background:  createForm.daysOfWeek.includes(idx) ? ORANGE    : '#f8fafc',
                    color:       createForm.daysOfWeek.includes(idx) ? '#fff'    : '#64748b',
                    borderColor: createForm.daysOfWeek.includes(idx) ? ORANGE    : '#e2e8f0',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Giá vé (VND) *">
          <input type="number" required min="0" placeholder="VD: 250000" value={createForm.price}
            onChange={e=>setC('price', e.target.value)} style={s.input}/>
        </Field>

        {createForm.startDate && createForm.endDate && createForm.price && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8,
                        padding:'10px 14px', fontSize:13, color:'#15803d', fontWeight:600 }}>
            Sẽ tạo <strong>{tripCount}</strong> chuyến xe
          </div>
        )}

        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          <button type="button" onClick={onClose} style={{ ...s.outlineBtn, flex:1 }}>Huỷ</button>
          <button type="submit" disabled={loading || tripCount === 0} style={{ ...s.primaryBtn, flex:2, opacity:(loading||tripCount===0)?0.6:1 }}>
            {loading ? 'Đang tạo...' : `Tạo ${tripCount} chuyến`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TripsTab({ routes, buses }) {
  const { addToast } = useToast();
  const [trips, setTrips]               = useState([]);
  const [filterDate, setFilterDate]     = useState(todayStr());
  const [filterRoute, setFilterRoute]   = useState('');
  const [editTrip, setEditTrip]         = useState(undefined); // undefined=closed, null=new, obj=edit
  const [confirmModal, setConfirmModal] = useState(null);

  const load = useCallback((date, routeId) => {
    const params = {};
    if (date) params.date = date;
    getTrips(params).then(r => {
      let res = r.data;
      if (routeId) res = res.filter(t => (t.route?._id||t.route) === routeId);
      setTrips(res);
    }).catch(() => {});
  }, []);

  useEffect(() => { load(filterDate, filterRoute); }, [filterDate, filterRoute, load]);

  const handleSave = (data, mode) => {
    if (mode === 'update') setTrips(prev => prev.map(t => t._id === data._id ? data : t));
    else load(filterDate, filterRoute);
  };

  const handleDelete = id => setConfirmModal({
    message: 'Xoá chuyến này? Thao tác không thể hoàn tác.',
    onConfirm: async () => {
      setConfirmModal(null);
      try { await adminDeleteTrip(id); setTrips(prev => prev.filter(t => t._id !== id)); addToast('Đã xoá chuyến','info'); }
      catch { addToast('Lỗi xoá chuyến','error'); }
    },
  });

  return (
    <div>
      {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)}/>}
      {editTrip !== undefined && (
        <TripFormModal trip={editTrip} routes={routes} buses={buses}
          onClose={() => setEditTrip(undefined)} onSave={handleSave}/>
      )}

      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Quản lý chuyến đi</h2>
        <button onClick={() => setEditTrip(null)} style={s.primaryBtn}>+ Thêm chuyến</button>
      </div>

      {/* Filter bar */}
      <div style={s.filterBar}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:13, color:'#64748b', whiteSpace:'nowrap' }}>Ngày:</span>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ ...s.input, width:150 }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:180 }}>
          <span style={{ fontSize:13, color:'#64748b', whiteSpace:'nowrap' }}>Tuyến:</span>
          <select value={filterRoute} onChange={e => setFilterRoute(e.target.value)} style={{ ...s.input, flex:1 }}>
            <option value="">Tất cả</option>
            {routes.map(r=><option key={r._id} value={r._id}>{r.from} → {r.to}</option>)}
          </select>
        </div>
        <button onClick={() => { setFilterDate(''); setFilterRoute(''); }} style={s.ghostBtn}>Xoá lọc</button>
        <span style={{ marginLeft:'auto', fontSize:13, color:'#94a3b8' }}>{trips.length} chuyến</span>
      </div>

      {trips.length === 0 && (
        <div style={s.emptyState}>
          {filterDate ? `Không có chuyến nào ngày ${filterDate}` : 'Chọn ngày để xem chuyến đi'}
        </div>
      )}

      {trips.map(t => {
        const dep = new Date(t.departureTime);
        const depTime = dep.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
        const depDate = dep.toLocaleDateString('vi-VN', { weekday:'short', day:'2-digit', month:'2-digit' });
        const occupancy = t.bus?.seatCount ? Math.round((1 - t.availableSeats/t.bus.seatCount)*100) : null;
        return (
          <div key={t._id} style={{ ...s.listRow }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              {/* Time */}
              <div style={{ textAlign:'center', minWidth:56 }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{depTime}</div>
                <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{depDate}</div>
              </div>

              {/* Route */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'#1e293b', marginBottom:2 }}>
                  {t.route?.from} → {t.route?.to}
                </div>
                <div style={{ fontSize:12, color:'#64748b' }}>
                  {t.bus?.name} · {t.bus?.type} · {formatPrice(t.price)}
                </div>
              </div>

              {/* Seats */}
              <div style={{ textAlign:'center', minWidth:80 }}>
                <div style={{ fontSize:14, fontWeight:700,
                  color: t.availableSeats > 10 ? '#16a34a' : t.availableSeats > 0 ? '#d97706' : '#dc2626' }}>
                  {t.availableSeats}/{t.bus?.seatCount || '?'}
                </div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>ghế trống</div>
                {occupancy !== null && (
                  <div style={{ marginTop:4, height:4, background:'#e2e8f0', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${occupancy}%`, background: occupancy>80?'#dc2626':occupancy>50?'#d97706':ORANGE, transition:'width .3s' }}/>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => setEditTrip(t)} style={s.editBtn}>✏️ Sửa</button>
                <button onClick={() => handleDelete(t._id)} style={s.deleteBtn}>🗑</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════
   ROUTES
════════════════════════════════════════ */
function RouteFormModal({ route, onClose, onSave }) {
  const { addToast } = useToast();
  const isEdit = !!route;
  const [form, setForm] = useState(route
    ? { from:route.from, to:route.to, basePrice:route.basePrice, distance:route.distance||'', duration:route.duration||'' }
    : { from:'', to:'', basePrice:'', distance:'', duration:'' }
  );
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        const res = await adminUpdateRoute(route._id, form);
        addToast('Đã cập nhật tuyến','success');
        onSave(res.data, 'update');
      } else {
        const res = await adminCreateRoute(form);
        addToast('Đã thêm tuyến mới','success');
        onSave(res.data, 'create');
      }
      onClose();
    } catch (err) { addToast(err.response?.data?.message||'Lỗi lưu tuyến','error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={isEdit ? 'Sửa tuyến đường' : 'Thêm tuyến đường'} onClose={onClose}>
      <form onSubmit={submit}>
        <Row>
          <div style={{ flex:1 }}>
            <Field label="Điểm đi" required>
              <input required placeholder="VD: Hà Nội" value={form.from}
                onChange={e=>setForm({...form,from:e.target.value})} style={s.input}/>
            </Field>
          </div>
          <div style={{ flex:1 }}>
            <Field label="Điểm đến" required>
              <input required placeholder="VD: Đà Nẵng" value={form.to}
                onChange={e=>setForm({...form,to:e.target.value})} style={s.input}/>
            </Field>
          </div>
        </Row>
        <Field label="Giá vé cơ bản (VND)" required>
          <input required type="number" min="0" placeholder="VD: 250000" value={form.basePrice}
            onChange={e=>setForm({...form,basePrice:e.target.value})} style={s.input}/>
        </Field>
        <Row>
          <div style={{ flex:1 }}>
            <Field label="Khoảng cách (km)">
              <input type="number" min="0" placeholder="VD: 760" value={form.distance}
                onChange={e=>setForm({...form,distance:e.target.value})} style={s.input}/>
            </Field>
          </div>
          <div style={{ flex:1 }}>
            <Field label="Thời gian di chuyển (phút)">
              <input type="number" min="0" placeholder="VD: 900" value={form.duration}
                onChange={e=>setForm({...form,duration:e.target.value})} style={s.input}/>
            </Field>
          </div>
        </Row>
        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          <button type="button" onClick={onClose} style={{ ...s.outlineBtn, flex:1 }}>Huỷ</button>
          <button type="submit" disabled={loading} style={{ ...s.primaryBtn, flex:2, opacity:loading?0.6:1 }}>
            {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm tuyến'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RoutesTab({ routes, setRoutes }) {
  const { addToast } = useToast();
  const [editRoute, setEditRoute]       = useState(undefined);
  const [confirmModal, setConfirmModal] = useState(null);
  const [search, setSearch]             = useState('');

  const handleSave = (data, mode) => {
    if (mode === 'update') setRoutes(prev => prev.map(r => r._id === data._id ? data : r));
    else setRoutes(prev => [...prev, data]);
  };

  const handleDelete = id => setConfirmModal({
    message: 'Xoá tuyến này? Các chuyến đi trên tuyến cũng sẽ bị ảnh hưởng.',
    onConfirm: async () => {
      setConfirmModal(null);
      try { await adminDeleteRoute(id); setRoutes(prev => prev.filter(r => r._id !== id)); addToast('Đã xoá tuyến','info'); }
      catch { addToast('Lỗi xoá tuyến','error'); }
    },
  });

  const fmtDur = m => { if(!m) return '—'; const h=Math.floor(m/60),r=m%60; return h&&r?`${h}h${r}p`:h?`${h}h`:`${r}p`; };

  const filtered = routes.filter(r =>
    !search || `${r.from}${r.to}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)}/>}
      {editRoute !== undefined && (
        <RouteFormModal route={editRoute} onClose={() => setEditRoute(undefined)} onSave={handleSave}/>
      )}

      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Quản lý tuyến đường</h2>
        <button onClick={() => setEditRoute(null)} style={s.primaryBtn}>+ Thêm tuyến</button>
      </div>

      <input placeholder="🔍  Tìm tuyến..." value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...s.input, maxWidth:280, marginBottom:16 }}/>

      {filtered.length === 0 && <div style={s.emptyState}>Không tìm thấy tuyến nào</div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:10 }}>
        {filtered.map(r => (
          <div key={r._id} style={s.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:16, fontWeight:700, color:'#0f172a', marginBottom:8 }}>
                  {r.from} → {r.to}
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={s.infoBadge}>{formatPrice(r.basePrice)}</span>
                  {r.distance && <span style={s.infoBadge}>📍 {r.distance} km</span>}
                  {r.duration && <span style={s.infoBadge}>⏱ {fmtDur(r.duration)}</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                <button onClick={() => setEditRoute(r)} style={s.editBtn}>✏️</button>
                <button onClick={() => handleDelete(r._id)} style={s.deleteBtn}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   BUSES
════════════════════════════════════════ */
const BUS_AMENITIES = ['Máy điều hòa', 'Wifi', 'USB sạc', 'Nước uống', 'TV', 'Toilet'];

function BusFormModal({ bus, onClose, onSave }) {
  const { addToast } = useToast();
  const isEdit = !!bus;
  const [form, setForm] = useState(bus
    ? { name:bus.name, plate:bus.plate, seatCount:bus.seatCount, type:bus.type, image:bus.image||'', seatLayout:bus.seatLayout||'', amenities:bus.amenities||[] }
    : { name:'', plate:'', seatCount:'', type:'ghế', image:'', seatLayout:'', amenities:[] }
  );
  const [loading, setLoading] = useState(false);

  const toggleAmenity = (item) => setForm(f => ({
    ...f,
    amenities: f.amenities.includes(item) ? f.amenities.filter(x=>x!==item) : [...f.amenities, item]
  }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        const res = await adminUpdateBus(bus._id, form);
        addToast('Đã cập nhật xe','success');
        onSave(res.data, 'update');
      } else {
        const res = await adminCreateBus(form);
        addToast('Đã thêm xe','success');
        onSave(res.data, 'create');
      }
      onClose();
    } catch (err) { addToast(err.response?.data?.message||'Lỗi lưu xe','error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={isEdit ? 'Sửa thông tin xe' : 'Thêm xe mới'} onClose={onClose}>
      <form onSubmit={submit}>
        <Row>
          <div style={{ flex:2 }}>
            <Field label="Tên xe" required>
              <input required placeholder="VD: FASTBUS 01" value={form.name}
                onChange={e=>setForm({...form,name:e.target.value})} style={s.input}/>
            </Field>
          </div>
          <div style={{ flex:1 }}>
            <Field label="Biển số" required>
              <input required placeholder="51B-123.45" value={form.plate}
                onChange={e=>setForm({...form,plate:e.target.value})} style={s.input}/>
            </Field>
          </div>
        </Row>
        <Row>
          <div style={{ flex:1 }}>
            <Field label="Số ghế" required>
              <input required type="number" min="1" max="100" placeholder="40" value={form.seatCount}
                onChange={e=>setForm({...form,seatCount:e.target.value})} style={s.input}/>
            </Field>
          </div>
          <div style={{ flex:1 }}>
            <Field label="Loại xe" required>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={s.input}>
                <option value="ghế">Ghế ngồi</option>
                <option value="giường">Giường nằm</option>
                <option value="limousine">Limousine</option>
              </select>
            </Field>
          </div>
          <div style={{ flex:1 }}>
            <Field label="Sơ đồ ghế">
              <input placeholder="vd: 2-2" value={form.seatLayout}
                onChange={e=>setForm({...form,seatLayout:e.target.value})} style={s.input}/>
            </Field>
          </div>
        </Row>
        <Field label="Tiện ích">
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px 16px', marginTop:4 }}>
            {BUS_AMENITIES.map(item => (
              <label key={item} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
                <input type="checkbox" checked={form.amenities.includes(item)} onChange={()=>toggleAmenity(item)}/>
                {item}
              </label>
            ))}
          </div>
        </Field>
        <Field label="URL ảnh xe">
          <input placeholder="https://..." value={form.image}
            onChange={e=>setForm({...form,image:e.target.value})} style={s.input}/>
          {form.image && (
            <img src={form.image} alt="preview" style={{ marginTop:8, width:'100%', height:120, objectFit:'cover', borderRadius:6 }}
              onError={e=>e.target.style.display='none'}/>
          )}
        </Field>
        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          <button type="button" onClick={onClose} style={{ ...s.outlineBtn, flex:1 }}>Huỷ</button>
          <button type="submit" disabled={loading} style={{ ...s.primaryBtn, flex:2, opacity:loading?0.6:1 }}>
            {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm xe'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BusesTab({ buses, setBuses }) {
  const { addToast } = useToast();
  const [editBus, setEditBus]           = useState(undefined);
  const [confirmModal, setConfirmModal] = useState(null);
  const [search, setSearch]             = useState('');

  const handleSave = (data, mode) => {
    if (mode === 'update') setBuses(prev => prev.map(b => b._id === data._id ? data : b));
    else setBuses(prev => [...prev, data]);
  };

  const handleDelete = id => setConfirmModal({
    message: 'Xoá xe này khỏi hệ thống?',
    onConfirm: async () => {
      setConfirmModal(null);
      try { await adminDeleteBus(id); setBuses(prev=>prev.filter(b=>b._id!==id)); addToast('Đã xoá xe','info'); }
      catch { addToast('Lỗi xoá xe','error'); }
    },
  });

  const filtered = buses.filter(b =>
    !search || [b.name, b.plate].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const typeColor = { ghế:'#2563eb', giường:'#7c3aed', limousine:'#d97706' };

  return (
    <div>
      {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)}/>}
      {editBus !== undefined && (
        <BusFormModal bus={editBus} onClose={() => setEditBus(undefined)} onSave={handleSave}/>
      )}

      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Đội xe</h2>
        <button onClick={() => setEditBus(null)} style={s.primaryBtn}>+ Thêm xe</button>
      </div>

      <input placeholder="🔍  Tìm theo tên, biển số..." value={search}
        onChange={e=>setSearch(e.target.value)} style={{ ...s.input, maxWidth:280, marginBottom:16 }}/>

      {filtered.length === 0 && <div style={s.emptyState}>Không tìm thấy xe nào</div>}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:12 }}>
        {filtered.map(b => (
          <div key={b._id} style={{ ...s.card, padding:0, overflow:'hidden' }}>
            {b.image
              ? <img src={b.image} alt={b.name} style={{ width:'100%', height:130, objectFit:'cover' }}/>
              : <div style={{ width:'100%', height:100, background:'linear-gradient(135deg,#f0f4ff,#e0e7ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🚌</div>
            }
            <div style={{ padding:'12px 14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#0f172a' }}>{b.name}</div>
                  <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{b.plate}</div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <button onClick={() => setEditBus(b)} style={s.editBtn}>✏️</button>
                  <button onClick={() => handleDelete(b._id)} style={s.deleteBtn}>🗑</button>
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <span style={{ ...s.infoBadge, color: typeColor[b.type]||'#374151', background:`${typeColor[b.type]||'#374151'}15`, borderColor:`${typeColor[b.type]||'#374151'}30` }}>
                  {b.type}
                </span>
                <span style={s.infoBadge}>💺 {b.seatCount} ghế</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   POSTS
════════════════════════════════════════ */
const POST_CATS = ['Tin tức', 'Khuyến mãi', 'Hướng dẫn', 'Thông báo'];

/* ── Rich text editor ── */
function RichEditor({ value, onChange }) {
  const editorRef = useRef(null);

  // Chỉ set innerHTML khi mount lần đầu hoặc khi editing bài khác (value thay đổi từ bên ngoài)
  const lastValueRef = useRef(null);
  useEffect(() => {
    if (!editorRef.current) return;
    if (lastValueRef.current !== value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = DOMPurify.sanitize(value || '');
      lastValueRef.current = value;
    }
  });

  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    syncContent();
  };

  const syncContent = () => {
    const html = editorRef.current?.innerHTML || '';
    lastValueRef.current = html;
    onChange(html);
  };

  const insertLink = () => {
    const url = window.prompt('Nhập URL:');
    if (url) exec('createLink', url);
  };

  const TOOLBAR = [
    [
      { icon: 'B',  title: 'In đậm',      cmd: () => exec('bold'),          style: { fontWeight: 900 } },
      { icon: 'I',  title: 'In nghiêng',  cmd: () => exec('italic'),        style: { fontStyle: 'italic' } },
      { icon: 'U',  title: 'Gạch chân',   cmd: () => exec('underline'),     style: { textDecoration: 'underline' } },
    ],
    [
      { icon: 'H2', title: 'Tiêu đề lớn', cmd: () => exec('formatBlock', 'h2') },
      { icon: 'H3', title: 'Tiêu đề nhỏ', cmd: () => exec('formatBlock', 'h3') },
      { icon: '¶',  title: 'Đoạn văn',    cmd: () => exec('formatBlock', 'p') },
    ],
    [
      { icon: '•≡', title: 'Danh sách',   cmd: () => exec('insertUnorderedList') },
      { icon: '1≡', title: 'Danh sách số',cmd: () => exec('insertOrderedList') },
    ],
    [
      { icon: '🔗', title: 'Chèn link',   cmd: insertLink },
      { icon: '" "',title: 'Trích dẫn',   cmd: () => exec('formatBlock', 'blockquote') },
      { icon: '—',  title: 'Đường kẻ ngang', cmd: () => exec('insertHorizontalRule') },
    ],
    [
      { icon: '↩',  title: 'Undo',        cmd: () => exec('undo') },
      { icon: '↪',  title: 'Redo',        cmd: () => exec('redo') },
    ],
  ];

  return (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px',
                    background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        {TOOLBAR.map((group, gi) => (
          <div key={gi} style={{ display: 'flex', gap: 1, marginRight: 6, paddingRight: 6,
                                  borderRight: gi < TOOLBAR.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
            {group.map((btn) => (
              <button key={btn.icon} type="button" title={btn.title} onMouseDown={e => { e.preventDefault(); btn.cmd(); }}
                style={{ padding: '4px 8px', background: 'none', border: '1px solid transparent',
                         borderRadius: 5, cursor: 'pointer', fontSize: 13, color: '#374151',
                         minWidth: 30, ...btn.style,
                         transition: 'all .12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e8edf4'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}>
                {btn.icon}
              </button>
            ))}
          </div>
        ))}
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncContent}
        onBlur={syncContent}
        className="article-body"
        style={{ minHeight: 320, padding: '16px 18px', fontSize: 15, lineHeight: 1.85,
                 outline: 'none', color: '#1a202c', overflowY: 'auto' }}
      />
    </div>
  );
}

function PostsTab() {
  const { addToast } = useToast();
  const empty = { title:'', excerpt:'', content:'', thumbnail:'', category:'Tin tức', published:false };
  const [posts, setPosts]               = useState([]);
  const [form, setForm]                 = useState(empty);
  const [editing, setEditing]           = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    adminGetPosts().then(r=>setPosts(r.data)).catch(()=>addToast('Không tải được bài viết','error'));
  }, []); // eslint-disable-line

  const openNew  = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = p   => { setEditing(p._id); setForm({ title:p.title, excerpt:p.excerpt||'', content:p.content, thumbnail:p.thumbnail||'', category:p.category||'Tin tức', published:p.published }); setShowForm(true); };

  const submit = async e => {
    e.preventDefault();
    try {
      if (editing) {
        const res = await adminUpdatePost(editing, form);
        setPosts(prev=>prev.map(p=>p._id===editing?res.data:p));
        addToast('Đã lưu bài viết','success');
      } else {
        const res = await adminCreatePost(form);
        setPosts(prev=>[res.data,...prev]);
        addToast('Đã tạo bài viết','success');
      }
      setShowForm(false); setEditing(null); setForm(empty);
    } catch (err) { addToast(err.response?.data?.message||'Lỗi lưu bài','error'); }
  };

  const togglePublish = async p => {
    try {
      const res = await adminUpdatePost(p._id, { published:!p.published });
      setPosts(prev=>prev.map(x=>x._id===p._id?res.data:x));
      addToast(!p.published?'Đã xuất bản':'Đã ẩn bài','success');
    } catch { addToast('Lỗi cập nhật','error'); }
  };

  const handleDelete = id => setConfirmModal({
    message: 'Xoá bài viết này?',
    onConfirm: async () => {
      setConfirmModal(null);
      try { await adminDeletePost(id); setPosts(prev=>prev.filter(p=>p._id!==id)); addToast('Đã xoá','info'); }
      catch { addToast('Lỗi xoá bài','error'); }
    },
  });

  if (showForm) return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={()=>{setShowForm(false);setEditing(null);setForm(empty);}} style={s.ghostBtn}>← Quay lại</button>
        <h2 style={{ ...s.pageTitle, margin:0 }}>{editing ? 'Sửa bài viết' : 'Viết bài mới'}</h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, alignItems:'start' }}>
        {/* Main form */}
        <form id="postForm" onSubmit={submit}>
          <div style={s.card}>
            <Field label="Tiêu đề" required>
              <input required placeholder="Nhập tiêu đề bài viết..." value={form.title}
                onChange={e=>setForm({...form,title:e.target.value})}
                style={{ ...s.input, fontSize:18, fontWeight:700, padding:'12px 14px' }}/>
            </Field>
            <Field label="Tóm tắt (hiển thị ở danh sách bài)">
              <textarea placeholder="Mô tả ngắn gọn về bài viết..." value={form.excerpt}
                onChange={e=>setForm({...form,excerpt:e.target.value})}
                style={{ ...s.input, minHeight:80, resize:'vertical' }}/>
            </Field>
            <Field label="Nội dung" required>
              <RichEditor value={form.content} onChange={v => setForm(f => ({...f, content: v}))}/>
            </Field>
          </div>
        </form>

        {/* Sidebar settings */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={s.card}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:'#374151' }}>Xuất bản</div>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, marginBottom:16 }}>
              <input type="checkbox" checked={form.published} onChange={e=>setForm({...form,published:e.target.checked})}
                style={{ width:16, height:16 }}/>
              <span>Công khai ngay sau khi lưu</span>
            </label>
            <button form="postForm" type="submit" style={{ ...s.primaryBtn, width:'100%', padding:'11px' }}>
              {editing ? '💾 Lưu thay đổi' : '📤 Đăng bài'}
            </button>
          </div>

          <div style={s.card}>
            <Field label="Danh mục">
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={s.input}>
                {POST_CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Ảnh bìa (URL)">
              <input placeholder="https://..." value={form.thumbnail}
                onChange={e=>setForm({...form,thumbnail:e.target.value})} style={s.input}/>
              {form.thumbnail && (
                <img src={form.thumbnail} alt="thumb" style={{ marginTop:8, width:'100%', height:120, objectFit:'cover', borderRadius:6 }}
                  onError={e=>e.target.style.display='none'}/>
              )}
            </Field>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)}/>}
      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Bài viết</h2>
        <button onClick={openNew} style={s.primaryBtn}>+ Viết bài mới</button>
      </div>

      {posts.length === 0 && <div style={s.emptyState}>Chưa có bài viết nào. Hãy viết bài đầu tiên!</div>}

      {posts.map(p => (
        <div key={p._id} style={{ ...s.listRow, display:'flex', gap:14, alignItems:'center' }}>
          {p.thumbnail
            ? <img src={p.thumbnail} alt={p.title} style={{ width:100, height:68, objectFit:'cover', borderRadius:8, flexShrink:0 }}
                onError={e=>e.target.style.display='none'}/>
            : <div style={{ width:100, height:68, background:'#f1f5f9', borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>📰</div>
          }
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:700, fontSize:15, color:'#0f172a', marginBottom:3,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>
              {p.category} · {formatDate(p.createdAt)}
            </div>
            {p.excerpt && <div style={{ fontSize:13, color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.excerpt}</div>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600,
              background: p.published ? '#d1fae5' : '#f1f5f9',
              color:      p.published ? '#065f46' : '#64748b' }}>
              {p.published ? '● Đã xuất bản' : '○ Bản nháp'}
            </span>
            <div style={{ display:'flex', gap:4 }}>
              <button onClick={() => togglePublish(p)} style={s.ghostBtn}>
                {p.published ? 'Ẩn' : 'Xuất bản'}
              </button>
              <button onClick={() => openEdit(p)} style={s.editBtn}>✏️ Sửa</button>
              <button onClick={() => handleDelete(p._id)} style={s.deleteBtn}>🗑</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   USERS
════════════════════════════════════════ */
function UsersTab() {
  const { addToast } = useToast();
  const [users,        setUsers]        = useState([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState({ name:'', phone:'', role:'user' });
  const [saving,       setSaving]       = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const load = useCallback((p = 1) => {
    setLoading(true);
    adminGetUsers({ page:p, limit:20 })
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => addToast('Lỗi tải dữ liệu','error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => { load(1); }, []); // eslint-disable-line

  const goPage = (p) => { setPage(p); load(p); };

  const openEdit  = u => { setEditing(u); setForm({ name:u.name, phone:u.phone||'', role:u.role }); };
  const closeEdit = () => setEditing(null);

  const handleDelete = u => setConfirmModal({
    message: `Xoá tài khoản "${u.name}" (${u.email})? Hành động này không thể hoàn tác.`,
    onConfirm: async () => {
      setConfirmModal(null);
      try {
        await adminDeleteUser(u._id);
        setUsers(prev => prev.filter(x => x._id !== u._id));
        setTotal(prev => prev - 1);
        addToast('Đã xoá tài khoản', 'info');
      } catch (err) {
        addToast(err.response?.data?.message || 'Lỗi xoá tài khoản', 'error');
      }
    },
  });

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await adminUpdateUser(editing._id, form);
      setUsers(prev => prev.map(u => u._id === editing._id ? res.data : u));
      addToast('Cập nhật thành công', 'success');
      closeEdit();
    } catch (err) {
      addToast(err.response?.data?.message || 'Lỗi cập nhật', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)}/>}
      {editing && (
        <div style={s.overlay} onClick={e => e.target===e.currentTarget && closeEdit()}>
          <div style={{ ...s.modal, maxWidth:440 }}>
            <div style={s.modalHeader}>
              <span style={{ fontWeight:700, fontSize:15 }}>Chỉnh sửa người dùng</span>
              <button style={s.closeBtn} onClick={closeEdit}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ padding:'20px 24px 24px', display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={s.label}>Họ và tên</label>
                <input style={s.input} required value={form.name} onChange={e => setForm({...form,name:e.target.value})}/>
              </div>
              <div>
                <label style={s.label}>Email</label>
                <input style={{ ...s.input, background:'#f5f7fa', color:'#94a3b8' }} value={editing.email} disabled/>
              </div>
              <div>
                <label style={s.label}>Số điện thoại</label>
                <input style={s.input} placeholder="0901234567" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})}/>
              </div>
              <div>
                <label style={s.label}>Vai trò</label>
                <select style={{ ...s.input, cursor:'pointer' }} value={form.role} onChange={e => setForm({...form,role:e.target.value})}>
                  <option value="user">Người dùng</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
                <button type="button" onClick={closeEdit} style={s.outlineBtn}>Huỷ</button>
                <button type="submit" disabled={saving} style={s.primaryBtn}>{saving?'Đang lưu...':'Lưu thay đổi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Khách hàng</h2>
        <span style={{ fontSize:13, color:'#94a3b8' }}>Tổng: {total} người dùng</span>
      </div>
      {loading
        ? <Spinner/>
        : users.length === 0
          ? <div style={s.emptyState}>Chưa có người dùng</div>
          : users.map(u => (
            <div key={u._id} style={{ ...s.listRow, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center',
                justifyContent:'center', fontWeight:700, fontSize:17,
                background: u.role==='admin'?`linear-gradient(135deg,#0f5f8c,${ORANGE})`:'#e2e8f0',
                color: u.role==='admin'?'#fff':'#64748b' }}>
                {u.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14, color:'#0f172a' }}>{u.name}</div>
                <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>
                  {u.email}{u.phone?` · ${u.phone}`:''} · Tham gia {formatDate(u.createdAt)}
                </div>
              </div>
              {u.role==='admin' && (
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600,
                  background:'#fff5f0', color:ORANGE, border:`1px solid ${ORANGE}40` }}>Admin</span>
              )}
              <button onClick={() => openEdit(u)} style={s.editBtn}>✏️ Sửa</button>
              <button onClick={() => handleDelete(u)} style={s.deleteBtn}>🗑</button>
            </div>
          ))
      }
      <Pagination page={page} pages={pages} onPage={goPage}/>
    </div>
  );
}

/* ════════════════════════════════════════
   VOUCHERS
════════════════════════════════════════ */
function VouchersTab() {
  const { addToast } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editItem, setEditItem] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [confirmModal, setConfirmModal] = useState(null);

  const defaultForm = { code:'', description:'', type:'percent', value:'', minOrder:'', maxDiscount:'', usageLimit:'', expiresAt:'', isActive:true };
  const [form, setForm] = useState(defaultForm);

  const load = () => {
    setLoading(true);
    adminGetVouchers().then(r => setVouchers(r.data)).catch(() => addToast('Lỗi tải voucher','error')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const openNew  = () => { setForm(defaultForm); setEditItem(null); };
  const openEdit = v => {
    const expiresLocal = v.expiresAt
      ? new Date(new Date(v.expiresAt).getTime() - new Date(v.expiresAt).getTimezoneOffset()*60000).toISOString().slice(0,16)
      : '';
    setForm({ ...v, expiresAt: expiresLocal, value: v.value, minOrder: v.minOrder||'', maxDiscount: v.maxDiscount||'', usageLimit: v.usageLimit||'' });
    setEditItem(v);
  };

  const handleSave = async e => {
    e.preventDefault();
    const payload = {
      ...form,
      value:      Number(form.value),
      minOrder:   form.minOrder   ? Number(form.minOrder)   : 0,
      maxDiscount:form.maxDiscount? Number(form.maxDiscount): 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
      expiresAt:  form.expiresAt  || null,
    };
    try {
      if (editItem) {
        await adminUpdateVoucher(editItem._id, payload);
        addToast('Đã cập nhật voucher', 'success');
      } else {
        await adminCreateVoucher(payload);
        addToast('Đã tạo voucher', 'success');
      }
      load();
      setEditItem(undefined);
    } catch (err) {
      addToast(err.response?.data?.message || 'Lỗi lưu voucher', 'error');
    }
  };

  const handleDelete = v => setConfirmModal({
    message: `Xoá voucher "${v.code}"?`,
    onConfirm: async () => {
      setConfirmModal(null);
      try { await adminDeleteVoucher(v._id); load(); addToast('Đã xoá','info'); }
      catch { addToast('Lỗi xoá voucher','error'); }
    },
  });

  const toggleActive = async v => {
    try {
      await adminUpdateVoucher(v._id, { isActive: !v.isActive });
      setVouchers(prev => prev.map(x => x._id === v._id ? { ...x, isActive: !v.isActive } : x));
    } catch { addToast('Lỗi cập nhật', 'error'); }
  };

  return (
    <div>
      {confirmModal && <ConfirmModal {...confirmModal} onCancel={() => setConfirmModal(null)}/>}

      {/* Form Modal */}
      {editItem !== undefined && (
        <Modal title={editItem ? 'Sửa voucher' : 'Tạo voucher mới'} onClose={() => setEditItem(undefined)}>
          <form onSubmit={handleSave}>
            <Row>
              <div style={{ flex:1 }}>
                <Field label="Mã voucher" required>
                  <input required value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})}
                    placeholder="VD: SUMMER20" style={s.input}/>
                </Field>
              </div>
              <div style={{ flex:1 }}>
                <Field label="Loại giảm" required>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={s.input}>
                    <option value="percent">% Phần trăm</option>
                    <option value="fixed">Số tiền cố định</option>
                  </select>
                </Field>
              </div>
            </Row>
            <Row>
              <div style={{ flex:1 }}>
                <Field label={form.type==='percent'?'Giảm (%)':'Giảm (VND)'} required>
                  <input required type="number" min="1" value={form.value}
                    onChange={e=>setForm({...form,value:e.target.value})}
                    placeholder={form.type==='percent'?'VD: 20':'VD: 50000'} style={s.input}/>
                </Field>
              </div>
              {form.type==='percent' && (
                <div style={{ flex:1 }}>
                  <Field label="Giảm tối đa (VND)">
                    <input type="number" min="0" value={form.maxDiscount}
                      onChange={e=>setForm({...form,maxDiscount:e.target.value})}
                      placeholder="0 = không giới hạn" style={s.input}/>
                  </Field>
                </div>
              )}
            </Row>
            <Row>
              <div style={{ flex:1 }}>
                <Field label="Đơn hàng tối thiểu (VND)">
                  <input type="number" min="0" value={form.minOrder}
                    onChange={e=>setForm({...form,minOrder:e.target.value})}
                    placeholder="0 = không yêu cầu" style={s.input}/>
                </Field>
              </div>
              <div style={{ flex:1 }}>
                <Field label="Giới hạn lượt dùng">
                  <input type="number" min="0" value={form.usageLimit}
                    onChange={e=>setForm({...form,usageLimit:e.target.value})}
                    placeholder="0 = không giới hạn" style={s.input}/>
                </Field>
              </div>
            </Row>
            <Field label="Hết hạn">
              <input type="datetime-local" value={form.expiresAt}
                onChange={e=>setForm({...form,expiresAt:e.target.value})} style={s.input}/>
            </Field>
            <Field label="Mô tả">
              <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                placeholder="VD: Ưu đãi mùa hè" style={s.input}/>
            </Field>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})} id="va"/>
              <label htmlFor="va" style={{ fontSize:13, color:'#374151', cursor:'pointer' }}>Kích hoạt ngay</label>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={() => setEditItem(undefined)} style={{ ...s.outlineBtn, flex:1 }}>Huỷ</button>
              <button type="submit" style={{ ...s.primaryBtn, flex:2 }}>
                {editItem ? 'Lưu thay đổi' : 'Tạo voucher'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Mã giảm giá</h2>
        <button onClick={openNew} style={s.primaryBtn}>+ Tạo mã mới</button>
      </div>

      {loading ? <Spinner/> : vouchers.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize:40, marginBottom:10 }}>🎟️</div>
          Chưa có mã giảm giá nào
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {vouchers.map(v => {
            const expired  = v.expiresAt && new Date() > new Date(v.expiresAt);
            const exhausted = v.usageLimit > 0 && v.usedCount >= v.usageLimit;
            const statusColor = !v.isActive || expired || exhausted ? '#dc2626' : '#16a34a';
            const statusBg    = !v.isActive || expired || exhausted ? '#fef2f2' : '#f0fdf4';
            const statusLabel = !v.isActive ? 'Vô hiệu' : expired ? 'Hết hạn' : exhausted ? 'Hết lượt' : 'Đang hoạt động';
            return (
              <div key={v._id} style={{ ...s.card, border:`1px solid ${statusColor}22` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:900, color:'#0f172a', letterSpacing:1 }}>{v.code}</div>
                    {v.description && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{v.description}</div>}
                  </div>
                  <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                                  background:statusBg, color:statusColor }}>
                    {statusLabel}
                  </span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px', fontSize:12, color:'#475569', marginBottom:12 }}>
                  <span>Loại: <strong>{v.type==='percent'?`-${v.value}%`:`-${v.value.toLocaleString('vi-VN')}đ`}</strong></span>
                  {v.type==='percent' && v.maxDiscount > 0 && <span>Tối đa: <strong>{v.maxDiscount.toLocaleString('vi-VN')}đ</strong></span>}
                  {v.minOrder > 0 && <span>Đơn tối thiểu: <strong>{v.minOrder.toLocaleString('vi-VN')}đ</strong></span>}
                  <span>Lượt dùng: <strong>{v.usedCount}/{v.usageLimit||'∞'}</strong></span>
                  {v.expiresAt && <span>Hết hạn: <strong>{new Date(v.expiresAt).toLocaleDateString('vi-VN')}</strong></span>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => toggleActive(v)}
                    style={{ ...s.ghostBtn, flex:1, fontSize:12, color: v.isActive?'#dc2626':'#16a34a',
                              borderColor: v.isActive?'#fecaca':'#86efac' }}>
                    {v.isActive ? '⏸ Tắt' : '▶ Bật'}
                  </button>
                  <button onClick={() => openEdit(v)} style={{ ...s.editBtn, flex:1 }}>✏️ Sửa</button>
                  <button onClick={() => handleDelete(v)} style={s.deleteBtn}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   CHAT TAB
════════════════════════════════════════ */
function ChatTab() {
  const [convos,       setConvos]       = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [threadMsgs,   setThreadMsgs]   = useState([]);
  const [adminInput,   setAdminInput]   = useState('');
  const [adminSending, setAdminSending] = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [statusTab,    setStatusTab]    = useState('active'); // 'active' | 'completed'
  const [completing,   setCompleting]   = useState(false);
  const bottomRef   = useRef(null);
  const selectedRef = useRef(null);
  const statusRef   = useRef('active');
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { statusRef.current = statusTab; }, [statusTab]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [threadMsgs]);

  const loadConvos = useCallback(async (status) => {
    try { const r = await adminChatConversations(status ?? statusRef.current); setConvos(r.data); }
    catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    setSelected(null);
    setThreadMsgs([]);
    loadConvos(statusTab);
  }, [statusTab, loadConvos]);

  const refresh = useCallback(async () => {
    try {
      const r = await adminChatConversations(statusRef.current);
      setConvos(r.data);
      if (selectedRef.current) {
        const r2 = await adminChatMessages(selectedRef.current._id);
        setThreadMsgs(r2.data);
      }
    } catch {}
  }, []);

  // SSE realtime — admin nhận tin nhắn user mới ngay lập tức
  useEffect(() => {
    const base  = process.env.REACT_APP_API_URL || 'https://booking.longvan.vn/api';
    const token = localStorage.getItem('token');
    if (!token) return;
    const es = new EventSource(`${base}/admin/chat/events?token=${encodeURIComponent(token)}`);
    es.onmessage = (e) => {
      try { if (JSON.parse(e.data)?.type === 'new_message') refresh(); } catch (_) {}
    };
    return () => es.close();
  }, [refresh]);

  // Polling fallback — giãn 15s (SSE lo realtime)
  useEffect(() => {
    const iv = setInterval(refresh, 15000);
    return () => clearInterval(iv);
  }, [refresh]);

  const selectConvo = async (convo) => {
    const name  = convo.user?.[0]?.name  || convo.lastMessage?.guestName || `Khách #${convo._id?.slice(-4)}`;
    const email = convo.user?.[0]?.email || convo.lastMessage?.guestEmail || '';
    const phone = convo.lastMessage?.guestPhone || '';
    setSelected({ _id: convo._id, name, email, phone });
    try { const r = await adminChatMessages(convo._id); setThreadMsgs(r.data); loadConvos(); } catch {}
  };

  const handleReply = async (e) => {
    e.preventDefault();
    const text = adminInput.trim();
    if (!text || !selected || adminSending) return;
    setAdminSending(true);
    const optimistic = { _id: `tmp-${Date.now()}`, sender: 'admin', content: text, createdAt: new Date().toISOString() };
    setThreadMsgs(prev => [...prev, optimistic]);
    setAdminInput('');
    try {
      const res = await adminChatReply(selected._id, text);
      setThreadMsgs(prev => prev.map(m => m._id === optimistic._id ? res.data : m));
    } catch {
      setThreadMsgs(prev => prev.filter(m => m._id !== optimistic._id));
      setAdminInput(text);
    } finally { setAdminSending(false); }
  };

  const handleComplete = async () => {
    if (!selected || completing) return;
    setCompleting(true);
    try {
      await adminChatComplete(selected._id);
      setSelected(null);
      setThreadMsgs([]);
      await loadConvos('active');
      setStatusTab('active');
    } catch {} finally { setCompleting(false); }
  };

  const handleReopen = async () => {
    if (!selected || completing) return;
    setCompleting(true);
    try {
      await adminChatReopen(selected._id);
      setSelected(null);
      setThreadMsgs([]);
      await loadConvos('completed');
    } catch {} finally { setCompleting(false); }
  };

  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const ORANGE = '#1D7DB8';

  return (
    <div>
      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>💬 Hỗ trợ khách hàng</h2>
        {selected && (
          <button onClick={() => { setSelected(null); setThreadMsgs([]); }}
            style={{ ...s.outlineBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Danh sách
          </button>
        )}
      </div>

      {/* Filter tabs */}
      {!selected && (
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: '#f1f5f9',
                      borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {[{ id: 'active', label: 'Đang xử lý' }, { id: 'completed', label: 'Đã hoàn thành' }].map(t => (
            <button key={t.id} onClick={() => setStatusTab(t.id)}
              style={{ padding: '7px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
                       fontWeight: statusTab === t.id ? 700 : 500,
                       background: statusTab === t.id ? '#fff' : 'transparent',
                       color: statusTab === t.id ? '#0f172a' : '#64748b',
                       boxShadow: statusTab === t.id ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                       transition: 'all .15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 200px)', minHeight: 500 }}>

        {/* ── Conversation list ── */}
        <div style={{ width: selected ? 280 : '100%', flexShrink: 0, background: '#fff',
                      borderRadius: 12, border: '1px solid #e8edf4', overflowY: 'auto',
                      boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
                        fontWeight: 700, fontSize: 14, color: '#374151' }}>
            {statusTab === 'active' ? 'Đang xử lý' : 'Đã hoàn thành'}
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>
          ) : convos.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{statusTab === 'active' ? '💬' : '✅'}</div>
              {statusTab === 'active' ? 'Chưa có tin nhắn nào' : 'Chưa có hội thoại nào đã hoàn thành'}
            </div>
          ) : convos.map(c => {
            const name     = c.user?.[0]?.name || c.lastMessage?.guestName || `Khách #${c._id?.slice(-4)}`;
            const phone    = c.lastMessage?.guestPhone;
            const isActive = selected?._id === c._id;
            return (
              <div key={c._id} onClick={() => selectConvo(c)}
                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: 10,
                         alignItems: 'center', borderBottom: '1px solid #f8fafc',
                         background: isActive ? '#fff7f2' : 'transparent',
                         borderLeft: isActive ? `3px solid ${ORANGE}` : '3px solid transparent',
                         opacity: statusTab === 'completed' ? 0.75 : 1,
                         transition: 'background .15s' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%',
                               background: statusTab === 'completed' ? '#94a3b8' : ORANGE,
                               display: 'flex', alignItems: 'center', justifyContent: 'center',
                               color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                  {statusTab === 'completed' ? '✓' : name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.unread > 0 && statusTab === 'active' && (
                        <span style={{ background: '#dc2626', color: '#fff', fontSize: 10,
                                       fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                          {c.unread}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: '#cbd5e1' }}>{fmtDate(c.lastMessage?.createdAt)}</span>
                    </div>
                  </div>
                  {phone && (
                    <div style={{ fontSize:11, color:'#1D7DB8', fontWeight:600, marginBottom:1 }}>
                      📞 {phone}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden',
                                 whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {c.lastMessage?.sender === 'admin' && <span style={{ color: ORANGE }}>Bạn: </span>}
                    {c.lastMessage?.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Thread view ── */}
        {selected && (
          <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #e8edf4',
                        display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                        overflow: 'hidden' }}>
            {/* Thread header */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #f1f5f9',
                          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: ORANGE,
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             color: '#fff', fontWeight: 700, fontSize: 15 }}>
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{selected.name}</div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:2 }}>
                  {selected.phone && <span style={{ fontSize:12, color:'#1D7DB8', fontWeight:600 }}>📞 {selected.phone}</span>}
                  {selected.email && <span style={{ fontSize:12, color:'#94a3b8' }}>✉️ {selected.email}</span>}
                </div>
              </div>
              {/* Complete / Reopen button */}
              {statusTab === 'active' ? (
                <button onClick={handleComplete} disabled={completing}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
                            background:'#22c55e', color:'#fff', border:'none', borderRadius:8,
                            fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0,
                            opacity: completing ? 0.6 : 1 }}>
                  {completing ? '...' : '✓ Hoàn thành'}
                </button>
              ) : (
                <button onClick={handleReopen} disabled={completing}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
                            background:'#64748b', color:'#fff', border:'none', borderRadius:8,
                            fontSize:13, fontWeight:700, cursor:'pointer', flexShrink:0,
                            opacity: completing ? 0.6 : 1 }}>
                  {completing ? '...' : '↩ Mở lại'}
                </button>
              )}
            </div>

            {/* Completed banner */}
            {statusTab === 'completed' && (
              <div style={{ background:'#f0fdf4', borderBottom:'1px solid #bbf7d0',
                             padding:'8px 18px', fontSize:13, color:'#16a34a', display:'flex', alignItems:'center', gap:6 }}>
                ✅ Hội thoại đã được đánh dấu hoàn thành
              </div>
            )}

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {threadMsgs.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>
                  Chưa có tin nhắn
                </div>
              ) : threadMsgs.map(msg => {
                const mine = msg.sender === 'admin';
                return (
                  <div key={msg._id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                    {!mine && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#64748b',
                                     color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                     fontWeight: 700, fontSize: 12, flexShrink: 0, marginRight: 6, alignSelf: 'flex-end' }}>
                        {selected.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ maxWidth: '70%' }}>
                      <div style={mine
                        ? { background: ORANGE, color: '#fff', padding: '9px 13px', borderRadius: '16px 16px 4px 16px', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }
                        : { background: '#f0f4f8', color: '#1a202c', padding: '9px 13px', borderRadius: '16px 16px 16px 4px', fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word' }
                      }>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: 10, color: '#bbb', marginTop: 3, textAlign: mine ? 'right' : 'left', paddingLeft: 4 }}>
                        {fmtTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>

            {/* Reply input — ẩn nếu đã hoàn thành */}
            {statusTab === 'active' && (
              <form onSubmit={handleReply}
                style={{ display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid #f0f4f8', flexShrink: 0 }}>
                <input value={adminInput} onChange={e => setAdminInput(e.target.value)}
                  placeholder={`Trả lời ${selected.name}...`}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: 24, border: '1.5px solid #e0e0e0',
                            fontSize: 14, background: '#fafafa', outline: 'none' }}
                  maxLength={1000} disabled={adminSending} autoFocus/>
                <button type="submit" disabled={!adminInput.trim() || adminSending}
                  style={{ padding: '10px 20px', background: ORANGE, color: '#fff', border: 'none',
                            borderRadius: 24, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            opacity: !adminInput.trim() ? 0.5 : 1, flexShrink: 0 }}>
                  {adminSending ? '...' : 'Gửi'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   STYLES
════════════════════════════════════════ */
const s = {
  /* Layout */
  sidebar:     { width:240, flexShrink:0, background:'#1e293b', display:'flex', flexDirection:'column', position:'sticky', top:0, height:'100vh', overflowY:'auto' },
  sideTop:     { padding:'10px 0 16px' },
  sideTitle:   { padding:'0 18px 8px', fontSize:10, fontWeight:700, letterSpacing:2, color:'#475569', textTransform:'uppercase' },
  sideItem:    { display:'flex', alignItems:'center', gap:10, padding:'10px 18px', background:'none', border:'none', color:'#94a3b8', fontSize:13, cursor:'pointer', width:'100%', borderLeft:'3px solid transparent', transition:'all .15s' },
  sideItemOn:  { background:'rgba(29,125,184,.18)', color:'#fff', borderLeftColor:ORANGE },
  sideBadge:   { background:'#ef4444', color:'#fff', borderRadius:10, padding:'1px 6px', fontSize:11, fontWeight:700 },
  main:        { flex:1, padding:'0 32px 28px', minWidth:0, overflowX:'hidden' },
  topbar:      { display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'20px 0 20px', marginBottom:8,
                  borderBottom:'1px solid #e8edf4', marginTop:0 },
  topbarTitle: { fontSize:22, fontWeight:900, color:'#0f172a', margin:0 },
  topbarSub:   { fontSize:12, color:'#94a3b8', marginTop:2 },

  /* Page */
  pageHeader:  { display:'flex', alignItems:'center', gap:12, marginBottom:24, paddingBottom:16, borderBottom:'2px solid #f1f5f9' },
  pageTitle:   { margin:0, fontSize:21, fontWeight:800, color:'#0f172a', flex:1 },
  loadingBox:  { color:'#94a3b8', padding:40, textAlign:'center' },
  emptyState:  { textAlign:'center', color:'#94a3b8', padding:'56px 20px', fontSize:14, background:'#f8fafc', borderRadius:12, border:'1px dashed #e2e8f0' },

  /* Cards */
  card:        { background:'#fff', border:'1px solid #e8edf4', borderRadius:12, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' },
  cardHeader:  { fontSize:14, fontWeight:700, color:'#374151' },
  listRow:     { background:'#fff', border:'1px solid #e8edf4', borderRadius:10, padding:'14px 18px', marginBottom:8, boxShadow:'0 1px 3px rgba(0,0,0,.03)' },
  filterBar:   { display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:16, background:'#fff', border:'1px solid #e8edf4', borderRadius:10, padding:'12px 16px', boxShadow:'0 1px 3px rgba(0,0,0,.03)' },

  /* Form elements */
  label:       { display:'block', fontSize:12, fontWeight:600, color:'#64748b', marginBottom:5, textTransform:'uppercase', letterSpacing:.4 },
  input:       { display:'block', width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:14, boxSizing:'border-box', background:'#fff', outline:'none', color:'#0f172a' },

  /* Modals */
  overlay:     { position:'fixed', inset:0, background:'rgba(15,23,42,.5)', zIndex:4000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal:       { background:'#fff', borderRadius:14, width:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.2)' },
  modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', borderBottom:'1px solid #f1f5f9' },
  closeBtn:    { background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#94a3b8', padding:'0 4px', lineHeight:1 },

  /* Buttons */
  primaryBtn:  { padding:'9px 18px', background:ORANGE, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13, flexShrink:0, whiteSpace:'nowrap' },
  outlineBtn:  { padding:'9px 16px', background:'#fff', color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, whiteSpace:'nowrap' },
  ghostBtn:    { padding:'7px 14px', background:'#f8fafc', color:'#64748b', border:'1px solid #e2e8f0', borderRadius:7, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' },
  editBtn:     { padding:'5px 11px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:6, cursor:'pointer', fontSize:12, whiteSpace:'nowrap' },
  deleteBtn:   { padding:'5px 10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:6, cursor:'pointer', fontSize:13 },
  confirmBtn:  { padding:'8px 16px', background:'#16a34a', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontWeight:700, fontSize:13, whiteSpace:'nowrap' },
  cancelBkBtn: { padding:'7px 14px', background:'#fff', color:'#dc2626', border:'1.5px solid #fecaca', borderRadius:7, cursor:'pointer', fontSize:13, whiteSpace:'nowrap' },
  dangerBtn:   { padding:'9px 18px', background:'#dc2626', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:14 },

  /* Misc */
  infoBadge:   { display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:6, fontSize:12, fontWeight:600, background:'#f8fafc', color:'#475569', border:'1px solid #e2e8f0' },
};
