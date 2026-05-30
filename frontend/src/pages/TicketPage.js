import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { getBooking, cancelBooking, submitReview, getBookingReview } from '../services/api';
import { formatPrice } from '../utils/format';
import { useToast } from '../components/Toast';
import useSEO from '../hooks/useSEO';

const P   = '#1D7DB8';
const INK = '#0C1825';

// ── helpers ──────────────────────────────────────────────
function fmtTime(dt) {
  if (!dt) return '--:--';
  return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDateFull(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  });
}
function fmtDateShort(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function calcArrival(dep, durationMin) {
  if (!dep || !durationMin) return null;
  return new Date(new Date(dep).getTime() + durationMin * 60000);
}
function fmtDuration(min) {
  if (!min) return null;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}p` : `${h} giờ`;
}
function abbr(name = '') {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 3).toUpperCase();
  return words.map(w => w[0]).join('').slice(0, 3).toUpperCase();
}

// Barcode visual
function Barcode({ id = '' }) {
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const bars = Array.from({ length: 52 }, (_, i) => ((seed * (i + 7) * 31) ^ (i * 97)) % 5);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '48px' }}>
      {bars.map((v, i) => (
        <div key={i} style={{
          width: v === 0 ? '3px' : '1.5px',
          height: `${28 + (v % 3) * 10}px`,
          background: '#1a202c',
          borderRadius: '1px',
          flexShrink: 0,
        }}/>
      ))}
    </div>
  );
}

const busTypeColor  = { ghế: '#2563eb', giường: '#7c3aed', limousine: '#b45309' };
const busTypeBg     = { ghế: '#eff6ff', giường: '#f5f3ff', limousine: '#fffbeb' };
const busTypeLabel  = { ghế: 'Xe ghế', giường: 'Xe giường', limousine: 'Limousine' };

const STATUS = {
  confirmed:  { label: 'Đã xác nhận', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', icon: '✓' },
  completed:  { label: 'Đã sử dụng',  color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: '✓' },
  pending:    { label: 'Chờ TT',      color: '#92400e', bg: '#fef9c3', border: '#fde68a', icon: '⏳' },
  cancelled:  { label: 'Đã huỷ',      color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: '✗' },
};

export default function TicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const printRef = useRef();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling,   setCancelling]   = useState(false);
  const [showCancelDlg, setShowCancelDlg] = useState(false);
  const [existingReview, setExistingReview] = useState(undefined); // undefined=loading, null=none
  const [reviewRating,   setReviewRating]   = useState(0);
  const [reviewComment,  setReviewComment]  = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useSEO({ title: booking ? `Vé điện tử #${booking._id.slice(-8).toUpperCase()}` : 'Vé điện tử' });

  useEffect(() => {
    getBooking(id)
      .then(r => {
        setBooking(r.data);
        return getBookingReview(id);
      })
      .then(r => setExistingReview(r.data))
      .catch(() => { addToast('Vé điện tử', 'error'); navigate('/profile'); })
      .finally(() => setLoading(false));
  }, [id, navigate, addToast]);

  const handleSubmitReview = async () => {
    if (!reviewRating) return addToast('Chia sẻ trải nghiệm của bạn', 'warning');
    setReviewSubmitting(true);
    try {
      await submitReview(id, { rating: reviewRating, comment: reviewComment });
      addToast('Gửi đánh giá', 'success');
      setExistingReview({ rating: reviewRating, comment: reviewComment });
    } catch (err) {
      addToast(err.response?.data?.message || 'Gửi đánh giá', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setShowCancelDlg(false);
    setCancelling(true);
    try {
      await cancelBooking(id);
      addToast('Huỷ vé', 'success');
      setBooking(b => ({ ...b, status: 'cancelled' }));
    } catch (err) {
      addToast(err.response?.data?.message || 'Huỷ vé', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      const ref = booking ? ('FB' + booking._id.slice(-8)).toUpperCase() : 've';
      link.download = `ve-fastbus-${ref}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div style={s.page}>
      <div style={s.loadWrap}>
        <div style={s.spinner}/>
        <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: '16px', fontSize: '14px' }}>Đang tải...</div>
      </div>
    </div>
  );

  if (!booking) return null;

  const trip    = booking.trip || {};
  const route   = trip.route   || {};
  const bus     = trip.bus     || {};
  const depTime = trip.departureTime;
  const arrTime = trip.arrivalTime || calcArrival(depTime, route.duration);
  const duration = fmtDuration(route.duration);
  const busType  = bus.type || 'ghế';
  const bookRef  = ('FB' + booking._id.slice(-8)).toUpperCase();
  const status   = STATUS[booking.status] || STATUS.pending;
  const isCancelled = booking.status === 'cancelled';
  const qrValue = `FASTBUS:${booking._id}:${bookRef}`;

  return (
    <div style={s.page}>
      {showCancelDlg && (
        <ConfirmDialog
          title="Xác nhận huỷ vé?"
          message="Bạn sẽ không thể hoàn tác hành động này."
          confirmLabel="Huỷ vé"
          cancelLabel="Huỷ"
          onConfirm={handleCancel}
          onCancel={() => setShowCancelDlg(false)}
        />
      )}
      {/* Back button */}
      <div style={s.topBar} className="no-print ticket-topbar">
        <button onClick={() => navigate(-1)} style={s.backBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          ← Quay lại
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          {booking.status === 'pending' && (
            <button onClick={() => navigate(`/checkout/${booking._id}`)} style={s.payActionBtn}>
              💳 Thanh toán ngay
            </button>
          )}
          {booking.status !== 'cancelled' && (
            <button onClick={() => setShowCancelDlg(true)} disabled={cancelling} style={s.cancelActionBtn}>
              {cancelling ? '...' : 'Huỷ vé'}
            </button>
          )}
          <button onClick={handleDownload} disabled={downloading} style={s.printBtn}>
            {downloading ? (
              <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'14px', height:'14px', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                ...
              </span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Tải vé
              </>
            )}
          </button>
        </div>
      </div>

      {/* ════ TICKET ════ */}
      <div style={s.ticketWrap} ref={printRef}>
        <div style={{ ...s.ticket, opacity: isCancelled ? 0.75 : 1 }}>

          {/* Cancelled stamp */}
          {isCancelled && <div style={s.stamp}>Đã huỷ</div>}

          {/* ── Header ── */}
          <div style={s.head}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={s.busIcon}>🚌</div>
              <div>
                <div style={s.brandName}>FASTBUS</div>
                <div style={s.brandSub}>Vé điện tử · E-Ticket</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={s.refLabel}>Mã đặt vé</div>
              <div style={s.refCode}>{bookRef}</div>
            </div>
          </div>

          {/* ── Route ── */}
          <div style={s.routeSection}>
            <div style={s.cityCol}>
              <div style={s.cityAbbr}>{abbr(route.from)}</div>
              <div style={s.cityName}>{route.from || '—'}</div>
              <div style={s.bigTime}>{fmtTime(depTime)}</div>
              <div style={s.dateSmall}>{fmtDateShort(depTime)}</div>
            </div>

            <div style={s.routeCenter}>
              <span style={{ ...s.busTypePill, background: busTypeBg[busType], color: busTypeColor[busType] }}>
                {busTypeLabel[busType]}
              </span>
              <div style={s.arrowTrack}>
                <div style={s.trackDot}/>
                <div style={s.trackLine}/>
                <div style={s.busCircle}>🚌</div>
                <div style={s.trackLine}/>
                <div style={s.trackDot}/>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                {duration && <div style={s.durationBadge}>{duration}</div>}
                {route.distance && <div style={s.distanceText}>{route.distance} km</div>}
              </div>
            </div>

            <div style={{ ...s.cityCol, textAlign: 'right', alignItems: 'flex-end' }}>
              <div style={s.cityAbbr}>{abbr(route.to)}</div>
              <div style={s.cityName}>{route.to || '—'}</div>
              <div style={s.bigTime}>{fmtTime(arrTime)}</div>
              <div style={s.dateSmall}>{arrTime ? fmtDateShort(arrTime) : 'Dự kiến'}</div>
            </div>
          </div>

          {/* ── Tear line ── */}
          <TearLine/>

          {/* ── Info grid ── */}
          <div style={s.infoSection}>
            <div className="ticket-info-grid" style={s.infoGrid}>
              <InfoBox label="HÀNH KHÁCH" value={booking.passengerName} large />
              <InfoBox label="SĐT" value={booking.passengerPhone} />
              <InfoBox label="NGÀY ĐI" value={fmtDateFull(depTime)} />
              <InfoBox label="GHẾ SỐ" value={
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {(booking.seats || []).sort((a, b) => a - b).map(seat => (
                    <span key={seat} style={s.seatChip}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/>
                        <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/>
                      </svg>
                      {seat}
                    </span>
                  ))}
                </div>
              }/>
              <InfoBox label="NHÀ XE" value={`${bus.name || '—'}`} />
              <InfoBox label="BIỂN SỐ" value={bus.plate || '—'} />
              {booking.status === 'confirmed' && booking.paidAt && (
                <InfoBox label="THANH TOÁN LÚC" value={fmtDateFull(booking.paidAt)} />
              )}
              <InfoBox label="NGÀY ĐẶT" value={fmtDateFull(booking.createdAt)} />
            </div>
          </div>

          {/* ── Price breakdown ── */}
          <div style={s.priceSection}>
            {booking.discountAmount > 0 && (
              <PriceRow label={`Giảm voucher${booking.voucherCode ? ` (${booking.voucherCode})` : ''}`}
                value={`-${formatPrice(booking.discountAmount)}`} color="#16a34a"/>
            )}
            {booking.pointsUsed > 0 && (
              <PriceRow label={`Điểm thưởng (${booking.pointsUsed} điểm)`}
                value={`-${formatPrice(booking.pointsUsed * 100)}`} color="#7c3aed"/>
            )}
            <div style={s.totalRow}>
              <span style={s.totalLabel}>TỔNG THANH TOÁN</span>
              <span style={s.totalPrice}>{formatPrice(booking.totalPrice)}</span>
            </div>
          </div>

          {/* ── Tear line 2 ── */}
          <TearLine/>

          {/* ── QR + Barcode ── */}
          <div className="ticket-code-section" style={s.codeSection}>
            <div style={s.qrWrap}>
              <QRCodeSVG
                value={qrValue}
                size={110}
                level="M"
                fgColor="#1a202c"
                bgColor="transparent"
                style={{ display: 'block' }}
              />
              <div style={s.qrLabel}>Đưa mã QR cho nhân viên soát vé</div>
            </div>

            <div style={s.dividerV}/>

            <div style={s.barcodeWrap}>
              <Barcode id={booking._id}/>
              <div style={s.barcodeText}>{booking._id.toUpperCase()}</div>
            </div>
          </div>

          {/* ── Status footer ── */}
          <div style={{ ...s.statusFooter, background: status.bg, borderTop: `2px solid ${status.border}` }}>
            <span style={{ color: status.color, fontWeight: 800, fontSize: '13px', letterSpacing: '1px' }}>
              {status.icon} {status.label}
            </span>
            {booking.refundStatus === 'pending' && (
              <span style={s.refundBadge}>· Chờ hoàn tiền</span>
            )}
            {booking.refundStatus === 'completed' && (
              <span style={{ ...s.refundBadge, color: '#15803d' }}>· Đã hoàn tiền</span>
            )}
          </div>

        </div>
      </div>

      {/* ── Review section (confirmed + completed) ── */}
      {(booking.status === 'confirmed' || booking.status === 'completed') && (
        <div style={{ maxWidth: '680px', margin: '20px auto 0', padding: '0 16px' }}>
          <div style={s.reviewCard}>
            {existingReview ? (
              <>
                <div style={s.reviewTitle}>⭐ Đánh giá chuyến đi</div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: 8 }}>
                  {[1,2,3,4,5].map(i => (
                    <span key={i} style={{ fontSize: 22, color: i <= existingReview.rating ? '#f59e0b' : '#e2e8f0' }}>★</span>
                  ))}
                </div>
                {existingReview.comment && (
                  <p style={{ color: '#555', fontSize: 14, margin: 0, fontStyle: 'italic' }}>"{existingReview.comment}"</p>
                )}
              </>
            ) : existingReview === null ? (
              <>
                <div style={s.reviewTitle}>✍️ Đánh giá chuyến đi — {bus.name}</div>
                <p style={{ color: '#888', fontSize: 13, margin: '0 0 14px' }}>Chia sẻ trải nghiệm của bạn</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: 14 }}>
                  {[1,2,3,4,5].map(i => (
                    <button key={i} onClick={() => setReviewRating(i)} style={{
                      fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      color: i <= reviewRating ? '#f59e0b' : '#d1d5db',
                      transition: 'color .15s, transform .1s',
                      transform: i <= reviewRating ? 'scale(1.15)' : 'scale(1)',
                    }}>★</button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Chuyến đi thế nào?"
                  maxLength={500}
                  rows={3}
                  style={s.reviewTextarea}
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting || !reviewRating}
                  style={{ ...s.reviewSubmitBtn, opacity: reviewRating ? 1 : 0.5 }}>
                  {reviewSubmitting ? '...' : 'Gửi đánh giá'}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          #root > * { background: #fff !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 500px) {
          .ticket-info-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .ticket-code-section { flex-direction: column !important; align-items: center !important; }
          .ticket-route-section { padding: 20px 16px !important; gap: 4px !important; }
          .ticket-city-abbr { font-size: 32px !important; }
          .ticket-big-time { font-size: 20px !important; }
          .ticket-head { padding: 16px !important; }
          .ticket-topbar { padding: 12px 12px !important; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────
function TearLine() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f0f4f8', flexShrink: 0, marginLeft: '-11px' }}/>
      <div style={{ flex: 1, borderTop: '2px dashed #dde3ec' }}/>
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f0f4f8', flexShrink: 0, marginRight: '-11px' }}/>
    </div>
  );
}

function InfoBox({ label, value, large }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: large ? '17px' : '14px', fontWeight: large ? 700 : 600, color: '#1a202c' }}>
        {value}
      </div>
    </div>
  );
}

function PriceRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '3px 0' }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || '#1a202c' }}>{value}</span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${INK} 0%, #1a3a5e 50%, ${INK} 100%)`,
    padding: '0 0 60px',
  },
  loadWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '60vh',
  },
  spinner: {
    width: '40px', height: '40px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: `3px solid ${P}`,
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  },

  topBar: {
    maxWidth: '680px', margin: '0 auto', padding: '20px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px',
    flexWrap: 'wrap',
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', padding: '8px 16px', borderRadius: '8px',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
  payActionBtn: {
    padding: '8px 18px', background: P, color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
  },
  cancelActionBtn: {
    padding: '8px 16px', background: 'transparent', color: '#fca5a5',
    border: '1px solid rgba(252,165,165,0.4)', borderRadius: '8px',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
  printBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff', padding: '8px 16px', borderRadius: '8px',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },

  ticketWrap: {
    maxWidth: '680px', margin: '0 auto', padding: '0 16px',
  },

  ticket: {
    background: '#fff', borderRadius: '20px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
    overflow: 'hidden', position: 'relative',
  },
  stamp: {
    position: 'absolute', top: '46%', left: '50%',
    transform: 'translate(-50%,-50%) rotate(-18deg)',
    fontSize: '64px', fontWeight: 900,
    color: 'rgba(220,38,38,0.15)', letterSpacing: '6px',
    border: '8px solid rgba(220,38,38,0.15)',
    padding: '6px 20px', borderRadius: '10px',
    pointerEvents: 'none', zIndex: 20, whiteSpace: 'nowrap', userSelect: 'none',
  },

  /* Header */
  head: {
    background: `linear-gradient(135deg, ${INK} 0%, #1a3a5e 100%)`,
    padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  busIcon: { fontSize: '36px', lineHeight: 1 },
  brandName: { color: P, fontWeight: 900, fontSize: '22px', letterSpacing: '3px' },
  brandSub: { color: 'rgba(255,255,255,0.45)', fontSize: '11px', letterSpacing: '1px', marginTop: '2px' },
  refLabel: { color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' },
  refCode: { color: '#fff', fontWeight: 900, fontSize: '24px', letterSpacing: '3px', fontFamily: 'monospace' },

  /* Route */
  routeSection: {
    padding: '28px 28px 20px',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  cityCol: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px',
  },
  cityAbbr: { fontSize: '44px', fontWeight: 900, color: INK, lineHeight: 1, letterSpacing: '1px' },
  cityName: { fontSize: '11px', color: '#94a3b8', marginTop: '2px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  bigTime: { fontSize: '26px', fontWeight: 800, color: P, marginTop: '8px' },
  dateSmall: { fontSize: '11px', color: '#64748b' },

  routeCenter: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '80px',
  },
  busTypePill: {
    fontSize: '10px', fontWeight: 700, padding: '3px 12px',
    borderRadius: '20px', letterSpacing: '.5px', whiteSpace: 'nowrap',
  },
  arrowTrack: {
    display: 'flex', alignItems: 'center', gap: '3px', width: '100%',
  },
  trackDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 },
  trackLine: { flex: 1, borderTop: '2px dashed #cbd5e1' },
  busCircle: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: P, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', flexShrink: 0,
    boxShadow: '0 2px 8px rgba(29,125,184,0.4)',
  },
  durationBadge: {
    fontSize: '12px', fontWeight: 700, color: '#475569',
    background: '#f1f5f9', padding: '2px 10px', borderRadius: '20px',
  },
  distanceText: { fontSize: '10px', color: '#94a3b8' },

  /* Info */
  infoSection: { padding: '20px 28px', background: '#fafbfc' },
  infoGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 28px',
  },

  seatChip: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px', borderRadius: '8px',
    background: '#fff0e8', color: P, fontWeight: 800, fontSize: '14px',
    border: '2px solid #fbd0b8',
  },

  /* Price */
  priceSection: { padding: '16px 28px', borderTop: '1px solid #f0f4f8' },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: '10px', paddingTop: '12px', borderTop: '2px dashed #e2e8f0',
  },
  totalLabel: { fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' },
  totalPrice: { fontSize: '32px', fontWeight: 900, color: P },

  /* QR + Barcode */
  codeSection: {
    padding: '24px 28px', background: '#fafbfc',
    display: 'flex', alignItems: 'center', gap: '24px',
  },
  qrWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 },
  qrLabel: { fontSize: '10px', color: '#94a3b8', letterSpacing: '.5px', textAlign: 'center' },
  dividerV: { width: '1px', alignSelf: 'stretch', background: '#e2e8f0' },
  barcodeWrap: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' },
  barcodeText: {
    fontSize: '8px', letterSpacing: '2px', color: '#94a3b8',
    fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },

  /* Status footer */
  statusFooter: { padding: '14px 28px', textAlign: 'center' },
  refundBadge: { marginLeft: '10px', fontSize: '12px', color: '#1d4ed8', fontWeight: 600 },

  /* Review */
  reviewCard:      { background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' },
  reviewTitle:     { fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 },
  reviewTextarea:  { width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '10px 12px', fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 12, minHeight: 72 },
  reviewSubmitBtn: { padding: '10px 28px', background: P, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
};
