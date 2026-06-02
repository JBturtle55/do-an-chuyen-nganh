const Groq = require('groq-sdk');

let _client = null;
function getClient() {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

function fmt(n)     { return n?.toLocaleString('vi-VN') ?? '?'; }
function fmtTime(d) { return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }); }
function fmtDate(d) { return new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }); }

// Cache system prompt 5 phút để giảm DB query và token usage
let _promptCache = null;
let _promptCachedAt = 0;
const PROMPT_TTL = 5 * 60 * 1000;

async function buildSystemPrompt() {
  const now = Date.now();
  if (_promptCache && now - _promptCachedAt < PROMPT_TTL) return _promptCache;

  try {
    const Route = require('./models/Route');
    const Trip  = require('./models/Trip');

    const nowDate   = new Date();
    const sevenDaysLater = new Date(nowDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [routes, upcomingTrips] = await Promise.all([
      Route.find({}, 'from to basePrice').lean(),
      // 7 ngày tới — token được giới hạn bằng cap MỖI NGÀY bên dưới, không phải độ rộng cửa sổ
      Trip.find({ status: 'scheduled', departureTime: { $gte: nowDate, $lte: sevenDaysLater } })
        .populate('route', 'from to').populate('bus', 'type')
        .sort('departureTime').limit(500).lean(),
    ]);

    // Tuyến đường — NGUỒN CHUẨN lấy từ Route thật (không đoán). Build adjacency từ DB.
    const cities = [...new Set(routes.flatMap(r => [r.from, r.to]).filter(Boolean))].sort();
    const minPrice = routes.reduce((mn, r) => (r.basePrice && r.basePrice < mn ? r.basePrice : mn), Infinity);
    const priceFrom = fmt(minPrice === Infinity ? 100000 : minPrice);
    const adj = new Map(cities.map(c => [c, new Set()]));
    for (const r of routes) { if (r.from && r.to && adj.has(r.from)) adj.get(r.from).add(r.to); }
    // Full-mesh = mọi TP nối tới tất cả TP còn lại → câu gọn; nếu không → liệt kê điểm đến thực của từng TP
    const isFullMesh = cities.length > 1 && cities.every(c => adj.get(c).size === cities.length - 1);
    const routeInfo = isFullMesh
      ? `Có tuyến xe 2 CHIỀU giữa MỌI cặp trong ${cities.length} thành phố sau:\n${cities.join(', ')}`
      : cities.map(c => `${c} → ${[...adj.get(c)].sort().join(', ') || '(chưa có tuyến)'}`).join('\n');

    const pad = n => String(n).padStart(2, '0');

    function toDateISO(d) {
      const t = new Date(d);
      // convert to Asia/Ho_Chi_Minh offset +7
      const local = new Date(t.getTime() + 7 * 60 * 60 * 1000);
      return `${local.getUTCFullYear()}-${pad(local.getUTCMonth()+1)}-${pad(local.getUTCDate())}`;
    }

    function formatTrip(t) {
      const isSale = t.salePercent > 0 && (!t.saleEndsAt || new Date(t.saleEndsAt) > nowDate);
      const price  = isSale ? Math.round(t.price * (1 - t.salePercent / 100)) : t.price;
      const sale   = isSale ? ` 🔥-${t.salePercent}%` : '';
      const bus    = t.bus ? ` ${t.bus.type}` : '';
      return `${t.route?.from}→${t.route?.to}: ${fmtTime(t.departureTime)} ${fmt(price)}đ${sale} còn ${t.availableSeats ?? '?'}ghế${bus}`;
    }

    // Group theo ngày, lấy 1 chuyến đầu mỗi tuyến mỗi ngày
    const byDate = {};
    for (const t of upcomingTrips) {
      const iso = toDateISO(t.departureTime);
      if (!byDate[iso]) byDate[iso] = [];
      byDate[iso].push(t);
    }

    function pickFirstPerRoute(list) {
      const seen = new Set();
      return list.filter(t => {
        const k = `${t.route?.from}→${t.route?.to}`;
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
    }

    const todayISO = toDateISO(nowDate);
    const tmrDate  = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000);
    const tmrISO   = toDateISO(tmrDate);

    const MAX_PER_DAY = 6;   // cap mỗi ngày → ~7×6=42 dòng, đủ nhẹ cho TPM 6000 nhưng phủ cả tuần
    const tripSection = Object.keys(byDate).sort().map(iso => {
      const dayTrips = byDate[iso];
      let filtered   = pickFirstPerRoute(dayTrips);
      let extra = '';
      if (filtered.length > MAX_PER_DAY) { extra = `\n(và ${filtered.length - MAX_PER_DAY} tuyến khác — xem website)`; filtered = filtered.slice(0, MAX_PER_DAY); }
      const dateLabel = new Date(iso + 'T00:00:00+07:00')
        .toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric', timeZone:'Asia/Ho_Chi_Minh' });
      const tag = iso === todayISO ? ' (HÔM NAY)' : iso === tmrISO ? ' (NGÀY MAI)' : '';
      return `${dateLabel}${tag} — ${dayTrips.length} chuyến:\n` + filtered.map(formatTrip).join('\n') + extra;
    }).join('\n\n');

    const todayCount  = (byDate[todayISO] || []).length;
    const todaySummary = todayCount > 0
      ? `Hôm nay còn ${todayCount} chuyến.`
      : 'Hôm nay không còn chuyến nào.';

    const prompt = `Bạn là trợ lý AI FASTBUS. Hôm nay: ${nowDate.toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric', timeZone:'Asia/Ho_Chi_Minh' })}.
${todaySummary}

TUYẾN ĐƯỜNG ĐANG KHAI THÁC (nguồn chuẩn — CHỈ những tuyến này có thật, giá vé từ ~${priceFrom}đ):
${routeInfo}

CHUYẾN ĐI 7 NGÀY TỚI (mỗi ngày vài tuyến đại diện, hỏi cụ thể sẽ trả lời thêm):
${tripSection}
THÔNG TIN FASTBUS:
- Đặt vé 24/7, chọn ghế, thanh toán FASTPAY hoặc MoMo
- Tích điểm 1% giá vé, dùng điểm giảm tối đa 30%/đơn
- Voucher: nhập mã tại trang thanh toán
- Huỷ vé: vào trang cá nhân → "Lịch sử mua vé" → chọn vé → huỷ. Tiền hoàn về ví FASTPAY
- Vé hết hạn thanh toán sau 15 phút kể từ khi chọn ghế
- Hotline: 1900 599 997

CÁCH TRẢ LỜI:
- Trả lời như nhân viên tư vấn — thân thiện, tự nhiên, đi thẳng vào vấn đề
- Chỉ trả lời đúng điều được hỏi, không giải thích lan man
- KHÔNG BAO GIỜ hiển thị ký tự "|" trong câu trả lời — đó là dữ liệu nội bộ
- Khi liệt kê chuyến đi, LUÔN ghi ngày và tên tuyến, mỗi chuyến 1 dòng theo mẫu:
  📅 [Thứ, ngày/tháng] — [Điểm đi] → [Điểm đến]: 07:00 → 13:30 — 165.000đ — còn 20 ghế — xe giường
  (nếu có sale thêm: 🔥 giảm X%)
- Tối đa 5 chuyến, nếu nhiều hơn ghi "(và X chuyến khác, xem đầy đủ trên website)"
- Hỏi đơn hàng cụ thể: "Bạn vui lòng liên hệ hotline 1900 599 997 hoặc nhắn cho nhân viên hỗ trợ để mình kiểm tra nhé!"

QUAN TRỌNG:
- Mục TUYẾN ĐƯỜNG ĐANG KHAI THÁC là nguồn chuẩn DUY NHẤT về tuyến nào có thật. Nếu tuyến khách hỏi (điểm đi → điểm đến) nằm trong đó → xác nhận "có tuyến" + mời bấm xem giờ/giá (kèm ACTION tag). KHÔNG nói "không có".
- Chỉ trả lời "không có tuyến này" khi tuyến/địa điểm KHÔNG nằm trong TUYẾN ĐƯỜNG ĐANG KHAI THÁC.
- Mục CHUYẾN ĐI chỉ là VÍ DỤ về giá/giờ, KHÔNG đầy đủ. Chỉ nêu giờ/giá/số ghế CỤ THỂ khi nó xuất hiện trong mục CHUYẾN ĐI; nếu không có, nói "bạn bấm xem chi tiết giờ & giá nhé" thay vì bịa số liệu.

ACTION TAG (bắt buộc khi đề cập chuyến cụ thể):
Khi người dùng hỏi về tuyến đường cụ thể và bạn có dữ liệu chuyến đi, hãy thêm vào DÒNG CUỐI CÙNG của câu trả lời:
[ACTION:search:TÊN ĐIỂM ĐI:TÊN ĐIỂM ĐẾN:YYYY-MM-DD]
Ví dụ hôm nay (${todayISO}): [ACTION:search:Hồ Chí Minh:Hà Nội:${todayISO}]
Ví dụ ngày mai (${tmrISO}): [ACTION:search:Đà Nẵng:Hà Nội:${tmrISO}]
Quy tắc:
- Tên điểm phải khớp chính xác với tên trong mục TUYẾN ĐƯỜNG ĐANG KHAI THÁC ở trên
- Chỉ thêm khi đề cập chuyến cụ thể, KHÔNG thêm khi hỏi chung chung về giá/chính sách
- Không giải thích hay nhắc đến tag này trong câu trả lời`;

    _promptCache    = prompt;
    _promptCachedAt = Date.now();
    return prompt;
  } catch (err) {
    console.error('[AI Chat] buildSystemPrompt error:', err.message);
    const fallback = `Bạn là trợ lý AI FASTBUS. Trả lời ngắn gọn bằng tiếng Việt về vé xe, thanh toán, tài khoản. Hỏi đơn hàng cụ thể: "Nhân viên sẽ phản hồi bạn sớm! 🙏"`;
    _promptCache    = fallback;
    _promptCachedAt = Date.now();
    return fallback;
  }
}

async function getAIReply(userMessage, history = []) {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const client       = getClient();
    const systemPrompt = await buildSystemPrompt();

    const messages = [{ role: 'system', content: systemPrompt }];
    // Chỉ giữ 6 tin nhắn gần nhất để giảm token
    const recentHistory = history.slice(-7, -1);
    for (const msg of recentHistory) {
      messages.push({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content });
    }
    messages.push({ role: 'user', content: userMessage });

    const completion = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: 320,
      temperature: 0.4,
    });

    let text = completion.choices[0]?.message?.content?.trim() || null;
    if (!text) return null;

    let action = null;
    const m = text.match(/\[ACTION:search:([^\]:]+):([^\]:]+):(\d{4}-\d{2}-\d{2})\]/);
    if (m) {
      action = { type: 'search', from: m[1].trim(), to: m[2].trim(), date: m[3] };
      text = text.replace(m[0], '').trim();
    }
    return { text, action };
  } catch (err) {
    console.error('[AI Chat] Lỗi Groq API:', err.message);
    return null;
  }
}

// Warm up cache khi server khởi động
buildSystemPrompt().catch(() => {});

module.exports = { getAIReply };
