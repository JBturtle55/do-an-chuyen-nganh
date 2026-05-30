import { useNavigate } from 'react-router-dom';

const ORANGE = '#1D7DB8';
const DARK   = '#0f172a';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={s.page}>
      <style>{`
        @keyframes float {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)}
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)}
        }
        .nf-btn:hover { transform: translateY(-2px); opacity: 0.92; }
        .nf-btn { transition: transform .15s, opacity .15s; }
      `}</style>

      <div style={s.inner}>
        {/* Big 404 */}
        <div style={s.numWrap}>
          <span style={s.num4}>4</span>
          <div style={s.busWrap}>
            <div style={s.busIcon}>🚌</div>
          </div>
          <span style={s.num4}>4</span>
        </div>

        <div style={{ animation: 'fadeUp .5s ease .1s both' }}>
          <h1 style={s.title}>Trang không tồn tại</h1>
          <p style={s.sub}>
            Có vẻ chuyến xe này đã lạc đường!<br/>
            Đường dẫn bạn truy cập không tồn tại hoặc đã bị xoá.
          </p>

          <div style={s.btnRow}>
            <button className="nf-btn" onClick={() => navigate(-1)} style={s.backBtn}>
              ← Quay lại
            </button>
            <button className="nf-btn" onClick={() => navigate('/')} style={s.homeBtn}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>

      {/* Decorative road */}
      <div style={s.road}>
        <div style={s.roadLine}/>
        <div style={s.roadLine}/>
        <div style={s.roadLine}/>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', background: '#f8f9fa',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '40px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
  },
  inner: { position: 'relative', zIndex: 2 },

  numWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 },
  num4: {
    fontSize: 160, fontWeight: 900, lineHeight: 1,
    color: DARK, letterSpacing: -4,
    textShadow: '4px 4px 0 rgba(0,0,0,0.06)',
  },
  busWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'float 3s ease-in-out infinite',
  },
  busIcon: { fontSize: 80 },

  title: { fontSize: 26, fontWeight: 900, color: DARK, margin: '0 0 12px' },
  sub:   { fontSize: 15, color: '#888', lineHeight: 1.7, margin: '0 0 36px' },

  btnRow:  { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  backBtn: {
    padding: '12px 28px', background: '#fff', color: '#555',
    border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 14,
    fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  homeBtn: {
    padding: '12px 28px', background: ORANGE, color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 14,
    fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px ${ORANGE}44`,
  },

  road: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 40, background: '#e2e8f0',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
  },
  roadLine: { width: 60, height: 4, background: '#fff', borderRadius: 4, opacity: 0.7 },
};
