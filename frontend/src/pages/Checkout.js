import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getBooking, getWallet, getPoints, payWithWallet, createVnpayPayment, validateVoucher } from '../services/api';
import { formatPrice } from '../utils/format';
import { useToast } from '../components/Toast';
import { CheckoutPageSkeleton } from '../components/Skeleton';
import useSEO from '../hooks/useSEO';

const P   = '#1D7DB8';
const INK = '#0C1825';

const STEPS = ['Đặt', 'Chọn ghế', 'Thanh toán', 'Vé điện tử'];

function Countdown({ expiresAt, onExpired }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent,   setUrgent]   = useState(false);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) { setTimeLeft('Hết hạn'); onExpired?.(); return; }
      const m  = Math.floor(diff / 60000);
      const sc = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${sc.toString().padStart(2, '00')}`);
      setUrgent(diff < 90000);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [expiresAt, onExpired]);
  return (
    <span style={{
      fontWeight:800, fontSize:14,
      color:      urgent ? '#dc2626' : '#d97706',
      background: urgent ? '#fee2e2' : '#fef9c3',
      border:     `1.5px solid ${urgent ? '#fca5a5' : '#fde68a'}`,
      padding:'3px 10px', borderRadius:20, display:'inline-block',
    }}>
      {timeLeft}
    </span>
  );
}

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

export default function Checkout() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { addToast } = useToast();

  const [booking,         setBooking]       = useState(null);
  const [wallet,          setWallet]        = useState(null);
  const [points,          setPoints]        = useState(0);
  const [loading,         setLoading]       = useState(true);
  const [method,          setMethod]        = useState('fastpay');
  const [paying,          setPaying]        = useState(false);
  const [expired,         setExpired]       = useState(false);
  const [voucherInput,    setVoucherInput]  = useState('');
  const [voucher,         setVoucher]       = useState(null);
  const [voucherLoading,  setVoucherLoading]= useState(false);
  const [usePoints,       setUsePoints]     = useState(false);
  const [pointsInput,     setPointsInput]   = useState('');
  const [ticketData,      setTicketData]    = useState(null);

  useSEO({ title: 'Thanh toán — FASTBUS' });

  useEffect(() => {
    Promise.all([getBooking(id), getWallet(), getPoints()])
      .then(([bRes, wRes, pRes]) => {
        setBooking(bRes.data);
        setWallet(wRes.data);
        setPoints(pRes.data.points || 0);
        if (bRes.data.status !== 'pending' && bRes.data.status !== 'processing') setExpired(true);
      })
      .catch(() => navigate('/profile'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setVoucherLoading(true);
    try {
      const res = await validateVoucher({ code: voucherInput, amount: booking.totalPrice });
      setVoucher(res.data);
      addToast(`Áp dụng! −${formatPrice(res.data.discount)}`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Mã giảm giá', 'error');
      setVoucher(null);
    } finally { setVoucherLoading(false); }
  };

  const handleRemoveVoucher = () => { setVoucher(null); setVoucherInput(''); };

  const afterVoucher   = voucher ? voucher.finalPrice : booking?.totalPrice ?? 0;
  const maxPointsUse   = Math.floor(afterVoucher * 0.3);
  const parsedPoints   = Math.min(Math.max(0, Number(pointsInput) || 0), maxPointsUse, points);
  const pointsDiscount = usePoints ? parsedPoints : 0;
  const finalPrice     = Math.max(0, afterVoucher - pointsDiscount);
  const loyaltyEarned  = Math.floor(finalPrice * 0.01);

  const handlePay = async () => {
    setPaying(true);
    try {
      const vCode  = voucher ? voucher.voucher.code : undefined;
      const pToUse = usePoints ? parsedPoints : 0;
      if (method === 'fastpay') {
        const res = await payWithWallet(id, vCode, pToUse);
        setTicketData({ earnedPoints: res.data.earnedPoints || 0 });
      } else {
        const res = await createVnpayPayment(id, vCode, pToUse);
        window.location.href = res.data.payUrl;
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Thanh toán ngay', 'error');
      setPaying(false);
    }
  };

  if (loading) return <CheckoutPageSkeleton/>;

  if (expired || (booking?.status !== 'pending' && booking?.status !== 'processing')) return (
    <div style={s.center}>
      <div style={{ fontSize:56, marginBottom:16 }}>⏰</div>
      <h3 style={{ margin:'0 0 8px' }}>Đặt chỗ đã hết hạn</h3>
      <p style={{ color:'#888', margin:'0 0 20px' }}>Phiên đặt vé đã hết hạn. Vui lòng đặt lại.</p>
      <button onClick={() => navigate(-1)} style={s.primaryBtn}>← Đặt lại</button>
    </div>
  );

  const trip    = booking.trip;
  const dep     = new Date(trip?.departureTime);
  const arr     = trip?.arrivalTime ? new Date(trip.arrivalTime) : null;
  const depTime = dep.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
  const depDate = dep.toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  const arrTime = arr
    ? arr.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
    : trip?.route?.duration
      ? new Date(dep.getTime() + trip.route.duration * 60000).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
      : null;
  const enough   = wallet && wallet.balance >= finalPrice;
  const duration = trip?.route?.duration
    ? `${Math.floor(trip.route.duration/60)}h${trip.route.duration%60 ? trip.route.duration%60+'p' : ''}`
    : null;
  const bookRef  = ('FB' + booking._id.slice(-8)).toUpperCase();

  const busTypeLbl = { ghế:'Xe ghế', giường:'Xe giường', limousine:'Limousine' }[trip?.bus?.type] || trip?.bus?.type || '';

  // ── Inline e-ticket (FASTPAY success) ───────────────────
  if (ticketData !== null) return (
    <div style={{ background:'var(--surface-2)', minHeight:'100vh' }}>
      <style>{`
        @keyframes popIn  { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .tk-btn:hover { opacity:.88; transform:translateY(-1px); }
        .tk-btn { transition: opacity .15s, transform .15s; }
      `}</style>

      <div style={s.topBar}>
        <div style={s.topBarInner}>
          <Stepper current={4}/>
        </div>
      </div>

      <div style={{ maxWidth:520, margin:'32px auto', padding:'0 16px 60px' }}>
        <div style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 8px 40px rgba(11,31,58,0.12)', border:'1px solid #C8D5E4' }}>
          {/* Success header */}
          <div style={{ background:INK, padding:'32px 28px', textAlign:'center' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'#dcfce7', border:'3px solid #86efac', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', animation:'popIn .4s ease both' }}>
              <span style={{ fontSize:34, lineHeight:1 }}>✓</span>
            </div>
            <div style={{ animation:'fadeUp .35s ease .1s both' }}>
              <h2 style={{ color:'#fff', fontWeight:900, fontSize:22, margin:'0 0 6px' }}>Đặt vé thành công!</h2>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, margin:0 }}>Vé của bạn đã được xác nhận</p>
            </div>
          </div>

          {/* Booking code */}
          <div style={{ textAlign:'center', padding:'20px 28px', borderBottom:'1px solid #F0F0F0', animation:'fadeUp .35s ease .15s both' }}>
            <div style={{ display:'inline-block', background:'#E3F1FA', border:`1.5px solid ${P}44`, borderRadius:12, padding:'8px 22px' }}>
              <div style={{ fontSize:11, color:'#aaa', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Mã đặt vé</div>
              <div style={{ fontFamily:'monospace', fontWeight:900, fontSize:22, color:P, letterSpacing:3 }}>{bookRef}</div>
            </div>
          </div>

          {/* Route timeline */}
          <div style={{ padding:'20px 28px', borderBottom:'1px solid #F0F0F0', animation:'fadeUp .35s ease .2s both' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:P, flexShrink:0, boxShadow:`0 0 0 3px ${P}33` }}/>
              <div>
                <div style={{ fontWeight:800, fontSize:18, color:INK }}>{depTime}</div>
                <div style={{ fontSize:12, color:'#888' }}>{trip?.route?.from}</div>
              </div>
            </div>
            {duration && (
              <div style={{ display:'flex', alignItems:'center', margin:'4px 0 4px 4px', gap:8 }}>
                <div style={{ width:2, height:16, background:'#C8D5E4' }}/>
                <span style={{ fontSize:11, color:'#aaa' }}>⏱ {duration}</span>
              </div>
            )}
            {!duration && <div style={{ width:2, height:20, background:'#C8D5E4', margin:'4px 0 4px 4px' }}/>}
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'#16A34A', flexShrink:0, boxShadow:'0 0 0 3px #16A34A33' }}/>
              <div>
                <div style={{ fontWeight:800, fontSize:18, color:INK }}>{arrTime || '—'}</div>
                <div style={{ fontSize:12, color:'#888' }}>{trip?.route?.to}</div>
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div style={{ padding:'16px 28px', borderBottom:'1px solid #F0F0F0', animation:'fadeUp .35s ease .25s both' }}>
            {[
              ['Hành khách',  booking.passengerName],
              ['SĐT',         booking.passengerPhone],
              ['Ghế số',      (booking.seats||[]).slice().sort((a,b)=>a-b).join(', ')],
              ['Ngày đi',     depDate],
              ['Nhà xe',      trip?.bus?.name],
            ].map(([label, val]) => val ? (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px dashed #f0f0f0' }}>
                <span style={{ fontSize:13, color:'#888' }}>{label}</span>
                <span style={{ fontSize:13, fontWeight:600, color:INK }}>{val}</span>
              </div>
            ) : null)}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 4px', marginTop:4 }}>
              <span style={{ fontSize:14, fontWeight:700, color:INK }}>Tổng thanh toán</span>
              <span style={{ fontSize:20, fontWeight:900, color:P }}>{formatPrice(booking.totalPrice)}</span>
            </div>
          </div>

          {/* Points earned */}
          {ticketData.earnedPoints > 0 && (
            <div style={{ margin:'0 28px', padding:'10px 14px', background:'#fefce8', border:'1px solid #fde68a', borderRadius:10, textAlign:'center', animation:'fadeUp .35s ease .3s both' }}>
              <span style={{ fontSize:13, color:'#92400e', fontWeight:600 }}>
                ⭐ +{ticketData.earnedPoints.toLocaleString('vi-VN')} điểm thưởng đã được cộng vào tài khoản!
              </span>
            </div>
          )}

          {/* QR code */}
          <div style={{ padding:'20px 28px', textAlign:'center', animation:'fadeUp .35s ease .32s both' }}>
            <div style={{ display:'inline-block', padding:12, background:'#fff', border:'1.5px solid #C8D5E4', borderRadius:12 }}>
              <QRCodeSVG value={`FASTBUS:${booking._id}`} size={96} level="M" fgColor={INK} bgColor="transparent"/>
            </div>
            <div style={{ fontSize:11, color:'#aaa', marginTop:8 }}>Đưa mã QR cho nhân viên soát vé</div>
          </div>

          {/* Action buttons */}
          <div style={{ padding:'16px 28px 28px', display:'flex', flexDirection:'column', gap:10, animation:'fadeUp .35s ease .35s both' }}>
            <button className="tk-btn"
              onClick={() => navigate(`/ticket/${id}`)}
              style={{ padding:13, background:'#fff', color:P, border:`2px solid ${P}`, borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer' }}>
              Xem vé chi tiết
            </button>
            <button className="tk-btn"
              onClick={() => navigate('/')}
              style={{ padding:13, background:INK, color:'#fff', border:'none', borderRadius:12, fontWeight:700, fontSize:15, cursor:'pointer' }}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Payment page ─────────────────────────────────────────
  return (
    <div style={{ background:'var(--surface-2)', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .pay-method:hover { box-shadow: 0 2px 12px rgba(29,125,184,0.12); }
        @media (max-width: 768px) {
          .checkout-grid { flex-direction: column !important; }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div style={s.topBar}>
        <div style={s.topBarInner}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <button onClick={() => navigate(-1)} style={s.backBtn}>←</button>
            <span style={{ fontSize:16, fontWeight:700, color:INK }}>Thanh toán</span>
            {booking.expiresAt && (
              <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#888' }}>
                <span>⏱ Hoàn thành thanh toán trong</span>
                <Countdown expiresAt={booking.expiresAt} onExpired={() => setExpired(true)}/>
              </span>
            )}
          </div>
          <Stepper current={3}/>
        </div>
      </div>

      <div style={s.body}>
        <div className="checkout-grid" style={s.grid}>

          {/* ══ LEFT: payment form ══ */}
          <div style={{ flex:'1 1 0', minWidth:0 }}>

            {/* ── Passenger summary strip ── */}
            <div style={{ background:'#fff', borderRadius:14, border:'1px solid #C8D5E4', padding:'16px 20px', marginBottom:14, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:P, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:18, flexShrink:0 }}>
                {booking.passengerName?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15, color:INK }}>{booking.passengerName}</div>
                <div style={{ fontSize:12, color:'#888', marginTop:1 }}>{booking.passengerPhone}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {(booking.seats||[]).slice().sort((a,b)=>a-b).map(n => (
                  <span key={n} style={{ background:'#E3F1FA', color:P, border:`1px solid ${P}44`, borderRadius:8, padding:'3px 10px', fontSize:13, fontWeight:700 }}>
                    Ghế {n}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Discount section ── */}
            <div style={s.card}>
              {booking?.status === 'processing' && (
                <div style={{ background:'#fef9c3', border:'1px solid #fde047', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#713f12' }}>
                  ⚡ Tiếp tục thanh toán — giá đã bao gồm ưu đãi từ lần đặt trước.
                </div>
              )}
              {/* Voucher */}
              {booking?.status !== 'processing' && <div style={{ marginBottom: points > 0 ? 20 : 0 }}>
                <div style={s.sectionTitle}>🎟️ Mã giảm giá</div>
                {!voucher ? (
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      value={voucherInput}
                      onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleApplyVoucher()}
                      placeholder="Nhập mã voucher..."
                      style={s.input}
                    />
                    <button onClick={handleApplyVoucher} disabled={voucherLoading || !voucherInput.trim()}
                      style={{ ...s.applyBtn, opacity:(voucherLoading || !voucherInput.trim()) ? .5 : 1 }}>
                      {voucherLoading ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                ) : (
                  <div style={s.voucherApplied}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ background:'#dcfce7', color:'#16a34a', borderRadius:6, padding:'2px 8px', fontWeight:700, fontSize:12 }}>✓ ÁP DỤNG</span>
                      <span style={{ fontWeight:700, color:INK, fontSize:13 }}>{voucher.voucher.code}</span>
                      <span style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>−{formatPrice(voucher.discount)}</span>
                    </div>
                    <button onClick={handleRemoveVoucher} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>
                  </div>
                )}
              </div>}

              {/* Points */}
              {points > 0 && booking?.status !== 'processing' && (
                <div style={{ paddingTop:16, borderTop:'1px dashed #E8EDF4' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: usePoints ? 12 : 0 }}>
                    <div style={s.sectionTitle}>⭐ Dùng điểm thưởng
                      <span style={{ fontSize:12, fontWeight:500, color:'#888', marginLeft:6 }}>({points.toLocaleString('vi-VN')} điểm khả dụng)</span>
                    </div>
                    <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', userSelect:'none' }}>
                      <div style={{
                        width:38, height:22, borderRadius:11, background: usePoints ? P : '#C8D5E4',
                        position:'relative', transition:'background .2s', cursor:'pointer',
                        flexShrink:0,
                      }} onClick={() => { setUsePoints(v => !v); if (usePoints) setPointsInput(''); }}>
                        <div style={{
                          width:16, height:16, borderRadius:'50%', background:'#fff',
                          position:'absolute', top:3, left: usePoints ? 19 : 3, transition:'left .2s',
                          boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
                        }}/>
                      </div>
                      <span style={{ fontSize:13, color: usePoints ? P : '#888', fontWeight: usePoints ? 600 : 400 }}>
                        {usePoints ? 'Đang dùng' : 'Sử dụng'}
                      </span>
                    </label>
                  </div>
                  {usePoints && (
                    <div>
                      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                        <input type="number" min="0" max={maxPointsUse}
                          value={pointsInput}
                          onChange={e => setPointsInput(e.target.value)}
                          placeholder={`Tối đa ${maxPointsUse.toLocaleString('vi-VN')} điểm khả dụng (30%)`}
                          style={{ ...s.input, borderColor:'#a5b4fc' }}/>
                        <button onClick={() => setPointsInput(String(Math.min(maxPointsUse, points)))}
                          style={{ padding:'9px 14px', borderRadius:8, border:'none', background:'#6366f1', color:'#fff', fontWeight:700, fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
                          Tối đa
                        </button>
                      </div>
                      {parsedPoints > 0 && (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#eef2ff', border:'1.5px solid #a5b4fc', borderRadius:8, padding:'9px 14px' }}>
                          <span style={{ fontSize:13, color:'#4338ca', fontWeight:600 }}>⭐ {parsedPoints.toLocaleString('vi-VN')} điểm sẽ được trừ</span>
                          <span style={{ fontSize:14, color:'#16a34a', fontWeight:800 }}>−{formatPrice(parsedPoints)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Payment method ── */}
            <div style={s.card}>
              <div style={s.sectionTitle}>💳 Phương thức thanh toán</div>

              <div className="pay-method" onClick={() => setMethod('fastpay')} style={{
                ...s.methodCard,
                borderColor: method === 'fastpay' ? P : '#C8D5E4',
                background:  method === 'fastpay' ? '#E3F1FA' : '#fafafa',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ ...s.methodIcon, background: method==='fastpay' ? P : '#8EC6E8' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:INK }}>Ví FASTPAY</div>
                    <div style={{ fontSize:12, color:'#888', marginTop:2 }}>
                      Số dư:&nbsp;
                      <span style={{ fontWeight:700, color: enough ? '#16a34a' : '#dc2626' }}>
                        {wallet ? formatPrice(wallet.balance) : '—'}
                      </span>
                      {!enough && wallet && (
                        <span style={{ color:'#dc2626' }}>&nbsp;· thiếu {formatPrice(finalPrice - wallet.balance)}</span>
                      )}
                    </div>
                  </div>
                  <RadioDot active={method === 'fastpay'} color={P}/>
                </div>
                {method === 'fastpay' && !enough && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:'1px dashed #C8D5E4' }}>
                    <button type="button" onClick={e => { e.stopPropagation(); navigate('/profile'); }}
                      style={{ fontSize:13, padding:'7px 16px', borderRadius:8, border:`1.5px solid ${P}`, color:P, background:'#fff', cursor:'pointer', fontWeight:700 }}>
                      + Nạp tiền vào ví
                    </button>
                  </div>
                )}
              </div>

              <div className="pay-method" onClick={() => setMethod('vnpay')} style={{
                ...s.methodCard, marginTop:10,
                borderColor: method === 'vnpay' ? '#005baa' : '#C8D5E4',
                background:  method === 'vnpay' ? '#f0f7ff' : '#fafafa',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ ...s.methodIcon, background: method==='vnpay' ? '#005baa' : '#dbeafe', fontSize:15, fontWeight:900, color: method==='vnpay' ? '#fff' : '#005baa' }}>VN</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:INK }}>VNPay / Thẻ ngân hàng</div>
                    <div style={{ fontSize:12, color:'#888', marginTop:2 }}>ATM / Internet Banking / QR Code</div>
                  </div>
                  <RadioDot active={method === 'vnpay'} color="#005baa"/>
                </div>
              </div>

              {/* Price summary before pay */}
              <div style={{ margin:'20px 0 0', padding:'14px 16px', background:'#F7FAFD', borderRadius:10, border:'1px solid #E8EDF4' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: (voucher||pointsDiscount>0) ? 8 : 0 }}>
                  <span style={{ fontSize:13, color:'#888' }}>{`Giá vé (${booking.seats?.length} ghế)`}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:INK }}>{formatPrice(booking.totalPrice)}</span>
                </div>
                {voucher && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:13, color:'#16a34a' }}>Giảm voucher</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#16a34a' }}>−{formatPrice(voucher.discount)}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:13, color:'#6366f1' }}>Điểm thưởng</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#6366f1' }}>−{formatPrice(pointsDiscount)}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, paddingTop:10, borderTop:'1.5px dashed #C8D5E4' }}>
                  <span style={{ fontSize:15, fontWeight:700, color:INK }}>Tổng thanh toán</span>
                  <span style={{ fontSize:22, fontWeight:900, color:P }}>{formatPrice(finalPrice)}</span>
                </div>
                {loyaltyEarned >= 1 && (
                  <div style={{ marginTop:10, padding:'7px 12px', background:'#fefce8', border:'1px solid #fde68a', borderRadius:8, fontSize:12, color:'#92400e', display:'flex', alignItems:'center', gap:6 }}>
                    ⭐ <span>Nhận thêm <strong>+{loyaltyEarned.toLocaleString('vi-VN')}</strong> điểm sau khi thanh toán</span>
                  </div>
                )}
              </div>

              <button onClick={handlePay}
                disabled={paying || (method === 'fastpay' && !enough && finalPrice > 0)}
                style={{
                  ...s.payBtn, marginTop:14,
                  background: method === 'fastpay'
                    ? `linear-gradient(135deg,${P},#4AACE0)`
                    : 'linear-gradient(135deg,#005baa,#0070d1)',
                  boxShadow: method === 'fastpay'
                    ? `0 4px 18px ${P}55`
                    : '0 4px 18px rgba(0,91,170,0.35)',
                  opacity: (paying || (method === 'fastpay' && !enough)) ? .5 : 1,
                  cursor:  (paying || (method === 'fastpay' && !enough)) ? 'not-allowed' : 'pointer',
                }}>
                {paying
                  ? '⏳ Đang xử lý...'
                  : method === 'fastpay'
                    ? `💳 Thanh toán ${formatPrice(finalPrice)} — FASTPAY`
                    : `Thanh toán ${formatPrice(finalPrice)} — VNPay`}
              </button>
              <p style={{ fontSize:12, color:'#aaa', textAlign:'center', margin:'10px 0 0', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#aaa"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                Giao dịch được mã hoá SSL và bảo mật
              </p>
            </div>
          </div>

          {/* ══ RIGHT: trip summary ══ */}
          <div style={{ flex:'0 0 340px', minWidth:0 }}>
            <div style={s.summaryCard}>

              <div style={{ background:INK, padding:'18px 20px' }}>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, letterSpacing:1.5, textTransform:'uppercase', marginBottom:6 }}>Hành trình</div>
                <div style={{ color:'#fff', fontWeight:900, fontSize:16, marginBottom:8 }}>
                  {trip?.route?.from} → {trip?.route?.to}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ background:P, color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                    {trip?.bus?.name}
                  </span>
                  <span style={{ color:'rgba(255,255,255,0.5)', fontSize:11 }}>
                    {busTypeLbl}
                  </span>
                </div>
              </div>

              <div style={{ padding:'14px 20px', borderBottom:'1px solid #F0F0F0' }}>
                <div style={{ fontWeight:600, fontSize:13, color:'#555' }}>{depDate}</div>
              </div>

              <div style={{ padding:'16px 20px', borderBottom:'1px solid #F0F0F0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:P, flexShrink:0, boxShadow:`0 0 0 3px ${P}33` }}/>
                  <div>
                    <div style={{ fontWeight:800, fontSize:20, color:INK }}>{depTime}</div>
                    <div style={{ fontSize:12, color:'#888' }}>{trip?.route?.from}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', margin:'2px 0 2px 4px', gap:8 }}>
                  <div style={{ width:2, height:20, background:'#C8D5E4' }}/>
                  {duration && <span style={{ fontSize:11, color:'#aaa' }}>⏱ {duration}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:'#16A34A', flexShrink:0, boxShadow:'0 0 0 3px #16A34A33' }}/>
                  <div>
                    <div style={{ fontWeight:800, fontSize:20, color:INK }}>{arrTime || '—'}</div>
                    <div style={{ fontSize:12, color:'#888' }}>{trip?.route?.to}</div>
                  </div>
                </div>
              </div>

              <div style={{ padding:'14px 20px', borderBottom:'1px solid #F0F0F0' }}>
                {[
                  ['Hành khách', booking.passengerName],
                  ['SĐT',        booking.passengerPhone],
                  ['Ghế số',     booking.seats?.slice().sort((a,b)=>a-b).join(', ')],
                ].map(([label, val]) => (
                  <div key={label} style={s.infoRow}>
                    <span style={{ fontSize:13, color:'#888' }}>{label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:INK }}>{val}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding:'14px 20px' }}>
                {[['🚫', 'Không đổi lịch', 'Không thể thay đổi sau khi đặt'],['↩️', 'Hoàn tiền theo chính sách', 'Xem chi tiết tại trang chính sách hoàn vé']].map(([icon,title,sub]) => (
                  <div key={title} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
                    <span style={{ fontSize:15 }}>{icon}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:'#dc2626' }}>{title}</div>
                      <div style={{ fontSize:11, color:'#aaa' }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function RadioDot({ active, color }) {
  return (
    <div style={{
      width:20, height:20, borderRadius:'50%', flexShrink:0,
      border: `2px solid ${active ? color : '#ccc'}`,
      background: active ? color : '#fff',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {active && <span style={{ color:'#fff', fontSize:11, fontWeight:900 }}>✓</span>}
    </div>
  );
}

const s = {
  center:    { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', padding:24 },
  spinner:   { width:36, height:36, border:'3px solid #eee', borderTop:`3px solid ${P}`, borderRadius:'50%', animation:'spin 1s linear infinite' },
  primaryBtn:{ padding:'10px 24px', background:P, color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:`0 4px 14px ${P}44` },

  topBar:      { background:'#fff', borderBottom:'1px solid #C8D5E4', padding:'20px 24px' },
  topBarInner: { maxWidth:1000, margin:'0 auto' },
  backBtn:     { background:'none', border:'1px solid #C8D5E4', color:INK, padding:'6px 14px', borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:600 },

  body: { maxWidth:1000, margin:'0 auto', padding:'24px 16px' },
  grid: { display:'flex', gap:20, alignItems:'flex-start' },

  card:         { background:'#fff', borderRadius:14, padding:20, boxShadow:'0 2px 10px rgba(11,31,58,0.06)', border:'1px solid #C8D5E4', marginBottom:14 },
  sectionTitle: { fontWeight:700, fontSize:14, color:INK, marginBottom:12 },

  input:      { flex:1, padding:'9px 12px', borderRadius:8, border:'1.5px solid #C8D5E4', fontSize:13, outline:'none', textTransform:'uppercase', width:'100%', boxSizing:'border-box' },
  applyBtn:   { padding:'9px 16px', borderRadius:8, border:'none', background:P, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' },
  voucherApplied: { display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f0fdf4', border:'1.5px solid #86efac', borderRadius:8, padding:'8px 12px' },

  methodCard: { border:'2px solid', borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all .15s' },
  methodIcon: { width:44, height:44, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  payBtn:     { width:'100%', padding:14, border:'none', borderRadius:10, color:'#fff', fontWeight:800, fontSize:15 },

  summaryCard: { background:'#fff', borderRadius:14, boxShadow:'0 2px 10px rgba(11,31,58,0.06)', border:'1px solid #C8D5E4', overflow:'hidden', position:'sticky', top:20 },
  infoRow:     { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0' },
};
