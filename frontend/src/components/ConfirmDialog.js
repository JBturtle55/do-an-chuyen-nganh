export default function ConfirmDialog({ title, message, confirmLabel = 'Xác nhận', cancelLabel = 'Huỷ bỏ', danger = true, onConfirm, onCancel }) {
  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={s.box}>
        <div style={{ ...s.iconWrap, background: danger ? '#fff1f2' : '#f0fdf4' }}>
          {danger ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>
        {title && <div style={s.title}>{title}</div>}
        {message && <div style={s.message}>{message}</div>}
        <div style={s.btns}>
          <button onClick={onCancel} style={s.cancelBtn}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ ...s.confirmBtn, background: danger ? '#dc2626' : '#16a34a' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '16px',
    backdropFilter: 'blur(3px)',
    animation: 'fadeIn .15s ease',
  },
  box: {
    background: '#fff', borderRadius: '16px', padding: '32px 28px 24px',
    maxWidth: '380px', width: '100%',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    textAlign: 'center',
    animation: 'popIn .2s cubic-bezier(.34,1.56,.64,1)',
  },
  iconWrap: {
    width: '60px', height: '60px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title:   { fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' },
  message: { fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' },
  btns:    { display: 'flex', gap: '10px' },
  cancelBtn: {
    flex: 1, padding: '11px', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', background: '#fff',
    fontSize: '14px', fontWeight: 600, color: '#475569', cursor: 'pointer',
  },
  confirmBtn: {
    flex: 1, padding: '11px', borderRadius: '10px',
    border: 'none', color: '#fff',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
  },
};
