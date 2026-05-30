import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrip, createBooking, getBookedSeats, getTripReviews } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';
import { formatPrice } from '../utils/format';
import { useToast } from '../components/Toast';
import useSEO from '../hooks/useSEO';

const P   = '#1D7DB8';
const INK = '#0C1825';

const STEPS = ['Đặt', 'Chọn ghế', 'Thanh toán', 'Vé điện tử'];

function Stepper({ current }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0 }}>
      {STEPS.map((label, i) => {
        const step   = i + 1;
        const done   = step < current;
        const active = step === current;
        return (
          <div key={i} style={{ display:'flex', alignItems:'center' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:32, height:32, borderRadius:'50%', display:'flex',
                alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13,
                background: done ? '#16A34A' : active ? P : '#C8D5E4',
                color:      done || active ? '#fff' : '#94a3b8',
                boxShadow:  active ? `0 0 0 4px ${P}28` : 'none',
              }}>
                {done ? '✓' : step}
              </div>
              <span style={{ fontSize:11, fontWeight: active ? 700 : 400, color: active ? P : done ? '#16A34A' : '#94a3b8', whiteSpace:'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width:40, height:2, background: done ? '#16A34A' : '#C8D5E4', margin:'0 4px', marginBottom:16 }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Stars({ rating, size = 14 }) {
  return (
    <>
      {Array.from({length:5}, (_,i) => (
        <span key={i} style={{ color: i < Math.round(rating) ? '#D4A020' : '#C8D5E4', fontSize:size }}>★</span>
      ))}
    </>
  );
}

function SummaryCard({ trip, selectedSeats, totalPrice, showSeats }) {
  if (!trip) return null;
  const bus   = trip.bus   || {};
  const route = trip.route || {};
  const dep   = new Date(trip.departureTime);
  const depTime = dep.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
  const arr     = trip.arrivalTime ? new Date(trip.arrivalTime) : null;
  const arrTime = arr
    ? arr.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
    : route.duration
      ? new Date(dep.getTime() + route.duration * 60000).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
      : null;
  const duration   = route.duration ? `${Math.floor(route.duration/60)}h${route.duration%60 ? route.duration%60+'p' : ''}` : null;
  const busTypeLbl = { ghế:'Xe ghế', giường:'Xe giường', limousine:'Limousine' }[bus.type] || bus.type || '';
  const depDate    = dep.toLocaleDateString('vi-VN', { weekday:'short', day:'2-digit', month:'2-digit' });

  return (
    <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 4px 20px rgba(11,31,58,0.10)', border:'1px solid #C8D5E4', marginBottom:14 }}>
      <div style={{ background:INK, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, letterSpacing:1.5, textTransform:'uppercase', marginBottom:4 }}>Hành trình</div>
          <div style={{ color:'#fff', fontWeight:800, fontSize:16 }}>{route.from} → {route.to}</div>
        </div>
        <div style={{ background:P, color:'#fff', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>
          {bus.name || busTypeLbl}
        </div>
      </div>

      <div style={{ padding:'12px 20px', borderBottom:'1px solid #F0F0F0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:13, fontWeight:600, color:'#333' }}>{depDate}</span>
        <span style={{ fontSize:12, color:'#888' }}>{busTypeLbl}{bus.seatCount ? ` · ${bus.seatCount} chỗ` : ''}</span>
      </div>

      <div style={{ padding:'16px 20px', borderBottom:'1px solid #F0F0F0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:P, flexShrink:0, boxShadow:`0 0 0 3px ${P}33` }}/>
          <div>
            <div style={{ fontWeight:800, fontSize:18, color:INK }}>{depTime}</div>
            <div style={{ fontSize:12, color:'#888' }}>{route.from}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', margin:'6px 0 6px 4px', gap:10 }}>
          <div style={{ width:2, height:duration ? 16 : 24, background:'#C8D5E4' }}/>
          {duration && <span style={{ fontSize:11, color:'#aaa' }}>⏱ {duration}</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#16A34A', flexShrink:0, boxShadow:'0 0 0 3px #16A34A33' }}/>
          <div>
            <div style={{ fontWeight:800, fontSize:18, color:INK }}>{arrTime || '—'}</div>
            <div style={{ fontSize:12, color:'#888' }}>{route.to}</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'12px 20px', borderBottom:'1px solid #F0F0F0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:13, color:'#888' }}>Giá / ghế</span>
        <span style={{ fontWeight:800, color:P, fontSize:16 }}>{formatPrice(trip.price)}</span>
      </div>

      {showSeats && selectedSeats.length > 0 && (
        <div style={{ padding:'12px 20px', borderBottom:'1px solid #F0F0F0', background:'#E3F1FA' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
            <span style={{ color:'#888' }}>Ghế đã chọn</span>
            <span style={{ fontWeight:600 }}>{selectedSeats.slice().sort((a,b)=>a-b).join(', ')}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
            <span style={{ color:'#888' }}>{selectedSeats.length} × {formatPrice(trip.price)}</span>
            <span style={{ fontWeight:800, color:P, fontSize:17 }}>{formatPrice(totalPrice)}</span>
          </div>
        </div>
      )}

      <div style={{ padding:'12px 20px' }}>
        {[['🚫', 'Không đổi lịch', 'Không thể thay đổi sau khi đặt'],['↩️', 'Không hoàn lại', 'Vé không thể hủy sau khi đặt']].map(([icon,title,sub]) => (
          <div key={title} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:8 }}>
            <span style={{ fontSize:13 }}>{icon}</span>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'#dc2626' }}>{title}</div>
              <div style={{ fontSize:11, color:'#aaa' }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Booking() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { addToast } = useToast();

  const [bookStep, setBookStep]             = useState(1);
  const [trip, setTrip]                     = useState(null);
  const [bookedSeats, setBookedSeats]       = useState({ confirmed:[], pending:[] });
  const [selectedSeats, setSelected]        = useState([]);
  const [form, setForm]                     = useState({ passengerName:'', passengerPhone:'' });
  const [loading, setLoading]               = useState(false);
  const [pageLoading, setPageLoading]       = useState(true);
  const [pageError, setPageError]           = useState(false);
  const [formErrors, setFormErrors]         = useState({});
  const [activeTab, setActiveTab]           = useState('features');
  const [reviews, setReviews]               = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  useSEO({ title: trip ? `Đặt vé ${trip.route?.from} → ${trip.route?.to}` : 'Đặt vé — FASTBUS' });

  useEffect(() => {
    setPageLoading(true); setPageError(false);
    Promise.all([getTrip(id), getBookedSeats(id)])
      .then(([tripRes, seatsRes]) => { setTrip(tripRes.data); setBookedSeats(seatsRes.data); })
      .catch(() => setPageError(true))
      .finally(() => setPageLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'reviews' || reviews !== null) return;
    setReviewsLoading(true);
    getTripReviews(id)
      .then(r => setReviews(r.data))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [activeTab, id, reviews]);

  useEffect(() => {
    const baseUrl = process.env.REACT_APP_API_URL || 'https://booking.longvan.vn/api';
    const es = new EventSource(`${baseUrl}/trips/${id}/events`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'seats_updated') getBookedSeats(id).then(r => setBookedSeats(r.data)).catch(() => {});
      } catch (_) {}
    };
    return () => es.close();
  }, [id]);

  if (pageLoading) return (
    <div style={s.center}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s.spinner}/>
      <p style={{ color:'#888', marginTop:16 }}>Đang tải thông tin chuyến...</p>
    </div>
  );

  if (pageError || !trip) return (
    <div style={s.center}>
      <div style={s.centerBox}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <h3 style={{ margin:'0 0 8px' }}>Không thể tải thông tin chuyến</h3>
        <p style={{ color:'#888', margin:'0 0 20px' }}>Vui lòng thử lại hoặc quay về trang tìm kiếm</p>
        <button onClick={() => navigate(-1)} style={s.primaryBtn}>← Quay lại</button>
      </div>
    </div>
  );

  const toggleSeat = (n) => setSelected(p => p.includes(n) ? p.filter(x=>x!==n) : [...p,n]);

  const goToSeats = () => {
    const errors = {};
    if (!form.passengerName.trim())
      errors.passengerName = 'Vui lòng nhập họ tên';
    if (!form.passengerPhone.trim())
      errors.passengerPhone = 'Vui lòng nhập số điện thoại';
    else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(form.passengerPhone.trim()))
      errors.passengerPhone = 'Số điện thoại không hợp lệ (VD: 0901234567)';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setBookStep(2);
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  const handleSubmit = async () => {
    if (selectedSeats.length === 0) return addToast('Chọn ít nhất 1 ghế', 'warning');
    if (!user) return navigate('/login', { state: { from: `/booking/${id}` } });
    setLoading(true);
    try {
      const res = await createBooking({
        tripId: id, seats: selectedSeats,
        passengerName:  form.passengerName,
        passengerPhone: form.passengerPhone,
      });
      navigate(`/checkout/${res.data._id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Đặt vé thất bại', 'error');
    } finally { setLoading(false); }
  };

  const bus        = trip.bus   || {};
  const route      = trip.route || {};
  const dep        = new Date(trip.departureTime);
  const depTime    = dep.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
  const arr        = trip.arrivalTime ? new Date(trip.arrivalTime) : null;
  const arrTime    = arr
    ? arr.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
    : route.duration
      ? new Date(dep.getTime() + route.duration * 60000).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
      : null;
  const totalPrice  = trip.price * selectedSeats.length;
  const reviewCount = Number(bus.reviewCount) || 0;
  const avgRating   = Number(bus.avgRating)   || 0;
  const busTypeLbl  = { ghế:'Xe ghế', giường:'Xe giường', limousine:'Limousine' }[bus.type] || bus.type || '';

  const TABS = [
    { id:'features', label: 'Đặc trưng' },
    { id:'route',    label: 'Tuyến đường' },
    { id:'reviews',  label: `Đánh giá${reviewCount > 0 ? ` (${reviewCount})` : ''}` },
  ];

  // ── STEP 1: Enter info ───────────────────────────────────
  if (bookStep === 1) return (
    <div style={{ background:'var(--surface-2)', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 820px) {
          .bk-grid  { flex-direction: column !important; }
          .bk-left, .bk-right { width: 100% !important; flex: unset !important; }
          .form-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={s.topBar}>
        <div style={s.topBarInner}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <button onClick={() => navigate(-1)} style={s.backBtn}>←</button>
            <span style={{ fontSize:16, fontWeight:700, color:INK }}>Nhập thông tin</span>
            <span style={{ marginLeft:'auto', fontSize:12, color:'#aaa' }}>
              ⏱ Sau khi đặt, bạn có 5 phút thanh toán
            </span>
          </div>
          <Stepper current={1}/>
        </div>
      </div>

      <div style={s.body}>
        <div className="bk-grid" style={s.grid}>

          <div className="bk-left" style={{ flex:'1 1 56%', minWidth:0 }}>
            {!user && (
              <div style={{ background:INK, borderRadius:14, padding:20, marginBottom:14, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ fontSize:32 }}>🔐</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:15, marginBottom:4 }}>Đăng nhập để đặt vé và nhận ưu đãi</div>
                  <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13 }}>Tích điểm thưởng, quản lý vé dễ dàng</div>
                </div>
                <button
                  onClick={() => navigate('/login', { state: { from: `/booking/${id}` } })}
                  style={{ padding:'9px 18px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
                  Đăng nhập ngay
                </button>
              </div>
            )}

            <div style={s.card}>
              <div style={s.cardTitle}>Thông tin liên hệ</div>
              <div className="form-2col" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={s.label}>Họ và tên <span style={{ color:P }}>*</span></label>
                  <input placeholder="Nhập họ tên..." style={{ ...s.input, ...(formErrors.passengerName ? s.inputErr : {}) }}
                    value={form.passengerName}
                    onChange={e => { setForm({...form, passengerName:e.target.value}); setFormErrors(p=>({...p, passengerName:null})); }}/>
                  {formErrors.passengerName && <div style={s.errMsg}>{formErrors.passengerName}</div>}
                </div>
                <div>
                  <label style={s.label}>Số điện thoại <span style={{ color:P }}>*</span></label>
                  <input placeholder="0901234567" style={{ ...s.input, ...(formErrors.passengerPhone ? s.inputErr : {}) }}
                    value={form.passengerPhone}
                    onChange={e => { setForm({...form, passengerPhone:e.target.value}); setFormErrors(p=>({...p, passengerPhone:null})); }}/>
                  {formErrors.passengerPhone && <div style={s.errMsg}>{formErrors.passengerPhone}</div>}
                </div>
              </div>
              <button onClick={goToSeats}
                style={{ ...s.primaryBtn, width:'100%', marginTop:20, fontSize:15, padding:14 }}>
                Tiếp tục →
              </button>
            </div>
          </div>

          <div className="bk-right" style={{ flex:'1 1 40%', minWidth:0 }}>
            <div style={{ position:'sticky', top:20 }}>
              <SummaryCard trip={trip} selectedSeats={[]} totalPrice={0} showSeats={false}/>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  // ── STEP 2: Choose seat ──────────────────────────────────
  return (
    <div style={{ background:'var(--surface-2)', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 820px) {
          .bk-grid { flex-direction: column !important; }
          .bk-left, .bk-right { width: 100% !important; flex: unset !important; }
        }
      `}</style>

      <div style={s.topBar}>
        <div style={s.topBarInner}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <button onClick={() => setBookStep(1)} style={s.backBtn}>←</button>
            <span style={{ fontSize:16, fontWeight:700, color:INK }}>Chọn ghế</span>
            <span style={{ marginLeft:'auto', fontSize:12, color:'#aaa' }}>
              ⏱ Sau khi đặt, bạn có 5 phút thanh toán
            </span>
          </div>
          <Stepper current={2}/>
        </div>
      </div>

      <div style={s.body}>
        <div className="bk-grid" style={s.grid}>

          <div className="bk-left" style={{ flex:'1 1 56%', minWidth:0 }}>
            <div style={s.card}>
              <div style={s.cardTitle}>Chọn ghế</div>
              <SeatMap
                totalSeats={bus.seatCount || 30}
                bookedSeats={bookedSeats}
                selectedSeats={selectedSeats}
                onToggle={toggleSeat}
              />
              {selectedSeats.length > 0 && (
                <div style={s.selectedBar}>
                  <span style={{ fontSize:13, color:'#555' }}>
                    Ghế đã chọn: <strong style={{ color:INK }}>{selectedSeats.slice().sort((a,b)=>a-b).join(', ')}</strong>
                  </span>
                  <strong style={{ color:P, fontSize:16 }}>{formatPrice(totalPrice)}</strong>
                </div>
              )}
            </div>

            <div style={{ ...s.card, padding:0, overflow:'hidden' }}>
              <div style={s.tabBar}>
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    ...s.tabBtn,
                    borderBottom: activeTab === tab.id ? `2px solid ${P}` : '2px solid transparent',
                    color:        activeTab === tab.id ? P : '#666',
                    fontWeight:   activeTab === tab.id ? 700 : 400,
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div style={{ padding:20 }}>

                {activeTab === 'features' && (
                  <div>
                    <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                      {bus.image && (
                        <img src={bus.image} alt={bus.name}
                          style={{ width:140, height:90, objectFit:'cover', borderRadius:8, flexShrink:0 }}
                          onError={e => e.target.style.display='none'}/>
                      )}
                      <table style={s.infoTable}>
                        <tbody>
                          <InfoRow label="Nhà xe"        value={bus.name || '—'}/>
                          <InfoRow label="Loại xe"       value={busTypeLbl || '—'}/>
                          <InfoRow label="Số ghế"        value={bus.seatCount ? `${bus.seatCount} chỗ` : '—'}/>
                          {bus.seatLayout && <InfoRow label="Sơ đồ ghế" value={bus.seatLayout}/>}
                          {bus.amenities?.length > 0 && (
                            <tr>
                              <td style={s.infoKey}>Tiện ích</td>
                              <td style={s.infoVal}>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                                  {bus.amenities.map(a => <span key={a} style={s.amenityBadge}>{a}</span>)}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {reviewCount > 0 && (
                      <div style={{ display:'flex', alignItems:'center', marginTop:14, paddingTop:14, borderTop:'1px solid #f0f0f0' }}>
                        <Stars rating={avgRating} size={16}/>
                        <span style={{ marginLeft:6, fontWeight:700 }}>{avgRating.toFixed(1)}</span>
                        <span style={{ marginLeft:4, color:'#888', fontSize:12 }}>({reviewCount} đánh giá)</span>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'route' && (
                  <div style={{ display:'flex', gap:32 }}>
                    <div style={{ flex:1 }}>
                      <div style={s.tlRow}>
                        <div style={s.dotP}/>
                        <div><div style={{ fontWeight:700 }}>{route.from}</div><div style={{ fontSize:12, color:'#888' }}>{depTime}</div></div>
                      </div>
                      <div style={s.tlLine}/>
                      <div style={s.tlRow}>
                        <div style={s.dotGreen}/>
                        <div><div style={{ fontWeight:700 }}>{route.to}</div><div style={{ fontSize:12, color:'#888' }}>{arrTime || 'Tùy chuyến'}</div></div>
                      </div>
                    </div>
                    <table style={{ ...s.infoTable, flex:1 }}>
                      <tbody>
                        {route.distance > 0 && <InfoRow label="Khoảng cách" value={`${route.distance} km`}/>}
                        {route.duration > 0 && (
                          <InfoRow label="Thời gian"
                            value={`${Math.floor(route.duration/60)>0?Math.floor(route.duration/60)+'h ':'' }${route.duration%60>0?route.duration%60+'p':''}`}/>
                        )}
                        <tr>
                          <td style={s.infoKey}>Giá / ghế</td>
                          <td style={{ ...s.infoVal, color:P, fontWeight:700 }}>{formatPrice(trip.price)}</td>
                        </tr>
                        {trip.salePercent > 0 && <InfoRow label="Khuyến mãi" value={`Giảm ${trip.salePercent}%`}/>}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  reviewsLoading ? (
                    <div style={{ textAlign:'center', padding:'24px 0', color:'#888' }}>Đang tải đánh giá...</div>
                  ) : !reviews || reviews.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'32px 0', color:'#aaa' }}>
                      <div style={{ fontSize:36, marginBottom:8 }}>⭐</div>
                      <div style={{ fontWeight:600, marginBottom:4 }}>Chưa có đánh giá nào</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display:'flex', alignItems:'center', marginBottom:14 }}>
                        <Stars rating={avgRating} size={18}/>
                        <span style={{ marginLeft:8, fontWeight:700, fontSize:16 }}>{avgRating.toFixed(1)}</span>
                        <span style={{ marginLeft:4, color:'#888', fontSize:13 }}>/ 5 · {reviewCount} đánh giá</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {reviews.map(rv => (
                          <div key={rv._id} style={s.reviewCard}>
                            <div style={{ display:'flex', gap:10 }}>
                              <div style={s.reviewAvatar}>{(rv.user?.name||'?')[0].toUpperCase()}</div>
                              <div style={{ flex:1 }}>
                                <div style={{ display:'flex', justifyContent:'space-between' }}>
                                  <span style={{ fontWeight:600, fontSize:13 }}>{rv.user?.name || 'Ẩn danh'}</span>
                                  <span style={{ fontSize:11, color:'#aaa' }}>{new Date(rv.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div style={{ margin:'3px 0' }}><Stars rating={rv.rating} size={13}/></div>
                                {rv.comment && <p style={{ margin:0, fontSize:12, color:'#555', lineHeight:1.5 }}>{rv.comment}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="bk-right" style={{ flex:'1 1 40%', minWidth:0 }}>
            <div style={{ position:'sticky', top:20 }}>
              <SummaryCard trip={trip} selectedSeats={selectedSeats} totalPrice={totalPrice} showSeats={true}/>

              <div style={{ ...s.card, marginBottom:14 }}>
                <div style={{ display:'flex', flexWrap:'wrap', gap:12, fontSize:12 }}>
                  {[
                    [{ background:'#C8D5E4' }, 'Đã đặt'],
                    [{ background:`${P}55`, border:`1px solid ${P}` }, 'Đang giữ'],
                    [{ background:P }, 'Đang chọn'],
                    [{ border:'1px solid #C8D5E4', background:'#fff' }, 'Còn trống'],
                  ].map(([st,label]) => (
                    <div key={label} style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <div style={{ width:14, height:14, borderRadius:3, ...st }}/>
                      <span style={{ color:'#888' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || selectedSeats.length === 0}
                style={{
                  ...s.primaryBtn,
                  width:'100%', fontSize:15, padding:14,
                  opacity:    selectedSeats.length === 0 ? .4 : 1,
                  cursor:     selectedSeats.length === 0 ? 'not-allowed' : 'pointer',
                  background: selectedSeats.length === 0 ? '#94a3b8' : P,
                  boxShadow:  selectedSeats.length === 0 ? 'none' : `0 4px 16px ${P}44`,
                }}>
                {loading ? '⏳ Đang xử lý...' : selectedSeats.length === 0 ? 'Chọn ghế để tiếp tục' : 'Tiếp tục thanh toán →'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <tr>
      <td style={{ padding:'5px 10px 5px 0', fontSize:12, color:'#888', whiteSpace:'nowrap', verticalAlign:'top' }}>{label}</td>
      <td style={{ padding:'5px 0', fontSize:13, color:INK, fontWeight:500 }}>{value}</td>
    </tr>
  );
}

const s = {
  center:    { display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', minHeight:'60vh', background:'var(--surface-2)', padding:24 },
  centerBox: { background:'#fff', padding:'40px 48px', borderRadius:16, textAlign:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.08)' },
  spinner:   { width:36, height:36, border:'3px solid #eee', borderTop:`3px solid ${P}`, borderRadius:'50%', animation:'spin 1s linear infinite' },
  primaryBtn:{ padding:'11px 28px', background:P, color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:`0 4px 14px ${P}44` },

  topBar:      { background:'#fff', borderBottom:'1px solid #C8D5E4', padding:'20px 24px' },
  topBarInner: { maxWidth:1000, margin:'0 auto' },
  backBtn:     { background:'none', border:'1px solid #C8D5E4', color:INK, padding:'6px 14px', borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:600 },

  body: { maxWidth:1000, margin:'0 auto', padding:'24px 16px' },
  grid: { display:'flex', gap:20, alignItems:'flex-start' },

  card:      { background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(11,31,58,0.06)', border:'1px solid #C8D5E4', marginBottom:14 },
  cardTitle: { fontSize:15, fontWeight:700, color:INK, margin:'0 0 16px' },

  selectedBar: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, padding:'10px 14px', background:`${P}0d`, borderRadius:8, border:`1px solid ${P}33` },

  tabBar: { display:'flex', borderBottom:'1px solid #C8D5E4', background:'#fafafa', padding:'0 4px' },
  tabBtn: { padding:'12px 16px', border:'none', background:'transparent', cursor:'pointer', fontSize:13, transition:'color .15s' },

  infoTable: { borderCollapse:'collapse', minWidth:160 },
  infoKey:   { padding:'5px 10px 5px 0', fontSize:12, color:'#888', whiteSpace:'nowrap', verticalAlign:'top' },
  infoVal:   { padding:'5px 0', fontSize:13, color:INK, fontWeight:500 },
  amenityBadge: { background:'#E3F1FA', color:P, borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:500 },

  tlRow:   { display:'flex', alignItems:'center', gap:12 },
  dotP:    { width:12, height:12, borderRadius:'50%', background:P, flexShrink:0, boxShadow:`0 0 0 3px ${P}33` },
  dotGreen:{ width:12, height:12, borderRadius:'50%', background:'#16A34A', flexShrink:0, boxShadow:'0 0 0 3px #16A34A33' },
  tlLine:  { width:2, height:24, background:'#C8D5E4', margin:'4px 0 4px 5px' },

  label:    { display:'block', fontSize:13, fontWeight:600, color:'#555', marginBottom:6, marginTop:6 },
  input:    { width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #C8D5E4', fontSize:14, background:'#fafafa', boxSizing:'border-box' },
  inputErr: { border:'1.5px solid #dc2626', background:'#fff5f5' },
  errMsg:   { fontSize:11, color:'#dc2626', marginTop:4 },

  reviewCard:   { background:'#fafafa', borderRadius:8, padding:'12px 14px', border:'1px solid #C8D5E4' },
  reviewAvatar: { width:32, height:32, borderRadius:'50%', background:P, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 },
};
