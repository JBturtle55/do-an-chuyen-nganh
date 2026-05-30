import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getTrips, getCities } from '../services/api';
import TripCard from '../components/TripCard';
import { TripCardSkeleton } from '../components/Skeleton';
import useSEO from '../hooks/useSEO';

const P    = '#1D7DB8';
const INK  = '#0C1825';
const MUTED = '#5E7A96';

const BANNERS = [
  { id:1, bg:'linear-gradient(135deg, #0C1825 0%, #1C3351 50%, #1D7DB8 100%)',
    img:'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=700&q=80',
    tag: 'TUẦN LỄ ƯU ĐÃI', tagColor:'#D4A020',
    title: 'Giảm đến 30%', sub: 'Cho lần đặt vé đầu tiên trên FASTBUS' },
  { id:2, bg:'linear-gradient(135deg, #0f2920 0%, #145c38 50%, #16a34a 100%)',
    img:'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=700&q=80',
    tag: 'DEAL CUỐI TUẦN', tagColor:'#16A34A',
    title: 'Combo tiết kiệm', sub: 'Đặt 2 vé cùng chuyến, giảm thêm 20%' },
  { id:3, bg:'linear-gradient(135deg, #1a0535 0%, #3b0f6e 50%, #7c3aed 100%)',
    img:'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=700&q=80',
    tag: 'THÀNH VIÊN MỚI', tagColor:'#7c3aed',
    title: '+500 điểm thưởng', sub: 'Khi đăng ký tài khoản FASTBUS miễn phí' },
];



function isoDate(d) { return d.toISOString().split('T')[0]; }
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

/* ── Search bar (Traveloka style) ─────────────────────────────── */
function SearchBar({ localFrom, setLocalFrom, localTo, setLocalTo, localDate, setLocalDate,
                     passengers, setPassengers, today, searched, goToDate, onSearch, cities }) {
  const [fromInput, setFromInput] = useState(localFrom);
  const [toInput,   setToInput]   = useState(localTo);
  const [fromOpen,  setFromOpen]  = useState(false);
  const [toOpen,    setToOpen]    = useState(false);

  const swap = () => {
    const tmpVal = localFrom; const tmpInput = fromInput;
    setLocalFrom(localTo); setFromInput(toInput);
    setLocalTo(tmpVal);    setToInput(tmpInput);
  };

  return (
    <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', overflow:'visible' }}>
      <style>{`
        .sb-sel:focus { outline:none; }
        .sb-box:focus-within { border-color:${P}!important; box-shadow:0 0 0 3px ${P}22!important; }
        .sb-swap:hover { transform:rotate(180deg) scale(1.1)!important; }
        .sb-swap { transition: transform .25s!important; }
        .sb-go:hover { opacity:.88!important; transform:translateY(-1px)!important; }
        .sb-go { transition: opacity .15s, transform .15s!important; }
        .sb-city-drop { position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid #E0E7EF;border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,0.12);z-index:200;max-height:220px;overflow-y:auto; }
        .sb-city-opt:hover { background:${P}18!important; color:${P}!important; }
      `}</style>

      <div style={{ padding:'18px 22px 22px' }}>
        {/* title */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <path d="M16 8h4l3 4v4h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <span style={{ fontSize:16, fontWeight:800, color:INK, letterSpacing:'-0.02em' }}>{'Xe khách liên tỉnh'}</span>
        </div>

        {/* fields row */}
        <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>

          {/* From */}
          <div style={{ flex:'1 1 170px', minWidth:130, position:'relative' }}>
            <div style={s.label2}>{'Từ'}</div>
            <div style={{ position:'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"
                style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', flexShrink:0, pointerEvents:'none' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <input type="text" value={fromInput}
                onChange={e => { setFromInput(e.target.value); setFromOpen(true); }}
                onFocus={e => { e.target.style.borderColor = P; setFromInput(''); setFromOpen(true); }}
                onBlur={e => { e.target.style.borderColor = '#E0E7EF'; setTimeout(() => { setFromOpen(false); setFromInput(localFrom); }, 150); }}
                placeholder="Nhập tên thành phố..."
                style={{ width:'100%', border:'1.5px solid #E0E7EF', borderRadius:10,
                  padding:'10px 12px 10px 32px', fontSize:14, color:INK, fontWeight:500,
                  background:'#fafbfc', outline:'none', boxSizing:'border-box', fontFamily:'inherit',
                }}
              />
            </div>
            {fromOpen && (
              <div className="sb-city-drop">
                {cities.filter(c => !fromInput || c.toLowerCase().includes(fromInput.toLowerCase()))
                  .map(c => (
                    <div key={c} className="sb-city-opt"
                      onMouseDown={() => { setLocalFrom(c); setFromInput(c); setFromOpen(false); }}
                      style={{ padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer',
                        background: localFrom===c ? P+'18' : '#fff',
                        color: localFrom===c ? P : INK,
                      }}>
                      {c}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Swap */}
          <div style={{ display:'flex', flexDirection:'column', flexShrink:0 }}>
            <div style={{ height:22 }}/>
            <button className="sb-swap" onClick={swap} style={{
              width:36, height:36, borderRadius:'50%', border:'none',
              background:P, color:'#fff', fontSize:16, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:`0 4px 12px ${P}55`,
            }}>⇄</button>
          </div>

          {/* To */}
          <div style={{ flex:'1 1 170px', minWidth:130, position:'relative' }}>
            <div style={s.label2}>{'Đến'}</div>
            <div style={{ position:'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"
                style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', flexShrink:0, pointerEvents:'none' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <input type="text" value={toInput}
                onChange={e => { setToInput(e.target.value); setToOpen(true); }}
                onFocus={e => { e.target.style.borderColor = P; setToInput(''); setToOpen(true); }}
                onBlur={e => { e.target.style.borderColor = '#E0E7EF'; setTimeout(() => { setToOpen(false); setToInput(localTo); }, 150); }}
                placeholder="Nhập tên thành phố..."
                style={{ width:'100%', border:'1.5px solid #E0E7EF', borderRadius:10,
                  padding:'10px 12px 10px 32px', fontSize:14, color:INK, fontWeight:500,
                  background:'#fafbfc', outline:'none', boxSizing:'border-box', fontFamily:'inherit',
                }}
              />
            </div>
            {toOpen && (
              <div className="sb-city-drop">
                {cities.filter(c => !toInput || c.toLowerCase().includes(toInput.toLowerCase()))
                  .map(c => (
                    <div key={c} className="sb-city-opt"
                      onMouseDown={() => { setLocalTo(c); setToInput(c); setToOpen(false); }}
                      style={{ padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer',
                        background: localTo===c ? P+'18' : '#fff',
                        color: localTo===c ? P : INK,
                      }}>
                      {c}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div style={{ flex:'1 1 155px', minWidth:120 }}>
            <div style={s.label2}>{'Ngày đi'}</div>
            <div className="sb-box" style={s.inputBox}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" style={{flexShrink:0}}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input type="date" value={localDate} min={today} className="sb-sel"
                onChange={e => { if (!e.target.value) return; setLocalDate(e.target.value); if (searched) goToDate(e.target.value); }}
                style={{ flex:1, border:'none', background:'transparent', fontSize:14, color:INK, fontWeight:500, outline:'none', cursor:'pointer', minWidth:0, fontFamily:'inherit' }}
              />
            </div>
          </div>

          {/* Passengers */}
          <div style={{ flex:'0 0 128px' }}>
            <div style={s.label2}>{'Hành khách'}</div>
            <div className="sb-box" style={{ ...s.inputBox, gap:0, padding:'10px 4px 10px 10px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={MUTED} style={{flexShrink:0}}>
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
              <button onClick={() => setPassengers(p => Math.max(1, p-1))} style={{ ...s.stepBtn, padding:'0 6px' }}>−</button>
              <span style={{ fontSize:14, fontWeight:700, color:INK, minWidth:20, textAlign:'center' }}>{passengers}</span>
              <button onClick={() => setPassengers(p => Math.min(10, p+1))} style={{ ...s.stepBtn, padding:'0 6px' }}>+</button>
            </div>
          </div>

          {/* Search button */}
          <div style={{ display:'flex', flexDirection:'column', flexShrink:0 }}>
            <div style={{ height:22 }}/>
            <button className="sb-go" onClick={onSearch} style={{
              padding:'11px 26px', background:P, color:'#fff', border:'none', borderRadius:10,
              fontSize:15, fontWeight:800, cursor:'pointer',
              display:'flex', alignItems:'center', gap:8,
              boxShadow:`0 4px 16px ${P}44`,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              {'Tìm chuyến'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Filter sidebar ────────────────────────────────────────────── */
function FilterSidebar({ busNames, filterBus, setFilterBus, sortBy, setSortBy, onlyAvail, setOnlyAvail, onlySale, setOnlySale, hasFilter, clearFilters, count, total }) {
  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #C8D5E4', overflow:'hidden', boxShadow:'0 2px 12px rgba(11,31,58,0.06)', position:'sticky', top:20 }}>

      {/* header */}
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #C8D5E4', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontWeight:800, fontSize:14, color:INK }}>{'Sắp xếp'}</span>
        {hasFilter && (
          <button onClick={clearFilters} style={{ fontSize:12, color:P, background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>
            {'Huỷ'}
          </button>
        )}
      </div>

      {/* sort */}
      <div style={{ padding:'16px 18px', borderBottom:'1px solid #C8D5E4' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#888', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>{'Sắp xếp'}</div>
        {[
          ['time',       'Giờ khởi hành'],
          ['price-asc',  'Giá thấp nhất'],
          ['price-desc', 'Đánh giá cao nhất'],
          ['seats',      'Loại xe'],
        ].map(([val, label]) => (
          <label key={val} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', cursor:'pointer' }}>
            <div onClick={() => setSortBy(val)}
              style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${sortBy===val ? P : '#D1D5DB'}`, background: sortBy===val ? P : '#fff', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all .12s' }}>
              {sortBy===val && <div style={{ width:6, height:6, borderRadius:'50%', background:'#fff' }}/>}
            </div>
            <span onClick={() => setSortBy(val)} style={{ fontSize:13, color: sortBy===val ? INK : '#555', fontWeight: sortBy===val ? 600 : 400 }}>
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* quick filters */}
      <div style={{ padding:'16px 18px', borderBottom: busNames.length > 0 ? '1px solid #C8D5E4' : 'none' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#888', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>{'Giờ đi'}</div>
        {[
          [onlyAvail, setOnlyAvail, 'Tất cả'],
          [onlySale,  setOnlySale,  '🔥 Flash Sale'],
        ].map(([val, setter, label]) => (
          <label key={label} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', cursor:'pointer' }} onClick={() => setter(v => !v)}>
            <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${val ? P : '#D1D5DB'}`, background: val ? P : '#fff', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .12s' }}>
              {val && <span style={{ color:'#fff', fontSize:11, fontWeight:900, lineHeight:1 }}>✓</span>}
            </div>
            <span style={{ fontSize:13, color: val ? INK : '#555', fontWeight: val ? 600 : 400 }}>{label}</span>
          </label>
        ))}
      </div>

      {/* bus operator filter */}
      {busNames.length > 0 && (
        <div style={{ padding:'16px 18px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#888', letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>{'Loại xe'}</div>
          <label style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', cursor:'pointer' }} onClick={() => setFilterBus('')}>
            <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${filterBus==='' ? P : '#D1D5DB'}`, background: filterBus==='' ? P : '#fff', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .12s' }}>
              {filterBus==='' && <span style={{ color:'#fff', fontSize:11, fontWeight:900, lineHeight:1 }}>✓</span>}
            </div>
            <span style={{ fontSize:13, color: filterBus==='' ? INK : '#555', fontWeight: filterBus==='' ? 600 : 400 }}>{'Tất cả'}</span>
          </label>
          {busNames.map(name => (
            <label key={name} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', cursor:'pointer' }} onClick={() => setFilterBus(name)}>
              <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${filterBus===name ? P : '#D1D5DB'}`, background: filterBus===name ? P : '#fff', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .12s' }}>
                {filterBus===name && <span style={{ color:'#fff', fontSize:11, fontWeight:900, lineHeight:1 }}>✓</span>}
              </div>
              <span style={{ fontSize:13, color: filterBus===name ? INK : '#555', fontWeight: filterBus===name ? 600 : 400 }}>
                {name}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const today = isoDate(new Date());

  const [localFrom,  setLocalFrom]  = useState(searchParams.get('from') || '');
  const [localTo,    setLocalTo]    = useState(searchParams.get('to')   || '');
  const [localDate,  setLocalDate]  = useState(searchParams.get('date') || today);
  const [passengers, setPassengers] = useState(Number(searchParams.get('passengers')) || 1);
  const sliderRef                       = useRef(null);
  const [slideIdx,  setSlideIdx]        = useState(0);
  const [itemPx,    setItemPx]          = useState(0);
  const SLIDE_GAP   = 12;
  const ITEMS_SHOWN = 3;
  const MAX_SLIDE   = BANNERS.length + 1 - ITEMS_SHOWN; // 4 items - 3 visible = 1
  const [cities,     setCities]     = useState([]);
  const [trips,      setTrips]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(false);
  const [searched,   setSearched]   = useState(false);
  const [nextDate,      setNextDate]      = useState(null);
  const [nextDateTrips, setNextDateTrips] = useState([]);
  const [filterBus,  setFilterBus]  = useState('');
  const [sortBy,     setSortBy]     = useState('time');
  const [onlyAvail,  setOnlyAvail]  = useState(false);
  const [onlySale,   setOnlySale]   = useState(false);
  const from = searchParams.get('from') || '';
  const to   = searchParams.get('to')   || '';
  const date = searchParams.get('date') || today;

  const busNames = useMemo(() => [...new Set(trips.map(t => t.bus?.name).filter(Boolean))], [trips]);

  const filteredTrips = useMemo(() => {
    const now = new Date();
    let r = [...trips];
    if (filterBus)  r = r.filter(t => t.bus?.name === filterBus);
    if (onlyAvail)  r = r.filter(t => t.availableSeats > 0);
    if (onlySale)   r = r.filter(t => t.salePercent > 0 && t.saleEndsAt && now < new Date(t.saleEndsAt));
    if (sortBy === 'price-asc')  r.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') r.sort((a, b) => b.price - a.price);
    if (sortBy === 'seats')      r.sort((a, b) => b.availableSeats - a.availableSeats);
    return r;
  }, [trips, filterBus, sortBy, onlyAvail, onlySale]);

  const hasFilter = filterBus || sortBy !== 'time' || onlyAvail || onlySale;
  const clearFilters = () => { setFilterBus(''); setSortBy('time'); setOnlyAvail(false); setOnlySale(false); };

  useSEO({
    title: from && to ? `${from} → ${to}` : 'Tìm chuyến xe — FASTBUS',
    description: undefined,
  });

  useEffect(() => {
    getCities().then(r => setCities(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const update = () => {
      if (sliderRef.current) {
        const w = sliderRef.current.offsetWidth;
        setItemPx((w - SLIDE_GAP * (ITEMS_SHOWN - 1)) / ITEMS_SHOWN);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []); // eslint-disable-line

  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => i >= MAX_SLIDE ? 0 : i + 1), 4500);
    return () => clearInterval(t);
  }, []); // eslint-disable-line

  useEffect(() => {
    const f = searchParams.get('from') || '';
    const t = searchParams.get('to')   || '';
    const d = searchParams.get('date') || today;
    setLocalFrom(f); setLocalTo(t); setLocalDate(d);
    if (f || t) {
      setSearched(true); setLoading(true); setError(false); setNextDate(null); setNextDateTrips([]);
      getTrips({ from: f, to: t, date: d })
        .then(res => {
          setTrips(res.data);
          if (res.data.length === 0 && d) {
            getTrips({ from: f, to: t }).then(all => {
              const future = all.data
                .filter(tr => new Date(tr.departureTime) > new Date(d + 'T23:59:59'))
                .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));
              if (future.length > 0) {
                const nd = isoDate(new Date(future[0].departureTime));
                setNextDate(nd);
                setNextDateTrips(future.filter(tr => isoDate(new Date(tr.departureTime)) === nd));
              }
            }).catch(() => {});
          }
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [searchParams]); // eslint-disable-line

  const goToDate = (newDate) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to)   params.set('to',   to);
    params.set('date', newDate);
    navigate(`/search?${params.toString()}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (localFrom) params.set('from', localFrom);
    if (localTo)   params.set('to',   localTo);
    if (localDate) params.set('date', localDate);
    navigate(`/search?${params.toString()}`);
  };

  const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', { weekday:'short', day:'numeric', month:'numeric' });
  const fmtDateLong = (d) => new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', { weekday:'long', day:'numeric', month:'long' });

  const sharedBarProps = { localFrom, setLocalFrom, localTo, setLocalTo, localDate, setLocalDate,
    passengers, setPassengers, today, searched, goToDate, onSearch: handleSearch, cities };

  const prevSlide = () => setSlideIdx(i => Math.max(0, i - 1));
  const nextSlide = () => setSlideIdx(i => i >= MAX_SLIDE ? 0 : i + 1);

  return (
    <div style={{ background:'var(--surface-2)', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .search-grid { flex-direction: column !important; }
          .search-sidebar { position: static !important; width: 100% !important; }
          .hero-row { flex-direction: column !important; }
          .hero-brand { flex: none !important; }
        }
      `}</style>

      {/* ── HERO — sliding carousel (Traveloka style) ── */}
      <div style={{
        background: 'linear-gradient(180deg, #0e5585 0%, #1D7DB8 48%, #2caae2 78%, #c0e5f8 96%, var(--surface-2) 100%)',
      }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'88px 24px 0' }}>

          {/* Sliding track — overflow hidden clips items outside viewport */}
          <div ref={sliderRef} style={{ overflow:'hidden' }}>
            <div style={{
              display: 'flex',
              gap: SLIDE_GAP,
              transform: `translateX(${-(slideIdx * (itemPx + SLIDE_GAP))}px)`,
              transition: 'transform 0.46s cubic-bezier(0.25,0.46,0.45,0.94)',
            }}>
              {/* Item 0: brand text */}
              <div style={{ flex:`0 0 ${itemPx}px`, color:'#fff', display:'flex', flexDirection:'column', justifyContent:'center', minHeight:190 }}>
                <div style={{ fontSize:20, fontWeight:800, lineHeight:1.35, marginBottom:12 }}>
                  {'Tìm chuyến xe — FASTBUS'}
                </div>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.78)', lineHeight:1.75, margin:0 }}>
                  {'Hơn 200 nhà xe uy tín trên toàn quốc. Chọn ghế trực quan, thanh toán an toàn, nhận vé điện tử ngay.'}
                </p>
              </div>

              {/* Items 1-3: banners */}
              {BANNERS.map((b, i) => (
                <div key={i} style={{ flex:`0 0 ${itemPx}px`, borderRadius:12, overflow:'hidden',
                  position:'relative', height:190, background:b.bg,
                  boxShadow:'0 4px 20px rgba(0,0,0,0.25)', flexShrink:0,
                }}>
                  <div style={{ position:'absolute', inset:0 }}>
                    <img src={b.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.4 }}
                      onError={e => e.target.style.display='none'}/>
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, transparent 70%)' }}/>
                  </div>
                  <div style={{ position:'relative', zIndex:1, padding:'20px 22px', color:'#fff', height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999,
                      background:b.tagColor, fontSize:10, fontWeight:800,
                      letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:10, alignSelf:'flex-start',
                    }}>{b.tag}</span>
                    <div style={{ fontSize:22, fontWeight:900, lineHeight:1.15, letterSpacing:'-0.02em', marginBottom:6,
                      textShadow:'0 2px 10px rgba(0,0,0,0.4)',
                    }}>{b.title}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.82)', fontWeight:500 }}>{b.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strip — full width, centered */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20,
            padding:'12px 0 20px', color:'rgba(255,255,255,0.9)',
          }}>
            <button onClick={prevSlide} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)', fontSize:20, cursor:'pointer', padding:'2px 8px', lineHeight:1 }}>‹</button>
            <span style={{ fontSize:13, fontWeight:600, letterSpacing:'0.03em' }}>{'Xem thêm khuyến mãi'}</span>
            <button onClick={nextSlide} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.7)', fontSize:20, cursor:'pointer', padding:'2px 8px', lineHeight:1 }}>›</button>
          </div>

          {/* Search form */}
          <div style={{ paddingBottom: 40 }}>
            <SearchBar {...sharedBarProps}/>
          </div>

        </div>
      </div>

      {/* ── Results area ── */}
      <div style={{ maxWidth:1160, margin:'0 auto', padding:'28px 20px 60px' }}>

        {/* Date strip — only when a search is active */}
        {searched && (
          <div style={{ display:'flex', background:'#fff', borderRadius:12, marginBottom:14, border:'1px solid #C8D5E4', boxShadow:'0 1px 6px rgba(11,31,58,0.05)', overflowX:'auto', scrollbarWidth:'none' }}>
            {[-1,0,1,2,3,4,5,6].map(offset => {
              const d      = addDays(date, offset);
              const past   = d < today;
              const active = d === date;
              return (
                <button key={d} disabled={past} onClick={() => !past && goToDate(d)} style={{
                  flex:'0 0 auto', minWidth:110, padding:'12px 8px',
                  border:'none', borderBottom: active ? `3px solid ${P}` : '3px solid transparent',
                  background: active ? '#E3F1FA' : 'transparent',
                  color:      past ? '#ccc' : active ? P : '#555',
                  fontWeight: active ? 700 : 400,
                  fontSize:13, textAlign:'center', cursor: past ? 'not-allowed' : 'pointer',
                  whiteSpace:'nowrap', transition:'all .15s',
                }}>
                  {fmtDate(d)}
                </button>
              );
            })}
          </div>
        )}

        {/* Main 2-col layout */}
        <div className="search-grid" style={{ display:'flex', gap:20, alignItems:'flex-start' }}>

          {/* ── Sidebar filter — only when search active ── */}
          {searched && !loading && !error && (
            <div className="search-sidebar" style={{ width:256, flexShrink:0 }}>
              <FilterSidebar
                busNames={busNames} filterBus={filterBus} setFilterBus={setFilterBus}
                sortBy={sortBy} setSortBy={setSortBy}
                onlyAvail={onlyAvail} setOnlyAvail={setOnlyAvail}
                onlySale={onlySale}  setOnlySale={setOnlySale}
                hasFilter={hasFilter} clearFilters={clearFilters}
                count={filteredTrips.length} total={trips.length}
              />
            </div>
          )}

          {/* ── Results column ── */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* result meta */}
            {!loading && !error && trips.length > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div>
                  {from && to && (
                    <span style={{ fontWeight:800, fontSize:16, color:INK }}>{from} <span style={{ color:P }}>→</span> {to}</span>
                  )}
                </div>
                <span style={{ fontSize:13, color:'#888', marginLeft:'auto' }}>
                  {filteredTrips.length !== trips.length
                    ? `${filteredTrips.length} / ${trips.length} chuyến`
                    : `${trips.length} chuyến`}
                </span>
              </div>
            )}

            {!searched ? (
              <div style={{ ...s.emptyBox, padding:'60px 24px' }}>
                <div style={{ width:72, height:72, borderRadius:'50%', background:'#E3F1FA', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', fontSize:34 }}>🚌</div>
                <div style={{ fontSize:16, fontWeight:700, color:INK, marginBottom:8 }}>Chọn điểm đi và điểm đến</div>
                <div style={{ fontSize:13, color:'#aaa', lineHeight:1.6 }}>Nhập tuyến đường và ngày đi để xem<br/>danh sách chuyến xe phù hợp</div>
              </div>

            ) : loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <TripCardSkeleton/><TripCardSkeleton/><TripCardSkeleton/>
              </div>

            ) : error ? (
              <div style={s.emptyBox}>
                <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>
                <div style={{ fontWeight:700, color:INK, marginBottom:4 }}>{'Có lỗi xảy ra'}</div>
                <div style={{ fontSize:13, color:'#aaa' }}>{'Đang tải...'}</div>
              </div>

            ) : trips.length === 0 ? (
              <div>
                <div style={s.emptyBox}>
                  <div style={{ width:72, height:72, borderRadius:'50%', background:'#E3F1FA', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:34 }}>🗺️</div>
                  <div style={{ fontSize:16, fontWeight:700, color:INK, marginBottom:6 }}>
                    {'Không tìm thấy chuyến nào'} — {fmtDateLong(date)}
                  </div>
                  <div style={{ fontSize:13, color:'#aaa' }}>{'Thử thay đổi ngày hoặc tuyến đường khác'}</div>
                </div>

                {nextDate && (
                  <div style={{ marginTop:14 }}>
                    <div style={{ background:'#fff', borderRadius:12, padding:'16px 18px', border:'1px solid #C8D5E4', marginBottom:14 }}>
                      <div style={{ fontSize:11, color:'#aaa', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>{'Kết quả cho'}</div>
                      <button onClick={() => goToDate(nextDate)}
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'11px 14px', background:'#fafafa', border:`1.5px solid ${P}44`, borderRadius:10, cursor:'pointer', color:INK }}>
                        <span style={{ fontWeight:700, fontSize:14 }}>{fmtDateLong(nextDate)}</span>
                        <span style={{ color:P, fontSize:18, fontWeight:700 }}>›</span>
                      </button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {nextDateTrips.map(trip => <TripCard key={trip._id} trip={trip}/>)}
                    </div>
                  </div>
                )}
              </div>

            ) : filteredTrips.length === 0 ? (
              <div style={s.emptyBox}>
                <div style={{ fontSize:34, marginBottom:12 }}>🔍</div>
                <div style={{ fontWeight:700, color:INK, marginBottom:6 }}>{'Không tìm thấy chuyến nào'}</div>
                <button onClick={clearFilters}
                  style={{ padding:'9px 24px', background:P, color:'#fff', border:'none', borderRadius:20, fontSize:13, fontWeight:700, cursor:'pointer', marginTop:6, boxShadow:`0 3px 10px ${P}44` }}>
                  {'Huỷ'}
                </button>
              </div>

            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {filteredTrips.map(trip => <TripCard key={trip._id} trip={trip}/>)}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Shared styles ─────────────────────────────────────────────── */
const s = {
  label2:   { fontSize:12, fontWeight:700, color:'#555', marginBottom:5 },
  inputBox: { display:'flex', alignItems:'center', gap:8, border:'1.5px solid #E0E7EF', borderRadius:10, padding:'10px 12px', background:'#fafbfc', transition:'border-color .15s, box-shadow .15s' },
  sel2:     { flex:1, border:'none', background:'transparent', fontSize:14, color:INK, outline:'none', cursor:'pointer', minWidth:0, fontFamily:'inherit' },
  stepBtn:  { border:'none', background:'none', color:'#888', fontSize:19, cursor:'pointer', padding:'4px 6px', lineHeight:1, fontWeight:300 },
  emptyBox: { background:'#fff', borderRadius:14, padding:'44px 24px 40px', textAlign:'center', border:'1px solid #C8D5E4', boxShadow:'0 2px 8px rgba(11,31,58,0.06)' },
};
