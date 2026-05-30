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
    title: '1. Chấp nhận điều khoản',
    content: (
      <>
        <p>
          Bằng cách truy cập và sử dụng nền tảng FASTBUS (bao gồm website và ứng dụng di động),
          bạn đồng ý bị ràng buộc bởi các điều khoản và điều kiện sử dụng được quy định trong
          tài liệu này. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử
          dụng dịch vụ của chúng tôi ngay lập tức.
        </p>
        <p>
          FASTBUS có quyền cập nhật, sửa đổi các điều khoản này bất kỳ lúc nào mà không cần
          thông báo trước. Phiên bản mới nhất luôn được đăng tải tại trang này kèm theo ngày
          cập nhật. Việc tiếp tục sử dụng dịch vụ sau khi có thay đổi đồng nghĩa với việc
          bạn chấp nhận các điều khoản mới.
        </p>
      </>
    ),
  },
  {
    id: '2',
    title: '2. Dịch vụ cung cấp',
    content: (
      <>
        <p>
          FASTBUS cung cấp nền tảng trung gian kết nối hành khách với các nhà xe vận tải,
          bao gồm các dịch vụ chính sau:
        </p>
        <ul>
          <li><strong>Đặt vé xe khách:</strong> Tìm kiếm, so sánh và đặt vé trực tuyến cho hàng trăm tuyến đường trên toàn quốc, với tính năng chọn ghế theo sơ đồ thực tế.</li>
          <li><strong>Ví điện tử FASTPAY:</strong> Dịch vụ ví nội bộ cho phép nạp tiền và thanh toán vé nhanh chóng, an toàn trong hệ sinh thái FASTBUS.</li>
          <li><strong>Chương trình điểm thưởng:</strong> Tích lũy điểm từ mỗi chuyến đi và sử dụng điểm để giảm giá cho các giao dịch tiếp theo.</li>
          <li><strong>Thông tin & hỗ trợ:</strong> Cung cấp thông tin tuyến xe, lịch trình, chính sách nhà xe và hỗ trợ khách hàng qua nhiều kênh.</li>
        </ul>
        <p>
          FASTBUS đóng vai trò là đại lý bán vé, không phải nhà cung cấp dịch vụ vận tải trực tiếp.
          Chất lượng dịch vụ vận chuyển thuộc trách nhiệm của nhà xe.
        </p>
      </>
    ),
  },
  {
    id: '3',
    title: '3. Tài khoản người dùng',
    content: (
      <>
        <p>
          Để sử dụng đầy đủ các tính năng của FASTBUS, bạn cần đăng ký tài khoản với thông tin
          chính xác, đầy đủ và cập nhật. Bạn hoàn toàn chịu trách nhiệm về việc bảo mật
          thông tin đăng nhập (email, mật khẩu) của tài khoản mình.
        </p>
        <p>
          FASTBUS không chịu trách nhiệm về bất kỳ tổn thất nào phát sinh từ việc tài khoản
          của bạn bị truy cập trái phép do lỗi bảo mật từ phía bạn. Trong trường hợp nghi ngờ
          tài khoản bị xâm phạm, vui lòng đổi mật khẩu ngay lập tức và liên hệ bộ phận hỗ trợ.
        </p>
        <p>
          Mỗi người dùng chỉ được sở hữu một tài khoản. Việc tạo nhiều tài khoản để lợi dụng
          ưu đãi dành cho thành viên mới có thể dẫn đến khóa tài khoản vĩnh viễn.
        </p>
      </>
    ),
  },
  {
    id: '4',
    title: '4. Chính sách đặt vé và thanh toán',
    content: (
      <>
        <p>
          Khi đặt vé, hệ thống sẽ giữ ghế trong <strong>5 phút</strong> để bạn hoàn tất thanh toán.
          Nếu quá thời gian này mà chưa thanh toán, đơn đặt vé sẽ tự động bị hủy và ghế được
          mở trở lại cho hành khách khác.
        </p>
        <p>FASTBUS chấp nhận các phương thức thanh toán sau:</p>
        <ul>
          <li><strong>Ví FASTPAY:</strong> Thanh toán tức thì từ số dư ví nội bộ, xác nhận ngay lập tức.</li>
          <li><strong>VNPay:</strong> Cổng thanh toán trực tuyến hỗ trợ thẻ ATM nội địa, thẻ quốc tế Visa/Mastercard và nhiều ứng dụng ngân hàng.</li>
        </ul>
        <p>
          Giá vé hiển thị đã bao gồm thuế và phí dịch vụ. Mọi ưu đãi từ voucher và điểm thưởng
          được áp dụng trong quá trình thanh toán theo thứ tự: voucher giảm giá → điểm thưởng
          (tối đa 30% giá trị sau voucher).
        </p>
      </>
    ),
  },
  {
    id: '5',
    title: '5. Huỷ vé và hoàn tiền',
    content: (
      <>
        <p>
          Chính sách huỷ vé và hoàn tiền được áp dụng theo quy định tại trang{' '}
          <Link to="/chinh-sach-hoan-ve" style={{ color: P, fontWeight: 600 }}>
            Chính sách hoàn vé
          </Link>
          . Tóm tắt chính sách:
        </p>
        <ul>
          <li>Chỉ có thể huỷ vé ở trạng thái "Chờ thanh toán" trực tiếp trên ứng dụng.</li>
          <li>Vé đã xác nhận (đã thanh toán) cần liên hệ hotline hỗ trợ để được xử lý.</li>
          <li>Phí huỷ phụ thuộc vào thời gian huỷ trước giờ khởi hành.</li>
          <li>Hoàn tiền về ví FASTPAY trong vòng vài phút; hoàn qua VNPay mất 3-5 ngày làm việc.</li>
        </ul>
        <p>
          Vé đã qua giờ khởi hành hoặc đã được sử dụng không được hoàn tiền trong bất kỳ
          trường hợp nào.
        </p>
      </>
    ),
  },
  {
    id: '6',
    title: '6. Giới hạn trách nhiệm',
    content: (
      <>
        <p>
          FASTBUS nỗ lực cung cấp thông tin chính xác về tuyến xe, giờ khởi hành và giá vé,
          tuy nhiên không đảm bảo tính chính xác tuyệt đối do dữ liệu phụ thuộc vào nhà xe
          cung cấp. Chúng tôi không chịu trách nhiệm về các thiệt hại phát sinh từ sự chậm trễ,
          hủy chuyến hoặc thay đổi lịch trình từ phía nhà xe.
        </p>
        <p>
          Trong mọi trường hợp, trách nhiệm tối đa của FASTBUS không vượt quá giá trị vé xe
          mà bạn đã thanh toán cho giao dịch liên quan. FASTBUS không chịu trách nhiệm về
          các thiệt hại gián tiếp, thiệt hại do mất lợi nhuận hay thiệt hại hậu quả khác.
        </p>
      </>
    ),
  },
  {
    id: '7',
    title: '7. Liên hệ',
    content: (
      <>
        <p>
          Nếu bạn có câu hỏi hoặc thắc mắc về các điều khoản sử dụng này, vui lòng liên hệ
          với chúng tôi qua:
        </p>
        <ul>
          <li><strong>Email:</strong> support@fastbus.vn</li>
          <li><strong>Hotline:</strong> 1900 xxxx (8:00 – 22:00, tất cả các ngày)</li>
          <li><strong>Địa chỉ:</strong> Tầng 5, Tòa nhà ABC, Quận 1, TP. Hồ Chí Minh</li>
        </ul>
        <p>
          Chúng tôi cam kết phản hồi mọi yêu cầu trong vòng 24 giờ làm việc.
        </p>
      </>
    ),
  },
];

export default function Terms() {
  useSEO({
    title: 'Điều khoản sử dụng',
    description: 'Điều khoản và điều kiện sử dụng nền tảng đặt vé xe khách FASTBUS. Cập nhật lần cuối 01/01/2025.',
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
          Điều khoản sử dụng
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
          <p style={{ fontSize: 14.5, color: INK2, lineHeight: 1.8, marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${LINE}` }}>
            Tài liệu này quy định các điều khoản và điều kiện sử dụng dịch vụ của FASTBUS —
            nền tảng đặt vé xe khách trực tuyến. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.
          </p>

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
            { to: '/bao-mat', label: 'Chính sách bảo mật' },
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
