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
      Route.find({}).lean(),
      // 7 ngày tới: lấy tất cả chuyến, sau đó group và pick theo ngày
      Trip.find({ status: 'scheduled', departureTime: { $gte: nowDate, $lte: sevenDaysLater } })
        .populate('route', 'from to').populate('bus', 'type seatCount')
        .sort('departureTime').limit(500).lean(),
    ]);

    // Tuyến đường (compact)
    const routeSection = routes.map(r => {
      const h = r.duration ? Math.floor(r.duration / 60) : 0;
      const m = r.duration ? r.duration % 60 : 0;
      const dur = r.duration ? `${h > 0 ? h + 'h' : ''}${m > 0 ? m + 'p' : ''}` : '';
      return `${r.from}→${r.to}: ${r.distance ?? '?'}km ${dur} từ ${fmt(r.basePrice)}đ`;
    }).join('\n');

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
      const arr    = t.arrivalTime ? `→${fmtTime(t.arrivalTime)}` : '';
      const sale   = isSale ? ` 🔥-${t.salePercent}%` : '';
      const bus    = t.bus ? ` ${t.bus.type}` : '';
      return `${t.route?.from}→${t.route?.to}: ${fmtTime(t.departureTime)}${arr} ${fmt(price)}đ${sale} còn ${t.availableSeats ?? '?'}ghế${bus}`;
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

    const tripSection = Object.keys(byDate).sort().map(iso => {
      const dayTrips   = byDate[iso];
      const filtered   = pickFirstPerRoute(dayTrips);
      const dateLabel  = new Date(iso + 'T00:00:00+07:00')
        .toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric', timeZone:'Asia/Ho_Chi_Minh' });
      const tag = iso === todayISO ? ' (HÔM NAY)' : iso === tmrISO ? ' (NGÀY MAI)' : '';
      return `${dateLabel}${tag} — ${dayTrips.length} chuyến:\n` + filtered.map(formatTrip).join('\n');
    }).join('\n\n');

    const todayCount  = (byDate[todayISO] || []).length;
    const todaySummary = todayCount > 0
      ? `Hôm nay còn ${todayCount} chuyến.`
      : 'Hôm nay không còn chuyến nào.';

    const prompt = `Bạn là trợ lý AI FASTBUS. Hôm nay: ${nowDate.toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric', timeZone:'Asia/Ho_Chi_Minh' })}.
${todaySummary}

TUYẾN ĐƯỜNG (from→to|km|thời gian|giá):
${routeSection}

CHUYẾN ĐI (1 chuyến đại diện mỗi tuyến, hỏi cụ thể sẽ trả lời thêm):
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

QUAN TRỌNG — KHÔNG BỊA DỮ LIỆU CHUYẾN ĐI:
- CHỈ được dùng thông tin giờ, giá, số ghế từ mục CHUYẾN ĐI bên trên
- Nếu không tìm thấy chuyến cho tuyến đó trong CHUYẾN ĐI, PHẢI trả lời: "Hiện không có lịch chuyến [tuyến đó] trong 7 ngày tới. Bạn vui lòng tìm kiếm trên website để xem lịch đầy đủ nhé!"
- TUYỆT ĐỐI không tự tạo ra giờ khởi hành, giá vé, số ghế — chỉ dùng đúng số liệu đã có

ACTION TAG (bắt buộc khi đề cập chuyến cụ thể):
Khi người dùng hỏi về tuyến đường cụ thể và bạn có dữ liệu chuyến đi, hãy thêm vào DÒNG CUỐI CÙNG của câu trả lời:
[ACTION:search:TÊN ĐIỂM ĐI:TÊN ĐIỂM ĐẾN:YYYY-MM-DD]
Ví dụ hôm nay (${todayISO}): [ACTION:search:Hồ Chí Minh:Hà Nội:${todayISO}]
Ví dụ ngày mai (${tmrISO}): [ACTION:search:Đà Nẵng:Hà Nội:${tmrISO}]
Quy tắc:
- Tên điểm phải khớp chính xác với tên trong dữ liệu TUYẾN ĐƯỜNG ở trên
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
