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
