const Groq = require('groq-sdk');

let _client = null;
function getClient() {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

function fmt(n)     { return n?.toLocaleString('vi-VN') ?? '?'; }
function fmtTime(d) { return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }); }
function fmtDate(d) { return new Date(d).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }); }

// ── Chuẩn hoá tiếng Việt (bỏ dấu) để match tên thành phố trong câu hỏi ──
function stripAccent(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}
function normVN(s) {                 // bỏ dấu + bỏ ký tự đặc biệt → match tên TP
  return stripAccent(s).replace(/[^a-z0-9]+/g, ' ').trim();
}
const CITY_ALIAS = {
  'TP. Hồ Chí Minh': ['ho chi minh', 'hcm', 'sai gon', 'saigon', 'tphcm', 'sg'],
  'Hà Nội': ['ha noi', 'hn'],
  'Đà Nẵng': ['da nang', 'dn'],
  'Đà Lạt': ['da lat', 'dalat', 'dl'],
  'Nha Trang': ['nha trang', 'nt'],
  'Cần Thơ': ['can tho', 'ct'],
  'Vũng Tàu': ['vung tau', 'vt'],
  'Hải Phòng': ['hai phong', 'hp'],
  'Buôn Ma Thuột': ['buon ma thuot', 'bmt', 'ban me thuot'],
};
function cityTokens(name) { return [...new Set([normVN(name), ...(CITY_ALIAS[name] || [])])].filter(Boolean); }

// ── Ngày theo giờ VN (UTC+7) ──
function vnYMD(d) { const t = new Date(d.getTime() + 7 * 3600 * 1000); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
function vnDayRangeUTC(y, m, d) { const start = new Date(Date.UTC(y, m - 1, d) - 7 * 3600 * 1000); return { start, end: new Date(start.getTime() + 24 * 3600 * 1000) }; }
function isoYMD({ y, m, d }) { const p = n => String(n).padStart(2, '0'); return `${y}-${p(m)}-${p(d)}`; }

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
- Nếu CUỐI prompt có mục "KẾT QUẢ TÌM CHUYẾN" → đó là DỮ LIỆU THẬT cho đúng tuyến/ngày khách hỏi: hãy trả lời chi tiết bằng CHÍNH XÁC giờ/giá/ghế trong đó (tối đa 5 chuyến tiêu biểu), KHÔNG nói "bấm xem" nữa. Nếu mục đó báo "chưa có chuyến" thì nói đúng vậy + gợi ý ngày khác.

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

// ── Gemini (primary — free tier rộng, chất lượng tốt hơn llama-8b) ──
const { GoogleGenerativeAI } = require('@google/generative-ai');
let _gemini = null;
function getGemini() {
  if (!_gemini && process.env.GEMINI_API_KEY) _gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return _gemini;
}

async function callGemini(systemPrompt, history, userMessage) {
  const g = getGemini();
  if (!g) return null;
  const model = g.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: 800, temperature: 0.4 },
  }, { timeout: 7000 });  // fail nhanh để fallback Groq, tránh SDK retry 503 kéo dài ~44s
  const contents = [];
  for (const msg of history.slice(-7, -1)) {
    contents.push({ role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] });
  }
  // Gemini yêu cầu content đầu phải là 'user'
  while (contents.length && contents[0].role === 'model') contents.shift();
  contents.push({ role: 'user', parts: [{ text: userMessage }] });
  const r = await model.generateContent({ contents });
  return r.response.text()?.trim() || null;
}

// ── Groq (primary) — prompt gọn nên vừa TPM 6000 ──
async function callGroq(systemPrompt, history, userMessage, model) {
  if (!process.env.GROQ_API_KEY) return null;
  const client = getClient();
  const messages = [{ role: 'system', content: systemPrompt }];
  for (const msg of history.slice(-7, -1)) {
    messages.push({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.content });
  }
  messages.push({ role: 'user', content: userMessage });
  const completion = await client.chat.completions.create({
    model, messages, max_tokens: 320, temperature: 0.4,
  });
  return completion.choices[0]?.message?.content?.trim() || null;
}

// ── Targeted retrieval: tách tuyến + ngày từ câu hỏi → query chuyến THẬT ──
let _routesCache = null, _routesCachedAt = 0;
async function getRoutesCached() {
  const now = Date.now();
  if (_routesCache && now - _routesCachedAt < PROMPT_TTL) return _routesCache;
  _routesCache = await require('./models/Route').find({}, 'from to').lean();
  _routesCachedAt = now;
  return _routesCache;
}

function detectRoute(message, routes) {
  const msgN = ' ' + normVN(message) + ' ';
  const cities = [...new Set(routes.flatMap(r => [r.from, r.to]).filter(Boolean))];
  const hits = [];
  for (const c of cities) {
    let idx = -1;
    for (const tok of cityTokens(c)) {
      const p = msgN.indexOf(' ' + tok + ' ');   // match nguyên từ → tránh "thuê"→"hue"
      if (p >= 0 && (idx < 0 || p < idx)) idx = p;
    }
    if (idx >= 0) hits.push({ city: c, idx });
  }
  hits.sort((a, b) => a.idx - b.idx);
  const uniq = [];
  for (const h of hits) if (!uniq.some(u => u.city === h.city)) uniq.push(h);
  if (uniq.length < 2) return null;               // cần đủ 2 thành phố (theo thứ tự xuất hiện)
  return { from: uniq[0].city, to: uniq[1].city };
}

function detectDate(message, todayVN) {
  const s = stripAccent(message);                 // giữ "/" và "-" để bắt dd/mm
  if (/ngay\s*kia|hom\s*kia/.test(s)) return vnYMD(new Date(Date.now() + 2 * 86400000));
  if (/ngay\s*mai|\bmai\b/.test(s))   return vnYMD(new Date(Date.now() + 1 * 86400000));
  const m = s.match(/\b(\d{1,2})\s*[\/\-]\s*(\d{1,2})\b/);
  if (m) { const dd = +m[1], mm = +m[2]; if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) return { y: todayVN.y, m: mm, d: dd }; }
  return todayVN;
}

async function retrieveTrips(message) {
  const routes = await getRoutesCached();
  const det = detectRoute(message, routes);
  if (!det) return null;   // không phải câu hỏi tuyến cụ thể → để prompt chung lo

  const dateYMD = detectDate(message, vnYMD(new Date()));
  const action  = { type: 'search', from: det.from, to: det.to, date: isoYMD(dateYMD) };
  const route   = routes.find(r => r.from === det.from && r.to === det.to);
  const label   = `${det.from} → ${det.to}, ngày ${String(dateYMD.d).padStart(2, '0')}/${String(dateYMD.m).padStart(2, '0')}`;

  if (!route) return { action, block: `KẾT QUẢ TÌM CHUYẾN: tuyến ${det.from} → ${det.to} hiện KHÔNG có trong hệ thống.` };

  const { start, end } = vnDayRangeUTC(dateYMD.y, dateYMD.m, dateYMD.d);
  const trips = await require('./models/Trip')
    .find({ route: route._id, status: 'scheduled', departureTime: { $gte: start, $lt: end } })
    .populate('bus', 'type').sort('departureTime').limit(12).lean();

  if (!trips.length)
    return { action, block: `KẾT QUẢ TÌM CHUYẾN ${label}: chưa có chuyến nào trong ngày này (tuyến CÓ khai thác — gợi ý khách thử ngày khác hoặc xem website).` };

  const now = new Date();
  const lines = trips.map(t => {
    const isSale = t.salePercent > 0 && (!t.saleEndsAt || new Date(t.saleEndsAt) > now);
    const price  = isSale ? Math.round(t.price * (1 - t.salePercent / 100)) : t.price;
    const arr    = t.arrivalTime ? `→${fmtTime(t.arrivalTime)}` : '';
    const sale   = isSale ? ` 🔥-${t.salePercent}%` : '';
    const bus    = t.bus ? ` ${t.bus.type}` : '';
    return `• ${fmtTime(t.departureTime)}${arr} — ${fmt(price)}đ${sale} — còn ${t.availableSeats ?? '?'} ghế${bus}`;
  }).join('\n');
  return { action, block: `KẾT QUẢ TÌM CHUYẾN ${label} (DỮ LIỆU THẬT — BẮT BUỘC liệt kê các chuyến dưới đây cho khách bằng đúng số liệu này, TỐI ĐA 5 chuyến, TUYỆT ĐỐI KHÔNG nói "bấm xem"):\n${lines}` };
}

async function getAIReply(userMessage, history = []) {
  const systemPrompt = await buildSystemPrompt();

  // Targeted retrieval: nếu hỏi tuyến cụ thể → nhồi chuyến thật + lấy ACTION deterministic
  let retrieval = null;
  try { retrieval = await retrieveTrips(userMessage); }
  catch (err) { console.error('[AI Chat] retrieve lỗi:', err.message); }
  const sys = systemPrompt + (retrieval?.block ? `\n\n${retrieval.block}` : '');

  // Chuỗi provider: Groq 70b (chất lượng) → Groq 8b (RPD cao) → Gemini (khi Groq cạn TPM 6000)
  const attempts = [
    ['groq:llama-3.3-70b', () => callGroq(sys, history, userMessage, 'llama-3.3-70b-versatile')],
    ['groq:llama-3.1-8b',  () => callGroq(sys, history, userMessage, 'llama-3.1-8b-instant')],
    ['gemini:2.5-flash',   () => callGemini(sys, history, userMessage)],
  ];
  let text = null;
  for (const [name, fn] of attempts) {
    try { text = await fn(); if (text) break; }
    catch (err) { console.error(`[AI Chat] ${name} lỗi → thử tiếp:`, err.message); }
  }
  if (!text) return null;

  // ACTION: ưu tiên retrieval (chắc chắn); nếu không có thì parse tag model xuất ra
  let action = retrieval?.action || null;
  if (!action) {
    const m = text.match(/\[ACTION:search:([^\]:]+):([^\]:]+):(\d{4}-\d{2}-\d{2})\]/);
    if (m) action = { type: 'search', from: m[1].trim(), to: m[2].trim(), date: m[3] };
  }
  text = text.replace(/\[ACTION:search:[^\]]*\]/g, '').trim();   // luôn xoá MỌI tag (kể cả tag rỗng/hỏng)
  return { text, action };
}

// Warm up cache khi server khởi động
buildSystemPrompt().catch(() => {});

module.exports = { getAIReply };
