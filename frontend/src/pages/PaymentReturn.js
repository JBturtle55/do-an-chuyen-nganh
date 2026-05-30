import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useSEO from '../hooks/useSEO';

const ORANGE = '#1D7DB8';
const DARK   = '#0f172a';

export default function PaymentReturn() {
  useSEO({ title: 'Kết quả thanh toán — FASTBUS' });
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const [status, setStatus] = useState('loading');

  const resultCode     = params.get('resultCode') ?? params.get('errorCode');
  const orderId        = params.get('orderId')    || '';
  const amount         = params.get('amount')     || '';
  const message        = params.get('message')    || '';
  const isWalletTopup  = orderId.startsWith('WTOPUP_') || orderId.startsWith('WTP') || orderId.startsWith('VWT');
  // orderId format: VNP + 24-char bookingId + 4-digit suffix
  const bookingId      = orderId.startsWith('VNP') ? orderId.slice(3, 27) : orderId;

  useEffect(() => {
    if (resultCode === null) { setStatus('fail'); return; }
    setStatus(Number(resultCode) === 0 ? 'success' : 'fail');
  }, [resultCode]);

  const formattedAmount = amount ? Number(amount).toLocaleString('vi-VN') + 'đ' : '';

  if (status === 'loading') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.spinner}/>
        <p style={{ color: '#888', marginTop: 16, fontSize: 14 }}>Đang xác nhận thanh toán...</p>
      </div>
    </div>
  );

  if (status === 'success') return (
    <div style={s.page}>
      <style>{`
        @keyframes popIn { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .pr-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .pr-btn { transition: opacity .15s, transform .15s; }
      `}</style>
      <div style={s.card}>
        <div style={{ ...s.iconCircle, background: '#dcfce7', border: '3px solid #86efac', animation: 'popIn .4s ease both' }}>
          <span style={{ fontSize: 42 }}>✓</span>
        </div>
        <div style={{ animation: 'fadeUp .4s ease .1s both' }}>
          <h2 style={{ ...s.title, color: '#15803d' }}>
            {isWalletTopup ? 'Nạp tiền thành công!' : 'Thanh toán thành công!'}
          </h2>
          <p style={s.sub}>
            {isWalletTopup ? 'Số dư ví FASTPAY đã được cập nhật.' : 'Vé của bạn đã được xác nhận. Email xác nhận đã được gửi.'}
          </p>

          {formattedAmount && (
            <div style={s.amountBox}>
              <span style={{ color: '#666', fontSize: 13 }}>Số tiền đã thanh toán</span>
              <span style={{ color: ORANGE, fontWeight: 900, fontSize: 28 }}>{formattedAmount}</span>
            </div>
          )}

          {orderId && (
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Mã giao dịch</span>
              <span style={s.infoVal}>{orderId.split('_')[0].slice(-10).toUpperCase()}</span>
            </div>
          )}

          <div style={s.btnGroup}>
            {isWalletTopup ? (
              <button className="pr-btn" onClick={() => navigate('/profile')} style={s.primaryBtn}>
                Xem ví FASTPAY
              </button>
            ) : (
              <button className="pr-btn" onClick={() => navigate(`/ticket/${bookingId}`)} style={s.primaryBtn}>
                Xem vé của tôi
              </button>
            )}
            <button className="pr-btn" onClick={() => navigate('/')} style={s.secondaryBtn}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // fail
  return (
    <div style={s.page}>
      <style>{`
        @keyframes popIn { 0%{transform:scale(.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .pr-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .pr-btn { transition: opacity .15s, transform .15s; }
      `}</style>
      <div style={s.card}>
        <div style={{ ...s.iconCircle, background: '#fee2e2', border: '3px solid #fca5a5', animation: 'popIn .4s ease both' }}>
          <span style={{ fontSize: 42 }}>✕</span>
        </div>
        <div style={{ animation: 'fadeUp .4s ease .1s both' }}>
          <h2 style={{ ...s.title, color: '#dc2626' }}>
            {isWalletTopup ? 'Nạp tiền thất bại' : 'Thanh toán thất bại'}
          </h2>
          <p style={s.sub}>
            {message && message !== 'Thành công.' ? message : 'Giao dịch không thành công hoặc đã bị huỷ.'}
          </p>
          <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 24px', lineHeight: 1.6 }}>
            {isWalletTopup ? 'Số dư ví không thay đổi. Bạn có thể thử nạp lại.' : 'Vé của bạn vẫn đang chờ thanh toán. Thử lại trong trang Vé của tôi.'}
          </p>
          <div style={s.btnGroup}>
            <button className="pr-btn"
              onClick={() => navigate('/profile')}
              style={s.primaryBtn}>
              {isWalletTopup ? 'Quay lại ví' : 'Xem lịch sử vé'}
            </button>
            <button className="pr-btn" onClick={() => navigate('/')} style={s.secondaryBtn}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #fff8f4 0%, #f8f9fa 60%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '48px 40px',
    maxWidth: 440, width: '100%',
    boxShadow: `0 8px 40px rgba(0,0,0,0.08)`,
    textAlign: 'center',
  },
  iconCircle: {
    width: 90, height: 90, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 24px', fontSize: 42,
  },
  spinner: {
    width: 44, height: 44, border: '4px solid #f0f0f0',
    borderTop: `4px solid ${ORANGE}`, borderRadius: '50%',
    animation: 'spin 1s linear infinite', margin: '0 auto',
  },
  title: { fontSize: 22, fontWeight: 900, margin: '0 0 8px' },
  sub:   { fontSize: 14, color: '#666', margin: '0 0 20px', lineHeight: 1.6 },

  amountBox: {
    background: `linear-gradient(135deg, ${ORANGE}0a, ${ORANGE}18)`,
    border: `1.5px solid ${ORANGE}33`, borderRadius: 12,
    padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16,
  },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', padding: '10px 0',
    borderTop: '1px solid #f0f0f0', fontSize: 13, marginBottom: 8,
  },
  infoLabel: { color: '#999' },
  infoVal:   { fontWeight: 700, color: DARK, fontFamily: 'monospace', letterSpacing: 1 },

  btnGroup:     { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 },
  primaryBtn:   { padding: 13, background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 16px ${ORANGE}44` },
  secondaryBtn: { padding: 11, background: '#f5f5f5', color: '#555', border: '1px solid #e8e8e8', borderRadius: 12, fontSize: 14, cursor: 'pointer' },
};
