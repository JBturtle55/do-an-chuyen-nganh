import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';

const P     = '#1D7DB8';
const INK   = '#0C1825';
const INK2  = '#1C3351';
const MUTED = '#5E7A96';
const LINE  = '#C8D5E4';
const SOFT  = '#E3F1FA';

const FEE_ROWS = [
  { time: 'Trước 24 giờ khởi hành', fee: 'Miễn phí', feeColor: '#16A34A', badge: '#f0fdf4', badgeText: '#16A34A' },
  { time: 'Từ 12 đến 24 giờ trước khởi hành', fee: '20% giá vé', feeColor: '#d97706', badge: '#fff7ed', badgeText: '#d97706' },
  { time: 'Dưới 12 giờ trước khởi hành', fee: '50% giá vé', feeColor: '#dc2626', badge: '#fef2f2', badgeText: '#dc2626' },
];

const STEPS = [
  { num: '1', label: 'Vào mục "Vé của tôi"', desc: 'Đăng nhập và truy cập trang Tài khoản → Lịch sử đặt vé.' },
  { num: '2', label: 'Chọn vé cần huỷ', desc: 'Tìm vé ở trạng thái "Chờ thanh toán" và nhấn vào để xem chi tiết.' },
  { num: '3', label: 'Nhấn nút "Huỷ vé"', desc: 'Nút Huỷ chỉ hiển thị với vé ở trạng thái "Chờ thanh toán" — chưa thanh toán.' },
  { num: '4', label: 'Xác nhận huỷ', desc: 'Xác nhận trong hộp thoại. Ghế được hoàn về hệ thống, tiền (nếu có) được hoàn theo chính sách.' },
];

export default function RefundPolicy() {
  useSEO({
    title: 'Chính sách hoàn vé',
    description: 'Chính sách huỷ vé và hoàn tiền của FASTBUS — điều kiện, mức phí và quy trình hoàn vé chi tiết.',
  });

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: INK, background: '#f4f6f9', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .policy-hero-title { font-size: 24px !important; }
          .policy-content-card { padding: 28px 20px !important; }
          .refund-fee-table th, .refund-fee-table td { padding: 10px 12px !important; font-size: 13px !important; }
          .refund-steps { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .refund-steps { grid-template-columns: 1fr !important; }
        }
        .policy-section p { margin: 0 0 12px; font-size: 14.5px; color: #1C3351; line-height: 1.8; }
        .policy-section p:last-child { margin-bottom: 0; }
        .policy-section ul { margin: 8px 0 12px 0; padding-left: 20px; }
        .policy-section li { font-size: 14.5px; color: #1C3351; line-height: 1.8; margin-bottom: 6px; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(135deg, #0a3a5c 0%, ${P} 100%)`,
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💸</div>
        <h1 className="policy-hero-title" style={{
          color: '#fff', fontSize: 30, fontWeight: 800, margin: '0 0 8px',
        }}>
          Chính sách hoàn vé
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: 0 }}>
          Minh bạch — Nhanh chóng — Công bằng
        </p>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 64px' }}>
        <div className="policy-content-card" style={{
          background: '#fff',
          borderRadius: 16,
          padding: '40px 44px',
          boxShadow: '0 2px 16px rgba(12,24,37,0.07)',
        }}>

          {/* ── Section 1: Điều kiện huỷ ── */}
          <div className="policy-section" style={{ marginBottom: 36, paddingBottom: 36, borderBottom: `1px solid ${LINE}` }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: INK, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: SOFT, color: P, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>1</span>
              Điều kiện huỷ vé
            </h2>
            <p>
              FASTBUS hỗ trợ huỷ vé trực tiếp từ giao diện cho vé ở trạng thái{' '}
              <span style={{ background: '#fef9c3', color: '#854d0e', fontWeight: 600, padding: '2px 8px', borderRadius: 5, fontSize: 13 }}>
                Chờ thanh toán
              </span>
              {' '} — tức là vé đã đặt nhưng chưa hoàn tất thanh toán trong vòng 5 phút.
            </p>
            <p>
              Đối với vé đã xác nhận (đã thanh toán thành công, trạng thái{' '}
              <span style={{ background: '#f0fdf4', color: '#166534', fontWeight: 600, padding: '2px 8px', borderRadius: 5, fontSize: 13 }}>
                Đã xác nhận
              </span>
              ), vui lòng liên hệ trực tiếp với hotline hỗ trợ của FASTBUS để được xử lý huỷ và hoàn vé theo chính sách.
            </p>
            <p>
              Lưu ý: việc huỷ vé đã xác nhận phụ thuộc vào chính sách của nhà xe và thời gian
              còn lại trước giờ khởi hành. FASTBUS sẽ hỗ trợ làm việc với nhà xe để bảo vệ
              quyền lợi của hành khách.
            </p>
          </div>

          {/* ── Section 2: Phương thức hoàn tiền ── */}
          <div className="policy-section" style={{ marginBottom: 36, paddingBottom: 36, borderBottom: `1px solid ${LINE}` }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: INK, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: SOFT, color: P, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>2</span>
              Phương thức hoàn tiền
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '16px 18px', borderRadius: 10, border: `1px solid ${LINE}`,
                background: SOFT,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: P,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: INK, fontSize: 14, marginBottom: 4 }}>
                    Ví FASTPAY — Hoàn tức thì
                  </div>
                  <div style={{ fontSize: 13.5, color: INK2, lineHeight: 1.65 }}>
                    Tiền được hoàn về ví FASTPAY ngay lập tức sau khi xác nhận huỷ.
                    Bạn có thể dùng số dư này cho lần đặt vé tiếp theo.
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '16px 18px', borderRadius: 10, border: `1px solid ${LINE}`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#6366f1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                    <polyline points="20 12 20 22 4 22 4 12"/>
                    <rect x="2" y="7" width="20" height="5"/>
                    <line x1="12" y1="22" x2="12" y2="7"/>
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: INK, fontSize: 14, marginBottom: 4 }}>
                    VNPay — 3-5 ngày làm việc
                  </div>
                  <div style={{ fontSize: 13.5, color: INK2, lineHeight: 1.65 }}>
                    Tiền được hoàn về tài khoản ngân hàng hoặc thẻ bạn đã sử dụng thanh toán,
                    thông qua cổng VNPay trong 3-5 ngày làm việc.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Mức phí huỷ ── */}
          <div className="policy-section" style={{ marginBottom: 36, paddingBottom: 36, borderBottom: `1px solid ${LINE}` }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: INK, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: SOFT, color: P, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>3</span>
              Mức phí huỷ
            </h2>
            <p>
              Phí huỷ được tính dựa trên khoảng thời gian từ lúc yêu cầu huỷ đến giờ khởi
              hành của chuyến xe:
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="refund-fee-table" style={{
                width: '100%', borderCollapse: 'collapse',
                fontSize: 14, borderRadius: 10, overflow: 'hidden',
                border: `1px solid ${LINE}`,
              }}>
                <thead>
                  <tr style={{ background: SOFT }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: INK, borderBottom: `1px solid ${LINE}` }}>
                      Thời gian huỷ
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: INK, borderBottom: `1px solid ${LINE}` }}>
                      Phí huỷ
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: INK, borderBottom: `1px solid ${LINE}` }}>
                      Hoàn lại
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEE_ROWS.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < FEE_ROWS.length - 1 ? `1px solid ${LINE}` : 'none' }}>
                      <td style={{ padding: '13px 16px', color: INK2 }}>{row.time}</td>
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          background: row.badge,
                          color: row.badgeText,
                          fontWeight: 700, fontSize: 13,
                          padding: '3px 12px', borderRadius: 20,
                        }}>
                          {row.fee}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', textAlign: 'center', fontWeight: 600, color: INK2, fontSize: 13 }}>
                        {row.fee === 'Miễn phí' ? '100% giá vé' : row.fee === '20% giá vé' ? '80% giá vé' : '50% giá vé'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: MUTED }}>
              * Phí huỷ tính trên giá vé gốc (trước khi áp dụng voucher và điểm thưởng).
              Điểm thưởng đã sử dụng được hoàn lại đầy đủ khi huỷ vé.
            </p>
          </div>

          {/* ── Section 4: Quy trình huỷ ── */}
          <div className="policy-section" style={{ marginBottom: 36, paddingBottom: 36, borderBottom: `1px solid ${LINE}` }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: INK, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: SOFT, color: P, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>4</span>
              Quy trình huỷ vé
            </h2>
            <div className="refund-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {STEPS.map((step, i) => (
                <div key={i} style={{
                  padding: '18px 16px', borderRadius: 10,
                  border: `1px solid ${LINE}`,
                  background: i === 0 ? SOFT : '#fff',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: P, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, flexShrink: 0,
                    }}>
                      {step.num}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: INK }}>{step.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.65 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 5: Không được hoàn ── */}
          <div className="policy-section" style={{ marginBottom: 36, paddingBottom: 36, borderBottom: `1px solid ${LINE}` }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: INK, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: SOFT, color: P, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>5</span>
              Các trường hợp không được hoàn vé
            </h2>
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, padding: '16px 18px', marginBottom: 14,
            }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#dc2626' }}>
                Lưu ý: Các trường hợp sau đây không được hoàn tiền trong bất kỳ tình huống nào
              </p>
            </div>
            <ul>
              <li>Vé đã được sử dụng — hành khách đã lên xe và hoàn thành chuyến đi.</li>
              <li>Yêu cầu huỷ được gửi sau giờ khởi hành của chuyến xe.</li>
              <li>Vé bị huỷ do vi phạm điều khoản sử dụng của FASTBUS.</li>
              <li>Trường hợp hành khách không lên xe (no-show) mà không thông báo trước.</li>
              <li>Vé khuyến mãi đặc biệt có ghi rõ "Không hoàn tiền" tại thời điểm mua.</li>
            </ul>
          </div>

          {/* ── Section 6: Liên hệ ── */}
          <div className="policy-section">
            <h2 style={{ fontSize: 17, fontWeight: 700, color: INK, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: SOFT, color: P, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>6</span>
              Liên hệ hỗ trợ
            </h2>
            <p>
              Nếu bạn cần hỗ trợ về việc huỷ vé đã xác nhận hoặc có thắc mắc về chính sách
              hoàn tiền, vui lòng liên hệ đội ngũ hỗ trợ của FASTBUS:
            </p>
            <ul>
              <li><strong>Hotline:</strong> 1900 xxxx (8:00 – 22:00, tất cả các ngày kể cả lễ Tết)</li>
              <li><strong>Email:</strong> support@fastbus.vn</li>
              <li><strong>Chat trực tuyến:</strong> Nhấn vào biểu tượng chat góc dưới bên phải màn hình</li>
            </ul>
            <p>
              Chúng tôi cam kết xử lý mọi yêu cầu hoàn vé trong vòng <strong>24 giờ làm việc</strong>.
              Trường hợp khẩn cấp (chuyến khởi hành trong vòng 2 giờ), vui lòng gọi hotline
              để được hỗ trợ ngay lập tức.
            </p>
          </div>

        </div>

        {/* Footer nav */}
        <div style={{
          marginTop: 24,
          display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {[
            { to: '/dieu-khoan', label: 'Điều khoản sử dụng' },
            { to: '/bao-mat', label: 'Chính sách bảo mật' },
            { to: '/ve-chung-toi', label: 'Về chúng tôi' },
          ].map(link => (
            <Link key={link.to} to={link.to} style={{
              fontSize: 13, color: P, textDecoration: 'none', fontWeight: 600,
              padding: '8px 16px', borderRadius: 8, border: `1px solid ${LINE}`,
              background: '#fff', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = SOFT}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
