import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';

const P     = '#1D7DB8';
const INK   = '#0C1825';
const INK2  = '#1C3351';
const LINE  = '#C8D5E4';
const SOFT  = '#E3F1FA';

const SECTIONS = [
  {
    id: '1',
    title: '1. Thông tin chúng tôi thu thập',
    content: (
      <>
        <p>
          Để cung cấp dịch vụ đặt vé xe khách, FASTBUS thu thập các loại thông tin sau từ
          người dùng:
        </p>
        <ul>
          <li><strong>Thông tin cá nhân:</strong> Họ tên, số điện thoại, địa chỉ email khi bạn đăng ký tài khoản hoặc đặt vé.</li>
          <li><strong>Thông tin hành trình:</strong> Lịch sử đặt vé, tuyến đường thường đi, ghế đã chọn và thông tin hành khách trên vé.</li>
          <li><strong>Thông tin tài chính:</strong> Lịch sử giao dịch ví FASTPAY, điểm thưởng và lịch sử sử dụng voucher (không bao gồm số thẻ ngân hàng — được xử lý bởi VNPay).</li>
          <li><strong>Thông tin thiết bị:</strong> Địa chỉ IP, loại trình duyệt, thiết bị truy cập và dữ liệu phiên đăng nhập.</li>
          <li><strong>Cookie và dữ liệu theo dõi:</strong> Thông tin về cách bạn tương tác với nền tảng để cải thiện trải nghiệm.</li>
        </ul>
        <p>
          Chúng tôi chỉ thu thập thông tin cần thiết để cung cấp dịch vụ và sẽ không yêu cầu
          bạn cung cấp thông tin nhạy cảm ngoài phạm vi này.
        </p>
      </>
    ),
  },
  {
    id: '2',
    title: '2. Mục đích sử dụng thông tin',
    content: (
      <>
        <p>
          Thông tin bạn cung cấp được FASTBUS sử dụng cho các mục đích sau:
        </p>
        <ul>
          <li><strong>Cung cấp dịch vụ:</strong> Xử lý đặt vé, gửi vé điện tử qua email, xác nhận giao dịch thanh toán và thông báo về chuyến đi.</li>
          <li><strong>Cải thiện dịch vụ:</strong> Phân tích hành vi người dùng để tối ưu hóa giao diện, cá nhân hóa gợi ý tuyến đường phù hợp.</li>
          <li><strong>Hỗ trợ khách hàng:</strong> Xử lý yêu cầu hỗ trợ, khiếu nại và phản hồi về chất lượng dịch vụ.</li>
          <li><strong>Tiếp thị:</strong> Gửi thông báo về khuyến mãi, ưu đãi mới — bạn có thể hủy đăng ký bất kỳ lúc nào.</li>
          <li><strong>Tuân thủ pháp luật:</strong> Lưu trữ hồ sơ giao dịch theo yêu cầu của pháp luật Việt Nam.</li>
        </ul>
        <p>
          FASTBUS không sử dụng thông tin cá nhân của bạn cho bất kỳ mục đích nào khác ngoài
          danh sách trên mà không có sự đồng ý rõ ràng từ bạn.
        </p>
      </>
    ),
  },
  {
    id: '3',
    title: '3. Bảo mật thông tin',
    content: (
      <>
        <p>
          FASTBUS cam kết bảo vệ thông tin cá nhân của bạn bằng các biện pháp kỹ thuật và
          tổ chức phù hợp với tiêu chuẩn ngành:
        </p>
        <ul>
          <li><strong>Mã hóa SSL/TLS:</strong> Mọi dữ liệu truyền giữa trình duyệt của bạn và máy chủ FASTBUS đều được mã hóa bằng giao thức SSL/TLS.</li>
          <li><strong>Bảo mật mật khẩu:</strong> Mật khẩu được lưu trữ dưới dạng băm (hashed) — ngay cả đội ngũ kỹ thuật FASTBUS cũng không thể đọc được mật khẩu của bạn.</li>
          <li><strong>Kiểm soát truy cập:</strong> Chỉ nhân viên được ủy quyền mới có thể truy cập dữ liệu khách hàng trong phạm vi công việc cần thiết.</li>
        </ul>
        <p>
          <strong>FASTBUS cam kết không bán, cho thuê hoặc chia sẻ thông tin cá nhân của bạn
          với bên thứ ba</strong> vì mục đích thương mại. Thông tin chỉ được chia sẻ với nhà xe
          đối tác trong phạm vi cần thiết để thực hiện đặt vé, hoặc theo yêu cầu bắt buộc
          của cơ quan nhà nước có thẩm quyền.
        </p>
      </>
    ),
  },
  {
    id: '4',
    title: '4. Cookie và tracking',
    content: (
      <>
        <p>
          FASTBUS sử dụng cookie và các công nghệ theo dõi tương tự để nâng cao trải nghiệm
          người dùng. Các loại cookie chúng tôi sử dụng:
        </p>
        <ul>
          <li><strong>Cookie thiết yếu:</strong> Cần thiết để duy trì phiên đăng nhập và các chức năng cơ bản của website. Không thể tắt.</li>
          <li><strong>Cookie hiệu suất:</strong> Thu thập thông tin ẩn danh về cách bạn sử dụng website để giúp chúng tôi cải thiện dịch vụ.</li>
          <li><strong>Cookie cá nhân hóa:</strong> Ghi nhớ các tùy chọn của bạn (tuyến đường yêu thích, phương thức thanh toán) để tiết kiệm thời gian cho lần sau.</li>
        </ul>
        <p>
          Bạn có thể kiểm soát việc sử dụng cookie thông qua cài đặt trình duyệt. Lưu ý rằng
          việc tắt một số cookie có thể ảnh hưởng đến trải nghiệm sử dụng dịch vụ.
        </p>
      </>
    ),
  },
  {
    id: '5',
    title: '5. Quyền của người dùng',
    content: (
      <>
        <p>
          Theo quy định pháp luật về bảo vệ dữ liệu cá nhân, bạn có các quyền sau đối với
          thông tin của mình:
        </p>
        <ul>
          <li><strong>Quyền truy cập:</strong> Yêu cầu xem toàn bộ thông tin cá nhân mà FASTBUS đang lưu trữ về bạn.</li>
          <li><strong>Quyền sửa đổi:</strong> Cập nhật thông tin cá nhân không chính xác hoặc lỗi thời trực tiếp trong mục "Tài khoản của tôi" hoặc qua yêu cầu hỗ trợ.</li>
          <li><strong>Quyền xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu cá nhân, ngoại trừ dữ liệu phải lưu giữ theo quy định pháp luật (hồ sơ giao dịch).</li>
          <li><strong>Quyền phản đối:</strong> Từ chối nhận thông tin tiếp thị bất kỳ lúc nào bằng cách nhấp vào link "Hủy đăng ký" trong email hoặc liên hệ hỗ trợ.</li>
          <li><strong>Quyền di chuyển dữ liệu:</strong> Nhận bản sao dữ liệu cá nhân của bạn ở định dạng có thể đọc được bằng máy tính.</li>
        </ul>
        <p>
          Để thực hiện bất kỳ quyền nào ở trên, vui lòng liên hệ với chúng tôi theo thông tin
          tại mục 6 bên dưới. Chúng tôi sẽ xử lý yêu cầu trong vòng 30 ngày.
        </p>
      </>
    ),
  },
  {
    id: '6',
    title: '6. Liên hệ về bảo mật',
    content: (
      <>
        <p>
          Nếu bạn có câu hỏi, thắc mắc hoặc muốn thực hiện quyền của mình liên quan đến
          dữ liệu cá nhân, vui lòng liên hệ với Bộ phận Bảo mật & Quyền riêng tư của FASTBUS:
        </p>
        <ul>
          <li><strong>Email bảo mật:</strong> privacy@fastbus.vn</li>
          <li><strong>Email hỗ trợ:</strong> support@fastbus.vn</li>
          <li><strong>Hotline:</strong> 1900 xxxx (8:00 – 22:00, tất cả các ngày)</li>
          <li><strong>Địa chỉ:</strong> Tầng 5, Tòa nhà ABC, Quận 1, TP. Hồ Chí Minh</li>
        </ul>
        <p>
          Trong trường hợp phát hiện sự cố bảo mật liên quan đến dữ liệu của bạn, FASTBUS
          cam kết thông báo cho bạn trong vòng 72 giờ kể từ khi phát hiện và thực hiện các
          biện pháp khắc phục kịp thời.
        </p>
      </>
    ),
  },
];

export default function Privacy() {
  useSEO({
    title: 'Chính sách bảo mật',
    description: 'Chính sách bảo mật của FASTBUS — cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.',
  });

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: INK, background: '#f4f6f9', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .policy-hero-title { font-size: 24px !important; }
          .policy-content-card { padding: 28px 20px !important; }
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
        <h1 className="policy-hero-title" style={{
          color: '#fff', fontSize: 30, fontWeight: 800, margin: '0 0 8px',
        }}>
          Chính sách bảo mật
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, margin: 0 }}>
          Cập nhật lần cuối: 01/01/2025
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
          {/* Intro */}
          <div style={{
            background: SOFT,
            border: `1px solid #8EC6E8`,
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 32,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>🔒</span>
            <p style={{ margin: 0, fontSize: 14, color: INK2, lineHeight: 1.7 }}>
              Sự riêng tư của bạn quan trọng với chúng tôi. FASTBUS cam kết bảo vệ thông tin
              cá nhân và chỉ sử dụng dữ liệu của bạn để cung cấp và cải thiện dịch vụ.
            </p>
          </div>

          {/* Sections */}
          {SECTIONS.map((s, i) => (
            <div key={s.id} className="policy-section" style={{
              marginBottom: i < SECTIONS.length - 1 ? 36 : 0,
              paddingBottom: i < SECTIONS.length - 1 ? 36 : 0,
              borderBottom: i < SECTIONS.length - 1 ? `1px solid ${LINE}` : 'none',
            }}>
              <h2 style={{
                fontSize: 17, fontWeight: 700, color: INK,
                margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: 8,
                  background: SOFT, color: P,
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}>
                  {s.id}
                </span>
                {s.title.replace(/^\d+\.\s*/, '')}
              </h2>
              {s.content}
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div style={{
          marginTop: 24,
          display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {[
            { to: '/dieu-khoan', label: 'Điều khoản sử dụng' },
            { to: '/chinh-sach-hoan-ve', label: 'Chính sách hoàn vé' },
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
