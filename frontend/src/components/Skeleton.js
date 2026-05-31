import './Skeleton.css';

export function SkeletonLine({ width = '100%', height = 14, borderRadius = 4, style = {} }) {
  return (
    <div className="skeleton-pulse" style={{ width, height, borderRadius, ...style }}/>
  );
}

export function SkeletonCard({ children, style = {} }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, padding:'18px 20px',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:12, ...style }}>
      {children}
    </div>
  );
}

export function TripCardSkeleton() {
  return (
    <SkeletonCard>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <SkeletonLine width={60} height={28} borderRadius={6}/>
            <SkeletonLine width={40} height={12}/>
            <SkeletonLine width={60} height={28} borderRadius={6}/>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <SkeletonLine width={90} height={22} borderRadius={20}/>
            <SkeletonLine width={70} height={22} borderRadius={20}/>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          <SkeletonLine width={80} height={24}/>
          <SkeletonLine width={110} height={36} borderRadius={8}/>
        </div>
      </div>
    </SkeletonCard>
  );
}

export function BookingCardSkeleton() {
  return (
    <SkeletonCard style={{ padding:0, overflow:'hidden' }}>
      <div style={{ padding:'16px 20px', borderBottom:'2px dashed #e8edf4' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <SkeletonLine width={50} height={32} borderRadius={4}/>
          <div style={{ flex:1 }}>
            <SkeletonLine width='60%' height={16} style={{ marginBottom:6 }}/>
            <SkeletonLine width='40%' height={12}/>
          </div>
          <SkeletonLine width={80} height={24} borderRadius={20}/>
        </div>
      </div>
      <div style={{ padding:'12px 20px', background:'#fafbfc', display:'flex', gap:8, alignItems:'center' }}>
        <SkeletonLine width={30} height={30} borderRadius={6}/>
        <SkeletonLine width={30} height={30} borderRadius={6}/>
        <div style={{ marginLeft:'auto', display:'flex', gap:16 }}>
          <SkeletonLine width={80} height={12}/>
          <SkeletonLine width={80} height={12}/>
        </div>
      </div>
      <div style={{ padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <SkeletonLine width={70} height={22}/>
        <div style={{ display:'flex', gap:8 }}>
          <SkeletonLine width={110} height={36} borderRadius={8}/>
          <SkeletonLine width={70} height={36} borderRadius={8}/>
        </div>
      </div>
    </SkeletonCard>
  );
}

export function SkeletonList({ count = 3, renderItem }) {
  return (
    <>{Array.from({ length: count }, (_, i) => renderItem ? renderItem(i) : <TripCardSkeleton key={i}/>)}</>
  );
}

/* ── Post card (News.js) ── */
export function PostCardSkeleton() {
  return (
    <SkeletonCard style={{ padding:0, overflow:'hidden', marginBottom:0 }}>
      <SkeletonLine width='100%' height={160} borderRadius={0} style={{ borderRadius:'12px 12px 0 0' }}/>
      <div style={{ padding:'14px 16px 16px' }}>
        <SkeletonLine width={70} height={20} borderRadius={20} style={{ marginBottom:10 }}/>
        <SkeletonLine width='85%' height={16} style={{ marginBottom:6 }}/>
        <SkeletonLine width='65%' height={16} style={{ marginBottom:12 }}/>
        <SkeletonLine width='100%' height={12} style={{ marginBottom:4 }}/>
        <SkeletonLine width='80%' height={12} style={{ marginBottom:14 }}/>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <SkeletonLine width={28} height={28} borderRadius={999}/>
          <SkeletonLine width={100} height={11}/>
          <SkeletonLine width={70} height={11} style={{ marginLeft:'auto' }}/>
        </div>
      </div>
    </SkeletonCard>
  );
}

export function PostFeaturedSkeleton() {
  return (
    <SkeletonCard style={{ padding:0, overflow:'hidden', marginBottom:20 }}>
      <SkeletonLine width='100%' height={280} borderRadius={0} style={{ borderRadius:'12px 12px 0 0' }}/>
      <div style={{ padding:'20px 24px 24px' }}>
        <SkeletonLine width={80} height={22} borderRadius={20} style={{ marginBottom:12 }}/>
        <SkeletonLine width='75%' height={22} style={{ marginBottom:8 }}/>
        <SkeletonLine width='55%' height={22} style={{ marginBottom:16 }}/>
        <SkeletonLine width='100%' height={13} style={{ marginBottom:5 }}/>
        <SkeletonLine width='90%'  height={13}/>
      </div>
    </SkeletonCard>
  );
}

/* ── Booking page (2 cột) ── */
export function BookingPageSkeleton() {
  const P = '#1D7DB8';
  return (
    <div style={{ background:'var(--surface-2)', minHeight:'100vh', paddingTop:0 }}>
      {/* Stepper */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8edf4', padding:'16px 0' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'0 20px', display:'flex', justifyContent:'center', gap:40 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <SkeletonLine width={28} height={28} borderRadius={999}/>
              <SkeletonLine width={60} height={12}/>
            </div>
          ))}
        </div>
      </div>
      {/* Body */}
      <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 20px', display:'flex', gap:24, alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <SkeletonCard>
            <SkeletonLine width={160} height={18} style={{ marginBottom:20 }}/>
            <SkeletonLine width='100%' height={44} borderRadius={8} style={{ marginBottom:14 }}/>
            <SkeletonLine width='100%' height={44} borderRadius={8} style={{ marginBottom:20 }}/>
            <SkeletonLine width={120} height={40} borderRadius={8}/>
          </SkeletonCard>
        </div>
        <div style={{ width:300, flexShrink:0 }}>
          <SkeletonCard>
            <SkeletonLine width='60%' height={16} style={{ marginBottom:14 }}/>
            <SkeletonLine width='100%' height={12} style={{ marginBottom:8 }}/>
            <SkeletonLine width='80%'  height={12} style={{ marginBottom:8 }}/>
            <SkeletonLine width='90%'  height={12} style={{ marginBottom:16 }}/>
            <SkeletonLine width='100%' height={1} style={{ marginBottom:16, background:'#e8edf4' }}/>
            <SkeletonLine width='50%'  height={22} style={{ marginBottom:8 }}/>
            <SkeletonLine width='100%' height={44} borderRadius={8}/>
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}

/* ── Checkout page (2 cột) ── */
export function CheckoutPageSkeleton() {
  return (
    <div style={{ background:'var(--surface-2)', minHeight:'100vh' }}>
      <div style={{ background:'#fff', borderBottom:'1px solid #e8edf4', padding:'16px 0' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', display:'flex', justifyContent:'center', gap:40 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <SkeletonLine width={28} height={28} borderRadius={999}/>
              <SkeletonLine width={60} height={12}/>
            </div>
          ))}
        </div>
      </div>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px', display:'flex', gap:24, alignItems:'flex-start' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16 }}>
          <SkeletonCard>
            <SkeletonLine width={140} height={16} style={{ marginBottom:16 }}/>
            <div style={{ display:'flex', gap:14, alignItems:'center' }}>
              <SkeletonLine width={44} height={44} borderRadius={999}/>
              <div style={{ flex:1 }}>
                <SkeletonLine width='55%' height={14} style={{ marginBottom:7 }}/>
                <SkeletonLine width='35%' height={12}/>
              </div>
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonLine width={120} height={16} style={{ marginBottom:16 }}/>
            <SkeletonLine width='100%' height={44} borderRadius={8} style={{ marginBottom:10 }}/>
            <SkeletonLine width={100} height={36} borderRadius={8}/>
          </SkeletonCard>
          <SkeletonCard>
            <SkeletonLine width={150} height={16} style={{ marginBottom:16 }}/>
            {[1,2].map(i => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <SkeletonLine width={36} height={36} borderRadius={8}/>
                <SkeletonLine width='40%' height={14}/>
                <SkeletonLine width={70} height={24} borderRadius={20} style={{ marginLeft:'auto' }}/>
              </div>
            ))}
            <SkeletonLine width='100%' height={48} borderRadius={10} style={{ marginTop:8 }}/>
          </SkeletonCard>
        </div>
        <div style={{ width:340, flexShrink:0 }}>
          <SkeletonCard>
            <SkeletonLine width='50%'  height={16} style={{ marginBottom:16 }}/>
            <SkeletonLine width='100%' height={12} style={{ marginBottom:8 }}/>
            <SkeletonLine width='70%'  height={12} style={{ marginBottom:8 }}/>
            <SkeletonLine width='90%'  height={12} style={{ marginBottom:16 }}/>
            <SkeletonLine width='100%' height={1}  style={{ marginBottom:14, background:'#e8edf4' }}/>
            <SkeletonLine width='60%'  height={20} style={{ marginBottom:8 }}/>
            <SkeletonLine width='40%'  height={28}/>
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}

/* ── Ticket page ── */
export function TicketPageSkeleton() {
  return (
    <div style={{ background:'linear-gradient(160deg,#0c1825 0%,#1d3a5c 60%,#1D7DB8 100%)', minHeight:'100vh', padding:'32px 20px' }}>
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <SkeletonLine width={200} height={14} style={{ marginBottom:28, background:'rgba(255,255,255,0.15)' }}/>
        <div style={{ background:'#fff', borderRadius:20, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
          {/* Header strip */}
          <div style={{ background:'#f0f6ff', padding:'20px 24px', borderBottom:'1px solid #e0eaf4' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <SkeletonLine width={80} height={12} style={{ marginBottom:8 }}/>
                <SkeletonLine width={160} height={20}/>
              </div>
              <SkeletonLine width={72} height={24} borderRadius={20}/>
            </div>
          </div>
          {/* Timeline */}
          <div style={{ padding:'24px', borderBottom:'2px dashed #e8edf4' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div>
                <SkeletonLine width={60} height={28} style={{ marginBottom:6 }}/>
                <SkeletonLine width={90} height={12}/>
              </div>
              <SkeletonLine width={60} height={2} style={{ flex:1, borderRadius:2 }}/>
              <div style={{ textAlign:'center' }}>
                <SkeletonLine width={40} height={10} style={{ margin:'0 auto 6px' }}/>
              </div>
              <SkeletonLine width={60} height={2} style={{ flex:1, borderRadius:2 }}/>
              <div style={{ textAlign:'right' }}>
                <SkeletonLine width={60} height={28} style={{ marginBottom:6 }}/>
                <SkeletonLine width={90} height={12}/>
              </div>
            </div>
          </div>
          {/* Passenger info */}
          <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 24px' }}>
            {[1,2,3,4].map(i => (
              <div key={i}>
                <SkeletonLine width={80} height={11} style={{ marginBottom:6 }}/>
                <SkeletonLine width='70%' height={15}/>
              </div>
            ))}
          </div>
          {/* QR area */}
          <div style={{ padding:'20px 24px 28px', display:'flex', justifyContent:'center', borderTop:'1px solid #f0f0f0' }}>
            <SkeletonLine width={100} height={100} borderRadius={8}/>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Table row skeleton (Profile) ── */
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} style={{ padding:'12px 10px' }}>
          <SkeletonLine width={i === 0 ? 100 : i === cols-1 ? 80 : '70%'} height={13}/>
        </td>
      ))}
    </tr>
  );
}
