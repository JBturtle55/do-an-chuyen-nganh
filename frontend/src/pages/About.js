import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';

const P     = '#1D7DB8';
const INK   = '#0C1825';
const INK2  = '#1C3351';
const MUTED = '#5E7A96';
const LINE  = '#C8D5E4';
const SOFT  = '#E3F1FA';
const S2    = '#EBF2FA';

const STATS = [
  { value: '500.000+', label: 'Chuyến đi hoàn thành' },
  { value: '200+',     label: 'Nhà xe đối tác' },
  { value: '1.000.000+', label: 'Lượt đặt vé' },
  { value: '5',        label: 'Năm kinh nghiệm' },
];

const VALUES = [
  {
    title: 'An toàn & Tin cậy',
    desc: 'Tất cả nhà xe đối tác đều được kiểm duyệt nghiêm ngặt, 100% có giấy phép vận tải hợp lệ. Chúng tôi thường xuyên đánh giá và cập nhật chất lượng dịch vụ dựa trên phản hồi thực tế từ hành khách.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    title: 'Tiện lợi tối đa',
    desc: 'Đặt vé 24/7 mọi lúc mọi nơi, giao diện chọn ghế trực quan theo sơ đồ xe thực tế. Vé điện tử gửi ngay qua email sau khi thanh toán — không cần in ấn, không cần đến quầy.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
  },
  {
    title: 'Giá tốt nhất',
    desc: 'So sánh giá minh bạch giữa nhiều nhà xe trên cùng tuyến đường. Sử dụng voucher giảm giá, tích lũy điểm thưởng mỗi chuyến đi và thanh toán qua ví FASTPAY để nhận thêm ưu đãi độc quyền.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

const TIMELINE = [
  {
    year: '2020',
    title: 'Thành lập FASTBUS',
    desc: 'Ra mắt nền tảng đặt vé xe khách trực tuyến đầu tiên với 20 nhà xe đối tác tại khu vực miền Nam.',
  },
  {
    year: '2021',
    title: 'Mở rộng ra toàn quốc',
    desc: 'Đạt mốc 100 nhà xe đối tác, phủ sóng hầu hết các tỉnh thành từ Bắc vào Nam với hơn 500 tuyến xe.',
  },
  {
    year: '2023',
    title: 'Ra mắt ví FASTPAY',
    desc: 'Tích hợp ví điện tử nội bộ FASTPAY, cho phép nạp tiền và thanh toán vé nhanh chóng chỉ trong vài giây.',
  },
  {
    year: '2024',
    title: 'Nâng cấp AI & trải nghiệm',
    desc: 'Ra mắt trợ lý ảo AI hỗ trợ tư vấn tuyến đường, cải tiến giao diện chọn ghế và hệ thống điểm thưởng thế hệ mới.',
  },
];

export default function About() {
  useSEO({
    title: 'Về chúng tôi',
    description: 'FASTBUS — nền tảng đặt vé xe khách trực tuyến uy tín hàng đầu Việt Nam. 5 năm kết nối hàng triệu hành khách trên khắp đất nước.',
  });

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: INK, background: '#fff' }}>
      <style>{`
        @media (max-width: 768px) {
          .about-hero-title { font-size: 28px !important; }
          .about-hero-sub   { font-size: 15px !important; }
          .about-stats      { grid-template-columns: repeat(2, 1fr) !important; }
          .about-mission    { flex-direction: column !important; }
          .about-values     { grid-template-columns: 1fr !important; }
          .about-timeline-item { flex-direction: column !important; gap: 8px !important; }
          .about-timeline-year { min-width: unset !important; text-align: left !important; }
        }
        @media (max-width: 480px) {
          .about-stats { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ── Hero ── */}
      <div style={{
        position: 'relative',
        background: `linear-gradient(135deg, ${INK} 0%, ${P} 58%, #2caae2 100%)`,
        padding: '80px 24px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(5,18,35,0.28)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            padding: '5px 14px',
            borderRadius: 20,
            marginBottom: 20,
            textTransform: 'uppercase',
          }}>
            Về chúng tôi
          </span>
          <h1 className="about-hero-title" style={{
            color: '#fff',
            fontSize: 42,
            fontWeight: 800,
            margin: '0 0 16px',
            lineHeight: 1.18,
          }}>
            Hành trình 5 năm kết nối Việt Nam
          </h1>
          <p className="about-hero-sub" style={{
            color: 'rgba(255,255,255,0.82)',
            fontSize: 17,
            lineHeight: 1.65,
            margin: 0,
          }}>
            FASTBUS — nền tảng đặt vé xe khách trực tuyến uy tín hàng đầu Việt Nam
          </p>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="about-stats" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0,
          }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                padding: '36px 24px',
                textAlign: 'center',
                borderRight: i < STATS.length - 1 ? `1px solid ${LINE}` : 'none',
              }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: P, marginBottom: 6 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mission ── */}
      <div style={{ background: S2, padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="about-mission" style={{ display: 'flex', gap: 60, alignItems: 'center' }}>
            {/* Left */}
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: P, letterSpacing: 2,
                textTransform: 'uppercase', marginBottom: 12,
              }}>
                Sứ mệnh
              </p>
              <h2 style={{ fontSize: 30, fontWeight: 800, color: INK, margin: '0 0 20px', lineHeight: 1.25 }}>
                Sứ mệnh của chúng tôi
              </h2>
              <p style={{ fontSize: 15, color: INK2, lineHeight: 1.8, marginBottom: 16 }}>
                FASTBUS ra đời với một mục tiêu duy nhất: xóa bỏ rào cản trong việc di chuyển bằng xe khách tại Việt Nam.
                Chúng tôi tin rằng mỗi hành khách đều xứng đáng được trải nghiệm dịch vụ đặt vé nhanh chóng, minh bạch và đáng tin cậy.
              </p>
              <p style={{ fontSize: 15, color: INK2, lineHeight: 1.8, marginBottom: 16 }}>
                Với nền tảng kỹ thuật số hiện đại, FASTBUS kết nối hàng trăm nhà xe uy tín trên khắp cả nước — từ các tuyến đường cao tốc nhộn nhịp giữa Hà Nội và TP.HCM, đến những cung đường nhỏ kết nối các vùng nông thôn xa xôi.
              </p>
              <p style={{ fontSize: 15, color: INK2, lineHeight: 1.8, margin: 0 }}>
                Chúng tôi không chỉ đơn giản hóa việc mua vé — chúng tôi đang xây dựng một hệ sinh thái giao thông số, nơi mà mọi người dân Việt Nam đều có thể dễ dàng lên kế hoạch và thực hiện hành trình của mình chỉ bằng vài thao tác trên điện thoại.
              </p>
            </div>
            {/* Right — placeholder visual */}
            <div style={{ flex: '0 0 380px' }}>
              <div style={{
                borderRadius: 20,
                background: `linear-gradient(135deg, ${P} 0%, ${INK2} 60%, ${INK} 100%)`,
                height: 320,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                color: '#fff',
                boxShadow: '0 20px 60px rgba(29,125,184,0.30)',
              }}>
                <svg viewBox="0 0 80 80" fill="none" width="72" height="72">
                  <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,0.25)" strokeWidth="2"/>
                  <path d="M20 52 Q30 30 40 28 Q50 26 58 40" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <circle cx="40" cy="28" r="5" fill="rgba(255,255,255,0.9)"/>
                  <circle cx="20" cy="52" r="4" fill="rgba(255,255,255,0.6)"/>
                  <circle cx="58" cy="40" r="4" fill="rgba(255,255,255,0.6)"/>
                  <path d="M24 42 L34 36 M44 32 L54 36" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3"/>
                </svg>
                <div style={{ textAlign: 'center', padding: '0 24px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Kết nối Việt Nam</div>
                  <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6 }}>
                    Từ Bắc vào Nam — mỗi tuyến xe<br/>là một sợi dây gắn kết
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Values ── */}
      <div style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: P, letterSpacing: 2,
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              Giá trị cốt lõi
            </p>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: INK, margin: 0 }}>
              Điều làm nên FASTBUS
            </h2>
          </div>
          <div className="about-values" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 28,
          }}>
            {VALUES.map((v, i) => (
              <div key={i} style={{
                background: '#fff',
                border: `1px solid ${LINE}`,
                borderRadius: 16,
                padding: '36px 28px',
                transition: 'box-shadow .2s, transform .2s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(29,125,184,0.13)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: 14,
                  background: SOFT, color: P,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  {v.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: INK, margin: '0 0 12px' }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, margin: 0 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div style={{ background: S2, padding: '72px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: P, letterSpacing: 2,
              textTransform: 'uppercase', marginBottom: 10,
            }}>
              Lịch sử
            </p>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: INK, margin: 0 }}>
              Hành trình phát triển
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {TIMELINE.map((item, i) => (
              <div key={i} className="about-timeline-item" style={{
                display: 'flex',
                gap: 32,
                alignItems: 'flex-start',
                paddingBottom: i < TIMELINE.length - 1 ? 36 : 0,
                position: 'relative',
              }}>
                {/* Year + line */}
                <div className="about-timeline-year" style={{ minWidth: 72, textAlign: 'right', paddingTop: 4 }}>
                  <span style={{
                    display: 'inline-block',
                    background: P,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 20,
                  }}>
                    {item.year}
                  </span>
                </div>
                {/* Dot + vertical line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6 }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#fff', border: `3px solid ${P}`,
                    flexShrink: 0,
                    boxShadow: `0 0 0 3px ${SOFT}`,
                  }} />
                  {i < TIMELINE.length - 1 && (
                    <div style={{
                      width: 2, flex: 1, minHeight: 44,
                      background: `linear-gradient(${P}, ${LINE})`,
                      marginTop: 4,
                    }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ flex: 1, paddingBottom: i < TIMELINE.length - 1 ? 0 : 0 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: INK, margin: '0 0 8px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{
        background: `linear-gradient(135deg, ${INK} 0%, ${P} 100%)`,
        padding: '56px 24px',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>
          Sẵn sàng bắt đầu hành trình?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 15, margin: '0 0 28px' }}>
          Hàng trăm tuyến xe, hàng triệu lựa chọn — chỉ một nền tảng
        </p>
        <Link to="/search" style={{
          display: 'inline-block',
          background: '#fff',
          color: P,
          fontWeight: 700,
          fontSize: 15,
          padding: '13px 32px',
          borderRadius: 10,
          textDecoration: 'none',
          transition: 'opacity .15s, transform .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Tìm chuyến ngay
        </Link>
      </div>
    </div>
  );
}
