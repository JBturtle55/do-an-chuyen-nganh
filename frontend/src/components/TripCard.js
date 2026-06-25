import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/format';
import { getTripReviews } from '../services/api';

const P    = '#1D7DB8';
const INK  = '#0C1825';
const INK2 = '#1C3351';
const MUTED = '#5E7A96';
const LINE  = '#C8D5E4';
const SUCCESS = '#16A34A';

function Stars({ rating, size = 13 }) {
  return (
    <>
      {Array.from({length:5}, (_,i) => (
        <span key={i} style={{ color: i < Math.round(rating) ? '#F59E0B' : '#C8D5E4', fontSize:size }}>★</span>
      ))}
    </>
  );
}

function AmenityIcon({ a }) {
  const map = { wifi:'📶', water:'💧', blanket:'🛏', usb:'🔌', tv:'📺', ac:'❄️' };
  const label = { wifi:'WiFi', water:'Nước', blanket:'Chăn', usb:'USB', tv:'TV', ac:'Điều hòa' };
  const key = a.toLowerCase().replace(/\s/g,'').replace('điềuhòa','ac').replace('máyđiềuhòa','ac')
                .replace('wifi','wifi').replace('usb','usb').replace('nướcuống','water')
                .replace('tv','tv').replace('chăn','blanket');
  const icon = map[key] || '✓';
  const name = label[key] || a;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:11, fontWeight:600,
      color:MUTED, background:'var(--surface-2)', padding:'2px 8px', borderRadius:20,
    }}>
      <span style={{ fontSize:10 }}>{icon}</span> {name}
    </span>
  );
}

export default function TripCard({ trip }) {
  const navigate = useNavigate();
  const [hovered, setHovered]     = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [reviews, setReviews]     = useState(null);
  const [revLoading, setRevLoading] = useState(false);

  const dep     = new Date(trip.departureTime);
  const arr     = trip.arrivalTime ? new Date(trip.arrivalTime)
    : trip.route?.duration ? new Date(dep.getTime() + trip.route.duration * 60000) : null;
  const now     = new Date();
  const isOnSale = trip.salePercent > 0 && (!trip.saleEndsAt || now < new Date(trip.saleEndsAt));
  const price   = isOnSale ? Math.round(trip.price * (1 - trip.salePercent / 100)) : trip.price;

  const depTime = dep.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
  const arrTime = arr ? arr.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }) : null;

  const durationMin = trip.route?.duration;
  const durationStr = durationMin
    ? `${Math.floor(durationMin/60)}h${durationMin%60 ? durationMin%60+'p' : ''}`
    : arr ? (() => {
        const m = Math.round((arr - dep) / 60000);
        return `${Math.floor(m/60)}h${m%60 ? m%60+'p':''}`;
      })() : null;

  const bus     = trip.bus     || {};
  const route   = trip.route   || {};
  const SEAT_TYPE = { ghế: 'Xe ghế', giường: 'Xe giường', limousine: 'Limousine' };
  const busTypeLbl = SEAT_TYPE[bus.type] || bus.type || '';
  const seatsLeft  = trip.availableSeats ?? 0;
  const reviewCount = Number(bus.reviewCount) || 0;
  const avgRating   = Number(bus.avgRating)   || 0;

  const TABS = [
    { id:'features', label: 'Đặc trưng' },
    { id:'route',    label: 'Tuyến đường' },
    { id:'reviews',  label: `Đánh giá${reviewCount > 0 ? ` (${reviewCount})` : ''}` },
  ];

  const handleTab = (tabId) => {
    if (activeTab === tabId) { setActiveTab(null); return; }
    setActiveTab(tabId);
    if (tabId === 'reviews' && reviews === null) {
      setRevLoading(true);
      getTripReviews(trip._id)
        .then(r => setReviews(r.data))
        .catch(() => setReviews([]))
        .finally(() => setRevLoading(false));
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:'#fff',
        border:`1px solid ${hovered ? 'var(--primary-border)' : LINE}`,
        borderRadius:16,
        boxShadow: hovered ? '0 8px 28px rgba(11,31,58,0.10)' : '0 1px 4px rgba(11,31,58,0.05)',
        transition:'all .15s',
        overflow:'hidden',
      }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .tc-tab:hover { color: ${P} !important; }
      `}</style>

      {/* ── MAIN ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 1fr 190px', gap:20, padding:'18px 20px', alignItems:'center' }}>

        {/* Operator */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'var(--primary-soft)',
              color:P, display:'grid', placeItems:'center', fontSize:15, fontWeight:800, flexShrink:0,
            }}>
              {(bus.name||'?')[0]}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:INK }}>{bus.name || '—'}</div>
              {reviewCount > 0 && (
                <div style={{ fontSize:11, color:MUTED, fontWeight:600, display:'flex', alignItems:'center', gap:3 }}>
                  <span style={{ color:'#F59E0B' }}>★</span>
                  {avgRating.toFixed(1)} · {reviewCount >= 1000 ? (reviewCount/1000).toFixed(1)+'k' : reviewCount} đánh giá
                </div>
              )}
            </div>
          </div>
          {isOnSale && (
            <span style={{ display:'inline-block', fontSize:10, fontWeight:800, padding:'2px 7px',
              borderRadius:4, letterSpacing:'0.05em', background:'#FEE2E2', color:'#DC2626',
            }}>SALE -{trip.salePercent}%</span>
          )}
        </div>

        {/* Times */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div>
              <div style={{ fontSize:24, fontWeight:800, color:INK, letterSpacing:'-0.02em' }}>{depTime}</div>
              <div style={{ fontSize:11, color:MUTED, fontWeight:600, marginTop:2 }}>{route.from || '—'}</div>
            </div>
            <div style={{ flex:1, minWidth:50 }}>
              <div style={{ height:1, background:LINE, position:'relative' }}>
                <span style={{ position:'absolute', top:-4, left:-3, width:8, height:8, borderRadius:'50%', background:P }}/>
                <span style={{ position:'absolute', top:-4, right:-3, width:8, height:8, borderRadius:'50%', background:SUCCESS }}/>
              </div>
              {durationStr && (
                <div style={{ textAlign:'center', fontSize:11, color:MUTED, fontWeight:700, marginTop:5 }}>
                  {durationStr}
                </div>
              )}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:24, fontWeight:800, color:INK, letterSpacing:'-0.02em' }}>{arrTime || '—'}</div>
              <div style={{ fontSize:11, color:MUTED, fontWeight:600, marginTop:2 }}>{route.to || '—'}</div>
            </div>
          </div>
        </div>

        {/* Bus type + amenities + seats */}
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:INK2, marginBottom:6 }}>
            {busTypeLbl}{bus.seatCount ? ` · ${bus.seatCount} ghế` : ''}
          </div>
          {bus.amenities?.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
              {bus.amenities.slice(0,4).map(a => <AmenityIcon key={a} a={a}/>)}
            </div>
          )}
          <div style={{ fontSize:11, fontWeight:700,
            color: seatsLeft < 10 ? '#DC2626' : MUTED,
          }}>
            {seatsLeft < 10 && seatsLeft > 0
              ? `⚠ ${seatsLeft} còn`
              : seatsLeft === 0
                ? `✗ Hết chỗ`
                : `${seatsLeft} ghế còn`}
          </div>
        </div>

        {/* Price + CTA */}
        <div style={{ textAlign:'right' }}>
          {isOnSale && (
            <div style={{ fontSize:12, color:MUTED, textDecoration:'line-through' }}>
              {formatPrice(trip.price)}
            </div>
          )}
          <div style={{ fontSize:24, fontWeight:800, color:P, letterSpacing:'-0.02em', lineHeight:1.1 }}>
            {formatPrice(price)}
          </div>
          <div style={{ fontSize:11, color:MUTED, marginBottom:10 }}>/ ghế</div>
          <button
            onClick={() => navigate(`/booking/${trip._id}`)}
            disabled={seatsLeft === 0}
            style={{
              padding:'9px 20px', background: seatsLeft === 0 ? '#e2e8f0' : P,
              color: seatsLeft === 0 ? '#999' : '#fff',
              border:'none', borderRadius:10, fontWeight:800, fontSize:13,
              cursor: seatsLeft === 0 ? 'not-allowed' : 'pointer',
              boxShadow: seatsLeft === 0 ? 'none' : '0 4px 12px rgba(255,107,53,0.30)',
              transition:'all .12s',
              width:'100%',
            }}
            onMouseEnter={e => { if(seatsLeft>0){ e.currentTarget.style.boxShadow='0 6px 18px rgba(255,107,53,0.45)'; e.currentTarget.style.transform='translateY(-1px)'; }}}
            onMouseLeave={e => { e.currentTarget.style.boxShadow=seatsLeft>0?'0 4px 12px rgba(255,107,53,0.30)':'none'; e.currentTarget.style.transform=''; }}
          >
            {seatsLeft === 0 ? 'Hết chỗ' : 'Đặt vé →'}
          </button>
        </div>
      </div>

      {/* ── TAB ROW ── */}
      <div style={{ borderTop:`1px solid ${LINE}`, background:'var(--surface-2)',
        display:'flex', padding:'0 20px',
      }}>
        {TABS.map(tab => (
          <button key={tab.id} className="tc-tab"
            onClick={() => handleTab(tab.id)}
            style={{
              padding:'10px 14px', border:'none', background:'transparent', cursor:'pointer',
              fontSize:12, fontWeight:activeTab===tab.id ? 700 : 600,
              color: activeTab===tab.id ? P : MUTED,
              borderBottom: activeTab===tab.id ? `2px solid ${P}` : '2px solid transparent',
              transition:'color .12s',
            }}>
            {tab.label} {activeTab===tab.id ? '▲' : '▼'}
          </button>
        ))}
      </div>

      {/* ── DROPDOWN PANEL ── */}
      {activeTab && (
        <div style={{ padding:'18px 20px', borderTop:`1px solid ${LINE}` }}>

          {/* Đặc trưng */}
          {activeTab === 'features' && (
            <div>
              <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                {bus.image && (
                  <img src={bus.image} alt={bus.name}
                    style={{ width:120, height:76, objectFit:'cover', borderRadius:10, flexShrink:0 }}
                    onError={e => e.target.style.display='none'}/>
                )}
                <table style={{ borderCollapse:'collapse', flex:1 }}>
                  <tbody>
                    {[
                      ['Nhà xe',     bus.name || '—'],
                      ['Loại xe',    busTypeLbl || '—'],
                      ['Số ghế',     bus.seatCount ? `${bus.seatCount} ghế` : '—'],
                      ...(bus.seatLayout ? [['Sơ đồ ghế', bus.seatLayout]] : []),
                    ].map(([l,v]) => (
                      <tr key={l}>
                        <td style={{ padding:'4px 12px 4px 0', fontSize:12, color:MUTED, whiteSpace:'nowrap', verticalAlign:'top' }}>{l}</td>
                        <td style={{ padding:'4px 0', fontSize:13, color:INK, fontWeight:600 }}>{v}</td>
                      </tr>
                    ))}
                    {bus.amenities?.length > 0 && (
                      <tr>
                        <td style={{ padding:'4px 12px 4px 0', fontSize:12, color:MUTED, verticalAlign:'top' }}>Tiện ích</td>
                        <td style={{ padding:'4px 0' }}>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                            {bus.amenities.map(a => <AmenityIcon key={a} a={a}/>)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {reviewCount > 0 && (
                <div style={{ display:'flex', alignItems:'center', marginTop:12, paddingTop:12, borderTop:`1px solid ${LINE}` }}>
                  <Stars rating={avgRating} size={15}/>
                  <span style={{ marginLeft:6, fontWeight:700 }}>{avgRating.toFixed(1)}</span>
                  <span style={{ marginLeft:4, color:MUTED, fontSize:12 }}>({reviewCount} đánh giá)</span>
                </div>
              )}
            </div>
          )}

          {/* Tuyến đường */}
          {activeTab === 'route' && (
            <div style={{ display:'flex', gap:32 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:P, flexShrink:0, boxShadow:`0 0 0 3px var(--primary-soft)` }}/>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:INK }}>{route.from || '—'}</div>
                    <div style={{ fontSize:12, color:MUTED }}>{depTime}</div>
                  </div>
                </div>
                <div style={{ width:1, height:28, background:LINE, margin:'0 0 8px 4px' }}/>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:SUCCESS, flexShrink:0, boxShadow:`0 0 0 3px #dcfce7` }}/>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14, color:INK }}>{route.to || '—'}</div>
                    <div style={{ fontSize:12, color:MUTED }}>{arrTime || 'Tùy chuyến'}</div>
                  </div>
                </div>
              </div>
              <table style={{ borderCollapse:'collapse', flex:1 }}>
                <tbody>
                  {route.distance > 0 && (
                    <tr><td style={{ padding:'4px 12px 4px 0', fontSize:12, color:MUTED }}>Khoảng cách</td>
                        <td style={{ fontSize:13, fontWeight:600, color:INK }}>{route.distance} km</td></tr>
                  )}
                  {route.duration > 0 && (
                    <tr><td style={{ padding:'4px 12px 4px 0', fontSize:12, color:MUTED }}>Thời gian</td>
                        <td style={{ fontSize:13, fontWeight:600, color:INK }}>{durationStr}</td></tr>
                  )}
                  <tr><td style={{ padding:'4px 12px 4px 0', fontSize:12, color:MUTED }}>Giá/ghế</td>
                      <td style={{ fontSize:14, fontWeight:800, color:P }}>{formatPrice(price)}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Đánh giá */}
          {activeTab === 'reviews' && (
            revLoading ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:MUTED }}>
                <div style={{ width:20, height:20, border:`2px solid ${LINE}`, borderTop:`2px solid ${P}`, borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 8px' }}/>
                Đang tải...
              </div>
            ) : !reviews || reviews.length === 0 ? (
              <div style={{ textAlign:'center', padding:'28px 0', color:MUTED }}>
                <div style={{ fontSize:32, marginBottom:8 }}>⭐</div>
                <div style={{ fontWeight:600, fontSize:13 }}>Chưa có đánh giá</div>
              </div>
            ) : (
              <div>
                <div style={{ display:'flex', alignItems:'center', marginBottom:14 }}>
                  <Stars rating={avgRating} size={16}/>
                  <span style={{ marginLeft:6, fontWeight:800, fontSize:15 }}>{avgRating.toFixed(1)}</span>
                  <span style={{ marginLeft:4, color:MUTED, fontSize:12 }}>/ 5 · {reviewCount} đánh giá</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {reviews.map(rv => (
                    <div key={rv._id} style={{ background:'var(--surface-2)', borderRadius:10, padding:'12px 14px', border:`1px solid ${LINE}` }}>
                      <div style={{ display:'flex', gap:10 }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:P, color:'#fff',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontWeight:700, fontSize:12, flexShrink:0,
                        }}>
                          {(rv.user?.name||'?')[0].toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', justifyContent:'space-between' }}>
                            <span style={{ fontWeight:700, fontSize:13, color:INK }}>{rv.user?.name || 'Ẩn danh'}</span>
                            <span style={{ fontSize:11, color:MUTED }}>{new Date(rv.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div style={{ margin:'3px 0' }}><Stars rating={rv.rating}/></div>
                          {rv.comment && <p style={{ margin:0, fontSize:12, color:INK2, lineHeight:1.6 }}>{rv.comment}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
