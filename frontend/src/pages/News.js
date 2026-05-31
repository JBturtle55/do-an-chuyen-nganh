import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { getPosts, getPost } from '../services/api';
import { PostCardSkeleton, PostFeaturedSkeleton } from '../components/Skeleton';

const P     = '#1D7DB8';
const INK   = '#0C1825';
const INK2  = '#1C3351';
const MUTED = '#5E7A96';
const LINE  = '#C8D5E4';
const SOFT  = '#E3F1FA';

const CAT_COLORS = {
  'Tin tức':    { bg: SOFT,      color: P         },
  'Khuyến mãi': { bg: '#fff7ed', color: '#ea580c' },
  'Hướng dẫn':  { bg: '#f0fdf4', color: '#16A34A' },
  'Thông báo':  { bg: '#fdf4ff', color: '#9333ea' },
};
const CATS = ['Tất cả', 'Tin tức', 'Khuyến mãi', 'Hướng dẫn', 'Thông báo'];

function getCatStyle(cat) { return CAT_COLORS[cat] || { bg: SOFT, color: P }; }
function fmtDate(d) {
  return new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function readMins(content) {
  if (!content) return 1;
  return Math.max(1, Math.round(content.replace(/<[^>]+>/g,'').split(/\s+/).length / 200));
}

/* ─── Danh sách bài viết ─── */
export function NewsList() {
  const navigate              = useNavigate();
  const [posts, setPosts]     = useState([]);
  const [cat, setCat]         = useState(CATS[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = cat !== 'Tất cả' ? { category: cat } : {};
    getPosts(params)
      .then(r => setPosts(r.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [cat]);

  const featured = posts[0] || null;
  const rest     = posts.slice(1);

  return (
    <div style={{ background: '#f4f6f9', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin   { to { transform:rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .news-card       { cursor:pointer; transition:transform .18s,box-shadow .18s; animation:fadeUp .28s ease both; }
        .news-card:hover { transform:translateY(-4px); box-shadow:0 14px 40px rgba(29,125,184,0.14)!important; }
        .feat-card       { cursor:pointer; transition:transform .2s,box-shadow .2s; }
        .feat-card:hover { transform:translateY(-3px); box-shadow:0 20px 52px rgba(0,0,0,0.16)!important; }
        .cat-pill        { transition:all .14s; cursor:pointer; }
        .cat-pill:hover:not(.active-pill) { background:${SOFT}!important; color:${P}!important; }
        @media(max-width:660px){
          .feat-card { border-radius:12px!important; }
          .feat-overlay-text { padding:20px 18px!important; }
          .art-card { padding:22px 16px!important; }
          .news-grid { grid-template-columns:1fr!important; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={s.pageHead}>
        <div style={s.pageHeadInner}>
          <div>
            <h1 style={s.pageTitle}>Tin tức & Khuyến mãi</h1>
            <p style={s.pageSub}>Thông tin mới nhất về khuyến mãi, tuyến xe và dịch vụ của FASTBUS</p>
          </div>
          {/* Category pills */}
          <div style={s.catRow}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`cat-pill${cat===c?' active-pill':''}`}
                style={{ ...s.catPill, ...(cat===c ? s.catActive : {}) }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={s.content}>
        {loading ? (
          <div>
            <PostFeaturedSkeleton/>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(275px,1fr))', gap:20 }}>
              {[1,2,3,4,5,6].map(i => <PostCardSkeleton key={i}/>)}
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div style={s.center}>
            <div style={{ fontSize:52, marginBottom:12 }}>📰</div>
            <p style={{ color:MUTED, fontSize:15, fontWeight:500 }}>Chưa có bài viết nào</p>
          </div>
        ) : (
          <>
            {/* ── Featured — ảnh full với text overlay ── */}
            {featured && (
              <div className="feat-card" onClick={() => navigate(`/tin-tuc/${featured.slug}`)}
                style={{ ...s.featured, boxShadow:'0 4px 24px rgba(0,0,0,0.10)' }}>
                {/* Image area */}
                <div style={s.featImgBox}>
                  {featured.thumbnail
                    ? <img src={featured.thumbnail} alt={featured.title} style={s.featImg}
                        onError={e => e.target.style.display='none'}/>
                    : <div style={s.featImgFallback}/>
                  }
                  {/* Dark gradient overlay */}
                  <div style={s.featOverlay}/>
                  {/* Text pinned to bottom */}
                  <div className="feat-overlay-text" style={s.featText}>
                    <span style={{ ...s.catChip, ...getCatStyle(featured.category) }}>
                      {featured.category}
                    </span>
                    <h2 style={s.featTitle}>{featured.title}</h2>
                    <div style={s.featMeta}>
                      <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={s.avatarSm}>{(featured.author?.name||'F')[0].toUpperCase()}</span>
                        <span>{featured.author?.name || 'FASTBUS'}</span>
                      </span>
                      <span style={{ display:'flex', gap:8 }}>
                        <span>{fmtDate(featured.createdAt)}</span>
                        <span style={{ opacity:.5 }}>·</span>
                        <span>{readMins(featured.content)} phút đọc</span>
                      </span>
                    </div>
                  </div>
                </div>
                {/* Excerpt strip below image */}
                {featured.excerpt && (
                  <div style={s.featExcerptBar}>
                    <p style={s.featExcerpt}>{featured.excerpt}</p>
                    <span style={s.readMoreBtn}>Đọc tiếp →</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Grid ── */}
            {rest.length > 0 && (
              <div className="news-grid" style={s.grid}>
                {rest.map((p, i) => (
                  <PostCard key={p._id} post={p} delay={i*50}
                    onClick={() => navigate(`/tin-tuc/${p.slug}`)}/>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onClick, delay }) {
  const cs = getCatStyle(post.category);
  return (
    <div className="news-card" onClick={onClick}
      style={{ ...s.card, boxShadow:'0 2px 14px rgba(0,0,0,0.07)', animationDelay:`${delay}ms` }}>
      <div style={s.cardImgBox}>
        {post.thumbnail
          ? <img src={post.thumbnail} alt={post.title} style={s.cardImg}
              onError={e => e.target.style.display='none'}/>
          : <div style={s.cardImgFallback}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={LINE} strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
        }
        <span style={{ ...s.catChipAbs, background:cs.bg, color:cs.color }}>{post.category}</span>
      </div>
      <div style={s.cardBody}>
        <h3 style={s.cardTitle}>{post.title}</h3>
        {post.excerpt && <p style={s.cardExcerpt}>{post.excerpt}</p>}
        <div style={s.cardFoot}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={s.avatarXs}>{(post.author?.name||'F')[0].toUpperCase()}</span>
            <span style={{ color:INK2, fontWeight:600, fontSize:12 }}>{post.author?.name||'FASTBUS'}</span>
          </span>
          <span style={{ color:MUTED, fontSize:12 }}>{fmtDate(post.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Chi tiết bài viết ─── */
export function NewsDetail() {
  const { slug }              = useParams();
  const navigate              = useNavigate();
  const [post, setPost]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    setLoading(true);
    getPost(slug)
      .then(r => setPost(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'60vh' }}>
      <div style={s.spinner}/>
    </div>
  );

  if (error || !post) return (
    <div style={{ textAlign:'center', padding:'80px 20px' }}>
      <div style={{ fontSize:56, marginBottom:16 }}>📭</div>
      <h3 style={{ color:INK, marginBottom:8, fontWeight:800 }}>Không tìm thấy bài viết</h3>
      <p style={{ color:MUTED, marginBottom:24 }}>Bài viết có thể đã bị xoá hoặc đường dẫn không đúng.</p>
      <button onClick={() => navigate('/tin-tuc')} style={s.backBtn}>← Quay lại tin tức</button>
    </div>
  );

  const cs   = getCatStyle(post.category);
  const mins = readMins(post.content);

  return (
    <div style={{ background:'#f4f6f9', minHeight:'100vh' }}>
      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        .article-body h1,.article-body h2,.article-body h3{color:${INK};margin:1.6em 0 .55em;font-weight:800;line-height:1.3;letter-spacing:-.01em;}
        .article-body h2{font-size:1.3em;} .article-body h3{font-size:1.1em;}
        .article-body p{margin:0 0 1.1em;}
        .article-body ul,.article-body ol{padding-left:1.5em;margin:0 0 1.1em;}
        .article-body li{margin-bottom:.4em;}
        .article-body img{max-width:100%;border-radius:10px;margin:1em 0;display:block;}
        .article-body blockquote{border-left:4px solid ${P};margin:1.4em 0;padding:12px 16px;background:${SOFT};border-radius:0 8px 8px 0;color:${INK2};font-style:italic;}
        .article-body a{color:${P};text-decoration:underline;}
        .article-body strong{color:${INK};}
        .article-body hr{border:none;border-top:1px solid ${LINE};margin:2em 0;}
        .article-body table{width:100%;border-collapse:collapse;margin:1em 0;font-size:14px;}
        .article-body th,.article-body td{border:1px solid ${LINE};padding:8px 12px;text-align:left;}
        .article-body th{background:${SOFT};font-weight:700;color:${INK2};}
        @media(max-width:640px){.art-card{padding:22px 16px!important;}}
      `}</style>

      {/* Breadcrumb */}
      <div style={s.breadBar}>
        <div style={s.breadInner}>
          <button onClick={() => navigate('/tin-tuc')} style={s.breadLink}>← Tin tức</button>
          <span style={{ color:LINE, margin:'0 8px', fontSize:16 }}>›</span>
          <span style={{ color:MUTED, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:400 }}>
            {post.title}
          </span>
        </div>
      </div>

      <div style={s.artOuter}>
        <article className="art-card" style={s.artCard}>
          {/* Category + title + meta */}
          <span style={{ ...s.catChip, ...cs }}>{post.category}</span>
          <h1 style={s.artTitle}>{post.title}</h1>
          <div style={s.artMeta}>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ ...s.avatarSm, width:28, height:28, fontSize:13 }}>
                {(post.author?.name||'F')[0].toUpperCase()}
              </span>
              <span style={{ fontWeight:700, color:INK2 }}>{post.author?.name||'FASTBUS'}</span>
            </span>
            <span style={{ color:LINE }}>·</span>
            <span>{fmtDate(post.createdAt)}</span>
            <span style={{ color:LINE }}>·</span>
            <span>{mins} phút đọc</span>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:LINE, margin:'0 0 28px' }}/>

          {/* Thumbnail */}
          {post.thumbnail && (
            <img src={post.thumbnail} alt={post.title} style={s.artImg}
              onError={e => e.target.style.display='none'}/>
          )}

          {/* Excerpt callout */}
          {post.excerpt && (
            <p style={s.artExcerpt}>{post.excerpt}</p>
          )}

          {/* Body */}
          <div className="article-body" style={s.artContent}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}/>

          <div style={s.artFooter}>
            <button onClick={() => navigate('/tin-tuc')} style={s.backBtn}>← Quay lại tin tức</button>
          </div>
        </article>
      </div>
    </div>
  );
}

const s = {
  /* Page header (no hero) */
  pageHead:      { background:'#fff', borderBottom:`1px solid ${LINE}` },
  pageHeadInner: { maxWidth:960, margin:'0 auto', padding:'24px 20px 0' },
  pageTitle:     { fontSize:26, fontWeight:900, color:INK, margin:'0 0 4px', letterSpacing:'-0.02em' },
  pageSub:       { fontSize:14, color:MUTED, margin:'0 0 16px' },

  /* Category pills */
  catRow:   { display:'flex', gap:6, flexWrap:'wrap', paddingBottom:0, overflowX:'auto', scrollbarWidth:'none' },
  catPill:  { padding:'8px 16px', background:'none', border:`1.5px solid ${LINE}`, borderRadius:20,
               cursor:'pointer', color:MUTED, fontSize:13, fontWeight:600, whiteSpace:'nowrap',
               marginBottom:12 },
  catActive:{ background:P, borderColor:P, color:'#fff', fontWeight:700 },

  /* Content */
  content: { maxWidth:960, margin:'0 auto', padding:'24px 20px 56px' },
  center:  { textAlign:'center', padding:'80px 0' },
  spinner: { width:36, height:36, border:`3px solid ${LINE}`, borderTop:`3px solid ${P}`,
              borderRadius:'50%', animation:'spin .9s linear infinite', margin:'0 auto' },

  /* Featured card — image overlay style */
  featured:        { background:'#fff', borderRadius:16, overflow:'hidden', marginBottom:28 },
  featImgBox:      { position:'relative', height:340, overflow:'hidden', background:'#1a2840' },
  featImg:         { width:'100%', height:'100%', objectFit:'cover', display:'block',
                      filter:'brightness(0.88)' },
  featImgFallback: { width:'100%', height:'100%', background:`linear-gradient(135deg,#0a2540,${P})` },
  featOverlay:     { position:'absolute', inset:0,
                      background:'linear-gradient(to top, rgba(5,15,35,0.90) 0%, rgba(5,15,35,0.45) 45%, rgba(0,0,0,0.10) 100%)',
                      pointerEvents:'none' },
  featText:        { position:'absolute', bottom:0, left:0, right:0, padding:'28px 30px', zIndex:1 },
  featTitle:       { margin:'8px 0 10px', fontSize:23, fontWeight:900, color:'#fff',
                      lineHeight:1.32, letterSpacing:'-0.01em',
                      textShadow:'0 1px 4px rgba(0,0,0,0.4)' },
  featMeta:        { display:'flex', justifyContent:'space-between', alignItems:'center',
                      fontSize:12, color:'rgba(255,255,255,0.72)', flexWrap:'wrap', gap:8 },
  featExcerptBar:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                      padding:'16px 24px', gap:16, borderTop:`1px solid ${LINE}` },
  featExcerpt:     { flex:1, fontSize:14, color:MUTED, lineHeight:1.6, margin:0,
                      overflow:'hidden', display:'-webkit-box',
                      WebkitLineClamp:2, WebkitBoxOrient:'vertical' },
  readMoreBtn:     { flexShrink:0, fontSize:13, fontWeight:700, color:P,
                      whiteSpace:'nowrap', alignSelf:'center' },

  /* Grid cards */
  grid:           { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(275px,1fr))', gap:20 },
  card:           { background:'#fff', borderRadius:14, overflow:'hidden',
                     border:`1px solid rgba(200,213,228,0.5)` },
  cardImgBox:     { position:'relative', height:176, overflow:'hidden', background:'#f0f4f8' },
  cardImg:        { width:'100%', height:'100%', objectFit:'cover', display:'block',
                     transition:'transform .25s' },
  cardImgFallback:{ width:'100%', height:'100%', display:'flex', alignItems:'center',
                     justifyContent:'center', background:SOFT },
  catChipAbs:     { position:'absolute', top:10, left:12, padding:'3px 10px', borderRadius:20,
                     fontSize:10, fontWeight:800, letterSpacing:.4 },
  cardBody:       { padding:'14px 16px 16px' },
  cardTitle:      { margin:'0 0 7px', fontSize:14, fontWeight:800, color:INK,
                     lineHeight:1.45, letterSpacing:'-0.01em' },
  cardExcerpt:    { margin:'0 0 12px', fontSize:12, color:MUTED, lineHeight:1.58,
                     overflow:'hidden', display:'-webkit-box',
                     WebkitLineClamp:2, WebkitBoxOrient:'vertical' },
  cardFoot:       { display:'flex', justifyContent:'space-between', alignItems:'center',
                     paddingTop:10, borderTop:`1px solid #f0f4f8` },

  /* Shared chips / avatars */
  catChip:   { display:'inline-block', padding:'3px 10px', borderRadius:20,
                fontSize:11, fontWeight:700, marginBottom:6, letterSpacing:.3 },
  avatarSm:  { width:24, height:24, borderRadius:'50%', background:P,
                color:'#fff', fontSize:11, fontWeight:800,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  avatarXs:  { width:20, height:20, borderRadius:'50%', background:P,
                color:'#fff', fontSize:9, fontWeight:800,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },

  /* Article detail */
  breadBar:   { background:'#fff', borderBottom:`1px solid ${LINE}` },
  breadInner: { maxWidth:780, margin:'0 auto', padding:'10px 20px',
                 display:'flex', alignItems:'center', fontSize:13 },
  breadLink:  { background:'none', border:'none', color:P, cursor:'pointer',
                 fontWeight:700, padding:0, fontSize:13 },

  artOuter:   { maxWidth:780, margin:'0 auto', padding:'24px 16px 60px' },
  artCard:    { background:'#fff', borderRadius:16, padding:'36px 42px',
                 boxShadow:'0 2px 20px rgba(29,125,184,0.08)',
                 border:`1px solid rgba(200,213,228,0.45)` },
  artTitle:   { fontSize:28, fontWeight:900, color:INK, lineHeight:1.28,
                 margin:'12px 0 14px', letterSpacing:'-0.02em' },
  artMeta:    { display:'flex', gap:8, fontSize:13, color:MUTED,
                 marginBottom:20, alignItems:'center', flexWrap:'wrap' },
  artImg:     { width:'100%', maxHeight:400, objectFit:'cover', borderRadius:12,
                 marginBottom:26, display:'block' },
  artExcerpt: { fontSize:16, color:INK2, fontStyle:'italic',
                 borderLeft:`4px solid ${P}`, paddingLeft:16,
                 paddingTop:10, paddingBottom:10, paddingRight:12,
                 margin:'0 0 26px', lineHeight:1.8, background:SOFT,
                 borderRadius:'0 8px 8px 0' },
  artContent: { fontSize:15.5, color:'#374151', lineHeight:1.9 },
  artFooter:  { marginTop:34, paddingTop:22, borderTop:`1px solid ${LINE}` },
  backBtn:    { padding:'10px 22px', background:P, color:'#fff', border:'none',
                 borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:14 },
};
