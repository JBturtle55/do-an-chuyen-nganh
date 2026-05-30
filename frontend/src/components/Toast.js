import { useState, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const icons    = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  const bgColors = { success:'#dcfce7', error:'#fee2e2', info:'#dbeafe', warning:'#fef9c3' };
  const bdColors = { success:'#86efac', error:'#fca5a5', info:'#93c5fd', warning:'#fde68a' };
  const txColors = { success:'#15803d', error:'#b91c1c', info:'#1d4ed8', warning:'#92400e' };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position:'fixed', top:'80px', right:'20px', zIndex:9999,
                    display:'flex', flexDirection:'column', gap:'10px', maxWidth:'340px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display:'flex', alignItems:'flex-start', gap:'10px',
            padding:'12px 16px', borderRadius:'10px',
            background: bgColors[t.type], border:`1px solid ${bdColors[t.type]}`,
            boxShadow:'0 4px 16px rgba(0,0,0,0.12)',
            animation:'slideIn .25s ease',
            color: txColors[t.type], fontSize:'14px', fontWeight:500
          }}>
            <span style={{ fontSize:'16px', flexShrink:0 }}>{icons[t.type]}</span>
            <span style={{ flex:1, lineHeight:1.5 }}>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px',
                        color: txColors[t.type], opacity:.6, padding:0, flexShrink:0 }}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
