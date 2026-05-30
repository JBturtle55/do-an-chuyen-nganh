import { useToast } from './Toast';

export default function SeatMap({ totalSeats, bookedSeats = {}, selectedSeats = [], onToggle }) {
  const { addToast } = useToast();
  // bookedSeats giờ là object: { confirmed: [], pending: [] }
  const confirmed = bookedSeats.confirmed || (Array.isArray(bookedSeats) ? bookedSeats : []);
  const pending   = bookedSeats.pending   || [];

  const getStatus = (n) => {
    if (confirmed.includes(n))    return 'confirmed';
    if (pending.includes(n))      return 'pending';
    if (selectedSeats.includes(n)) return 'selected';
    return 'available';
  };

  const styleMap = {
    available: { bg:'#E3F1FA', border:'#1D7DB8', color:'#0f5f8c', cursor:'pointer',     title:'' },
    pending:   { bg:'#fef9c3', border:'#fde68a', color:'#92400e', cursor:'pointer',     title: 'Ghế đang chờ thanh toán' },
    selected:  { bg:'#1D7DB8', border:'#0f5f8c', color:'#fff',    cursor:'pointer',     title: 'Đang chọn' },
    confirmed: { bg:'#e5e7eb', border:'#d1d5db', color:'#9ca3af', cursor:'not-allowed', title: 'Đã đặt' },
  };

  const handleClick = (n, status) => {
    if (status === 'confirmed') return;
    if (status === 'pending') {
      addToast('Ghế này đang có người chờ thanh toán. Nếu họ thanh toán trước, ghế sẽ bị khoá!', 'warning');
    }
    onToggle(n);
  };

  return (
    <div>
      {/* Legend */}
      <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'14px', fontSize:'12px' }}>
        {[
          ['#E3F1FA','#1D7DB8', 'Trống'],
          ['#fef9c3','#fde68a', 'Chờ thanh toán'],
          ['#1D7DB8','#0f5f8c', 'Đang chọn'],
          ['#e5e7eb','#d1d5db', 'Đã đặt'],
        ].map(([bg,bd,label]) => (
          <span key={label} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <span style={{ width:14, height:14, background:bg, border:`2px solid ${bd}`,
                           borderRadius:3, display:'inline-block', flexShrink:0 }}/>
            <span style={{ color:'#444', fontWeight:600 }}>{label}</span>
          </span>
        ))}
      </div>

      {/* Cabin header */}
      <div style={{ textAlign:'center', background:'#f0f4f8', borderRadius:'8px 8px 0 0',
                    padding:'8px', fontSize:'12px', color:'#666', fontWeight:600, marginBottom:'8px' }}>
        🚌 ĐẦU XE — TÀI XẾ
      </div>

      {/* Seat grid — 4 ghế/hàng, có lối đi giữa */}
      <div style={{ border:'1.5px solid #e2e8f0', borderRadius:'0 0 8px 8px', padding:'16px 12px' }}>
        {Array.from({ length: Math.ceil(totalSeats / 4) }, (_, row) => (
          <div key={row} style={{ display:'flex', justifyContent:'center', gap:'6px', marginBottom:'6px' }}>
            {[0, 1, 'aisle', 2, 3].map((col, ci) => {
              if (col === 'aisle') return <div key="aisle" style={{ width:20 }}/>;
              const n      = row * 4 + col + 1;
              if (n > totalSeats) return <div key={ci} style={{ width:38 }}/>;
              const status = getStatus(n);
              const st     = styleMap[status];
              return (
                <div key={n} title={st.title}
                  onClick={() => handleClick(n, status)}
                  style={{ width:38, height:38, borderRadius:6, fontWeight:700, fontSize:'13px',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            background:st.bg, border:`2px solid ${st.border}`,
                            color:st.color, cursor:st.cursor, transition:'transform .1s',
                            position:'relative' }}>
                  {n}
                  {status === 'pending' && (
                    <span style={{ position:'absolute', top:-4, right:-4, width:8, height:8,
                                    background:'#f59e0b', borderRadius:'50%', border:'1.5px solid #fff' }}/>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
