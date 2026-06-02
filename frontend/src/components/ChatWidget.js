import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatGetMessages, chatSend, chatGetUnread, chatGetStatus, chatAI } from '../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const C = {
  orange:     '#1D7DB8',
  orangeDark: '#0f5f8c',
  indigo:     '#6366f1',
  indigoDark: '#4f46e5',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function createGuestId() {
  const id = 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  localStorage.setItem('chatGuestId', id);
  return id;
}
function getOrCreateGuestId() {
  return localStorage.getItem('chatGuestId') || createGuestId();
}
function loadAIHistory() {
  try { return JSON.parse(localStorage.getItem('aiChatHistory') || '[]'); } catch { return []; }
}
function saveAIHistory(msgs) {
  try { localStorage.setItem('aiChatHistory', JSON.stringify(msgs.slice(-40))); } catch {}
}

// ─── Simple markdown renderer ─────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const result = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      result.push(
        <ul key={`ul-${result.length}`} style={{ margin: '4px 0', paddingLeft: 18 }}>
          {listItems.map((item, i) => <li key={i} style={{ marginBottom: 2 }}>{inlineRender(item)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const listMatch = line.match(/^[-•*]\s+(.+)/);
    const numMatch  = line.match(/^\d+\.\s+(.+)/);
    if (listMatch || numMatch) {
      listItems.push((listMatch || numMatch)[1]);
      return;
    }
    flushList();
    if (!line.trim()) {
      result.push(<br key={`br-${i}`}/>);
    } else {
      result.push(<span key={`ln-${i}`} style={{ display: 'block' }}>{inlineRender(line)}</span>);
    }
  });
  flushList();
  return result;
}

function inlineRender(text) {
  // bold, italic, inline code
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index}>{m[3]}</em>);
    else if (m[4]) parts.push(
      <code key={m.index} style={{ background: 'rgba(99,102,241,0.12)', padding: '1px 5px', borderRadius: 4, fontSize: '0.9em', fontFamily: 'monospace' }}>
        {m[4]}
      </code>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

// ─── Auto-resize textarea ─────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, onSubmit, placeholder, disabled }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      const h = ref.current.scrollHeight;
      ref.current.style.height = (h > 0 ? Math.min(h, 100) : 22) + 'px';
    }
  }, [value]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={handleKey}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      maxLength={1000}
      style={{
        flex: 1, resize: 'none', border: 'none', outline: 'none',
        background: 'transparent', fontSize: 13, lineHeight: 1.5,
        fontFamily: 'inherit', color: '#1a202c', padding: '2px 0',
        overflowY: 'hidden', minHeight: 22,
      }}
    />
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots({ color = C.indigo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%', background: color,
          animation: `chatTyping 1.2s ${i * 0.2}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isUser, isBot, isFirst, isLast }) {
  const bg      = isUser ? `linear-gradient(135deg, ${C.orangeDark}, ${C.orange})` : isBot ? '#f0f4ff' : '#f0f4f8';
  const color   = isUser ? '#fff' : '#1a202c';
  const radius  = isUser
    ? `18px 18px ${isLast ? '4px' : '18px'} 18px`
    : `18px 18px 18px ${isLast ? '4px' : '18px'}`;

  return (
    <div style={{
      padding: '9px 14px',
      background: bg,
      color,
      borderRadius: radius,
      fontSize: 13,
      lineHeight: 1.6,
      wordBreak: 'break-word',
      boxShadow: isUser ? '0 2px 8px rgba(29,125,184,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
      borderLeft: isBot && isFirst ? `3px solid ${C.indigo}` : undefined,
      animation: 'msgIn 0.18s ease-out',
    }}>
      {isBot ? renderMarkdown(msg.content) : msg.content}
    </div>
  );
}

// ─── Quick reply chips ─────────────────────────────────────────────────────────
const QUICK_REPLIES = [
  '🚌 Các tuyến xe có sẵn?',
  '🎫 Cách đặt vé như thế nào?',
  '💳 Ví FASTPAY là gì?',
  '❌ Chính sách huỷ vé?',
];

// ════════════════════════════════════════════════════════════════════════════════
//  AI CHAT PANEL
// ════════════════════════════════════════════════════════════════════════════════
function AIChatPanel() {
  const navigate   = useNavigate();
  const [messages, setMessages] = useState(() => loadAIHistory());
  const [input,    setInput]    = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);
  useEffect(() => { saveAIHistory(messages); }, [messages]);

  const send = useCallback(async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || thinking) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: trimmed, ts: new Date().toISOString() };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setThinking(true);

    try {
      const history = nextMsgs.map(m => ({ sender: m.role === 'user' ? 'user' : 'bot', content: m.content }));
      const res = await chatAI({ message: trimmed, history });
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        content: res.data.reply,
        action: res.data.action || null,
        ts: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        content: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ nhân viên hỗ trợ.',
        ts: new Date().toISOString(),
      }]);
    } finally { setThinking(false); }
  }, [input, messages, thinking]);

  // Group consecutive messages from same sender
  const grouped = messages.map((msg, i) => ({
    ...msg,
    isFirst: i === 0 || messages[i-1].role !== msg.role,
    isLast:  i === messages.length - 1 || messages[i+1].role !== msg.role,
  }));

  return (
    <>
      <div style={s.body}>
        {messages.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.aiGlow}>
              <span style={{ fontSize: 28 }}>🤖</span>
            </div>
            <p style={{ fontWeight: 700, color: '#1e1b4b', margin: '12px 0 4px', fontSize: 15 }}>
              FASTBUS AI
            </p>
            <p style={{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.8, margin: '0 0 16px' }}>
              Hỏi về tuyến xe, giá vé, chính sách...
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
              {QUICK_REPLIES.map(q => (
                <button key={q} onClick={() => send(q)} style={s.quickChip}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => { setMessages([]); localStorage.removeItem('aiChatHistory'); }}
              style={s.clearBtn}>
              Đoạn chat mới
            </button>

            {grouped.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: msg.isLast ? 10 : 3,
                alignItems: 'flex-end', gap: 7,
              }}>
                {msg.role === 'bot' && (
                  <div style={{ ...s.senderAvatar, background: `linear-gradient(135deg, ${C.indigoDark}, ${C.indigo})`, opacity: msg.isLast ? 1 : 0, flexShrink: 0 }}>
                    🤖
                  </div>
                )}
                <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column',
                              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 2 }}>
                  <MessageBubble msg={msg} isUser={msg.role === 'user'} isBot={msg.role === 'bot'}
                    isFirst={msg.isFirst} isLast={msg.isLast}/>
                  {msg.role === 'bot' && msg.action?.type === 'search' && (
                    <button onClick={() => navigate(
                      `/search?from=${encodeURIComponent(msg.action.from)}&to=${encodeURIComponent(msg.action.to)}&date=${msg.action.date}`
                    )} style={{
                      marginTop: 4, background: C.orange, color: '#fff', border: 'none',
                      borderRadius: 20, padding: '7px 14px', fontSize: 12.5, fontWeight: 700,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                      boxShadow: '0 2px 8px rgba(29,125,184,0.35)',
                    }}>
                      🎫 Xem chuyến &amp; Đặt vé →
                    </button>
                  )}
                  {msg.isLast && (
                    <span style={{ fontSize: 10, color: '#c0c0c0', padding: '0 4px' }}>{fmtTime(msg.ts)}</span>
                  )}
                </div>
              </div>
            ))}

            {thinking && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, marginBottom: 10 }}>
                <div style={{ ...s.senderAvatar, background: `linear-gradient(135deg, ${C.indigoDark}, ${C.indigo})` }}>🤖</div>
                <div style={{ background: '#f0f4ff', borderRadius: '18px 18px 18px 4px',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `3px solid ${C.indigo}` }}>
                  <TypingDots color={C.indigo}/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </>
        )}
      </div>

      <div style={s.inputWrap}>
        <AutoTextarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onSubmit={() => send()}
          placeholder="Nhập tin nhắn..."
          disabled={thinking}
        />
        <button onClick={() => send()} disabled={!input.trim() || thinking}
          style={{ ...s.sendBtn, background: `linear-gradient(135deg, ${C.indigoDark}, ${C.indigo})`,
                   opacity: (!input.trim() || thinking) ? 0.45 : 1 }}>
          <SendIcon/>
        </button>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SUPPORT CHAT PANEL
// ════════════════════════════════════════════════════════════════════════════════
function SupportChatPanel({ user, isVisible }) {
  // guestId trong state để khi tạo mới thì re-fetch
  const [guestId,     setGuestId]     = useState(() => user ? null : getOrCreateGuestId());
  const [messages,    setMessages]    = useState([]);
  const [convStatus,  setConvStatus]  = useState('active'); // 'active' | 'completed'
  const [input,       setInput]       = useState('');
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const bottomRef        = useRef(null);
  const initialScroll    = useRef(false);

  // Cuộn xuống cuối khi load lần đầu (không animation)
  useEffect(() => {
    if (!loading && !initialScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      initialScroll.current = true;
    }
  }, [loading]);

  // Cuộn xuống cuối khi có tin mới
  useEffect(() => {
    if (initialScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const params = user ? {} : { guestId };

  const fetchAll = useCallback(async () => {
    try {
      const [msgRes, statusRes] = await Promise.all([
        chatGetMessages(params),
        chatGetStatus(params),
      ]);
      setMessages(msgRes.data);
      setConvStatus(statusRes.data.status || 'active');
    } catch {} finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, guestId]);

  // Initial fetch — chỉ chạy khi component mount hoặc user/guestId đổi
  useEffect(() => {
    initialScroll.current = false;
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  // SSE realtime — nhận tin admin trả lời ngay lập tức
  useEffect(() => {
    const base  = process.env.REACT_APP_API_URL || 'https://booking.longvan.vn/api';
    const token = localStorage.getItem('token');
    const qs = (user && token) ? `token=${encodeURIComponent(token)}`
             : (guestId ? `guestId=${encodeURIComponent(guestId)}` : null);
    if (!qs) return;
    const es = new EventSource(`${base}/chat/events?${qs}`);
    es.onmessage = (e) => {
      try {
        const t = JSON.parse(e.data)?.type;
        if (t === 'new_message' || t === 'status_changed') fetchAll();  // fetchAll lấy cả messages + status
      } catch (_) {}
    };
    return () => es.close();
  }, [user, guestId, fetchAll]);

  // Polling fallback — giãn 15s (SSE lo realtime); chỉ chạy khi panel mở
  useEffect(() => {
    const iv = setInterval(() => { if (isVisible) fetchAll(); }, 15000);
    return () => clearInterval(iv);
  }, [fetchAll, isVisible]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic = { _id: `tmp-${Date.now()}`, sender: 'user', content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    try {
      const payload = { content: text };
      if (!user) payload.guestId = guestId;
      const res = await chatSend(payload);
      setMessages(prev => prev.map(m => m._id === optimistic._id ? res.data : m));
      setConvStatus('active'); // backend auto-reopen, cập nhật local luôn
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setInput(text);
    } finally { setSending(false); }
  }, [input, sending, user, guestId]);

  // Khách tạo hội thoại mới sau khi admin hoàn thành
  const handleNewConversation = () => {
    localStorage.removeItem('chatGuestId');
    const newId = createGuestId();
    setGuestId(newId);
    setMessages([]);
    setConvStatus('active');
    initialScroll.current = false;
  };

  const isCompleted = convStatus === 'completed';

  // Group by day + consecutive sender
  const grouped = messages.map((msg, i) => ({
    ...msg,
    showDay: i === 0 || new Date(messages[i-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString(),
    isLast:  i === messages.length - 1 || messages[i+1].sender !== msg.sender,
  }));

  return (
    <>
      <div style={s.body}>
        {loading ? (
          <div style={s.center}><div style={s.spinner}/></div>
        ) : grouped.length === 0 ? (
          /* Chưa có tin nhắn */
          <div style={s.emptyState}>
            <div style={{ ...s.aiGlow, background: 'linear-gradient(135deg, #E3F1FA, #C8D5E4)' }}>
              <span style={{ fontSize: 28 }}>👨‍💼</span>
            </div>
            <p style={{ fontWeight: 700, color: '#0C1825', margin: '12px 0 4px', fontSize: 15 }}>
              Hỗ trợ khách hàng
            </p>
            <p style={{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.8, margin: 0 }}>
              Chat với nhân viên FASTBUS
            </p>
          </div>
        ) : (
          /* Tin nhắn */
          <>
            {grouped.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg._id}>
                  {msg.showDay && (
                    <div style={s.dayLabel}>
                      {new Date(msg.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
                                marginBottom: msg.isLast ? 10 : 3, alignItems: 'flex-end', gap: 7 }}>
                    {!isUser && (
                      <div style={{ ...s.senderAvatar, background: `linear-gradient(135deg, ${C.orangeDark}, ${C.orange})`,
                                    opacity: msg.isLast ? 1 : 0, fontSize: 11, fontWeight: 800 }}>F</div>
                    )}
                    <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column',
                                  alignItems: isUser ? 'flex-end' : 'flex-start', gap: 2 }}>
                      <MessageBubble msg={msg} isUser={isUser} isFirst isLast={msg.isLast}/>
                      {msg.isLast && (
                        <span style={{ fontSize: 10, color: '#c0c0c0', padding: '0 4px' }}>{fmtTime(msg.createdAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Banner khi hội thoại đã hoàn thành */}
            {isCompleted && (
              <div style={{ margin: '12px 0 4px', padding: '14px 16px', background: '#f8fafc',
                            border: '1px solid #e2e8f0', borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  Hội thoại đã được giải quyết
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                  Nếu bạn cần hỗ trợ thêm, hãy bắt đầu cuộc trò chuyện mới.
                </div>
                {!user && (
                  <button onClick={handleNewConversation}
                    style={{ padding: '8px 20px', background: C.orangeDark, color: '#fff', border: 'none',
                             borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Bắt đầu hội thoại mới
                  </button>
                )}
              </div>
            )}
            <div ref={bottomRef}/>
          </>
        )}
      </div>

      {/* Input — ẩn khi completed và là khách (user đăng nhập vẫn gửi được để auto-reopen) */}
      {(!isCompleted || user) && (
        <div style={s.inputWrap}>
          <AutoTextarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onSubmit={handleSend}
            placeholder="Nhập tin nhắn..."
            disabled={sending}
          />
          <button onClick={handleSend} disabled={!input.trim() || sending}
            style={{ ...s.sendBtn, background: `linear-gradient(135deg, ${C.orangeDark}, ${C.orange})`,
                     opacity: !input.trim() ? 0.45 : 1 }}>
            {sending ? <SpinIcon/> : <SendIcon/>}
          </button>
        </div>
      )}
    </>
  );
}

// ─── SVG icons ─────────────────────────────────────────────────────────────────
function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}
function SpinIcon() {
  return <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'chatSpin 0.7s linear infinite' }}/>;
}

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN WIDGET
// ════════════════════════════════════════════════════════════════════════════════
export default function ChatWidget() {
  const { user } = useAuth();
  if (user?.role === 'admin') return null;
  return <ChatWidgetInner user={user}/>;
}

function ChatWidgetInner({ user }) {
  const [open,     setOpen]     = useState(false);
  const [unread,   setUnread]   = useState(0);
  const [chatMode, setChatMode] = useState('ai');

  useEffect(() => {
    if (open) return;
    const fetch = async () => {
      try {
        const params = user ? {} : { guestId: getOrCreateGuestId() };
        const res = await chatGetUnread(params);
        setUnread(res.data.count);
      } catch {}
    };
    fetch();
    const iv = setInterval(fetch, 30000);
    return () => clearInterval(iv);
  }, [user, open]);

  const isAI = chatMode === 'ai';
  const headerGrad = isAI
    ? `linear-gradient(135deg, ${C.indigoDark}, ${C.indigo}, #818cf8)`
    : `linear-gradient(135deg, ${C.orangeDark}, ${C.orange}, #4AACE0)`;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) setUnread(0); }}
        className="chat-fab"
        style={{ ...s.fab, background: open ? '#475569' : C.orangeDark }}
        title="Chat hỗ trợ"
      >
        {open
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        }
        {!open && unread > 0 && <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>}
        {!open && <div style={s.fabPulse}/>}
      </button>

      {/* Panel — luôn mount, dùng CSS ẩn/hiện để tránh re-fetch mỗi lần mở */}
      <div className="chat-panel" style={{ ...s.panel, display: open ? 'flex' : 'none' }}>
          {/* Header */}
          <div style={{ ...s.header, background: headerGrad }}>
            <div style={s.headerLeft}>
              <div style={s.headerAvatar}>
                <span style={{ fontSize: 18 }}>{isAI ? '🤖' : '👨‍💼'}</span>
                <span style={s.onlineDot}/>
              </div>
              <div>
                <div style={s.headerTitle}>{isAI ? 'FASTBUS AI' : 'Hỗ trợ khách hàng'}</div>
                <div style={s.headerSub}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }}/>
                  {isAI ? 'Phản hồi tức thì' : 'Luôn sẵn sàng'}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={s.closeBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={s.tabBar}>
            {[['ai', '🤖', 'Trợ lý AI', C.indigo], ['support', '👨‍💼', 'Hỗ trợ trực tiếp', C.orangeDark]].map(([mode, icon, label, color]) => (
              <button key={mode} onClick={() => setChatMode(mode)}
                style={{ ...s.tab, color: chatMode === mode ? color : '#9ca3af',
                         borderBottomColor: chatMode === mode ? color : 'transparent',
                         background: chatMode === mode ? `${color}0d` : 'transparent' }}>
                <span>{icon}</span> {label}
                {mode === 'support' && unread > 0 && chatMode !== 'support' && (
                  <span style={{ ...s.badge, position: 'relative', top: 0, right: 0, marginLeft: 4, width: 16, height: 16, fontSize: 10 }}>{unread}</span>
                )}
              </button>
            ))}
          </div>

          {/* Content — cả hai panel mount sẵn, ẩn bằng display:none */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ display: chatMode === 'ai' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <AIChatPanel/>
            </div>
            <div style={{ display: chatMode === 'support' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
              <SupportChatPanel user={user} isVisible={open && chatMode === 'support'}/>
            </div>
          </div>
        </div>

      <style>{`
        @keyframes chatTyping {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes chatSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fabPulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .chat-input-wrap:focus-within {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
        }
        .chat-quick-chip:hover {
          background: linear-gradient(135deg, ${C.indigoDark}, ${C.indigo}) !important;
          color: #fff !important;
          border-color: transparent !important;
          transform: translateY(-1px);
        }
        .chat-clear-btn:hover { background: #fee2e2 !important; color: #dc2626 !important; }
        @media (max-width: 480px) {
          .chat-panel { width: calc(100vw - 24px) !important; right: 12px !important; bottom: 80px !important; height: 70vh !important; max-height: 500px !important; }
          .chat-fab   { bottom: 16px !important; right: 16px !important; }
        }
      `}</style>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  fab: {
    position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
    width: 56, height: 56, borderRadius: '50%',
    color: '#fff', border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(29,125,184,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
  },
  fabPulse: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    background: C.orangeDark, animation: 'fabPulse 2s ease-out infinite', zIndex: -1,
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700,
    width: 20, height: 20, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid #fff',
  },
  panel: {
    position: 'fixed', bottom: 96, right: 28, zIndex: 9998,
    width: 348, height: 540,
    background: '#fff', borderRadius: 20,
    boxShadow: '0 12px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    animation: 'chatSlideUp 0.22s cubic-bezier(0.34,1.2,0.64,1)',
  },
  header: {
    padding: '14px 16px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: 11 },
  headerAvatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, position: 'relative',
    border: '2px solid rgba(255,255,255,0.35)',
  },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: '50%',
    background: '#4ade80', border: '2px solid #fff',
    boxShadow: '0 0 6px #4ade80',
  },
  headerTitle: { color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.3 },
  headerSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 },
  closeBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
    width: 30, height: 30, borderRadius: '50%',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  tabBar: { display: 'flex', borderBottom: '1px solid #f0f0f0', flexShrink: 0, background: '#fafafa' },
  tab: {
    flex: 1, padding: '10px 0', border: 'none',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    borderBottom: '2px solid transparent', transition: 'all .18s',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '14px 14px 4px',
    display: 'flex', flexDirection: 'column',
    scrollbarWidth: 'thin', scrollbarColor: '#e0e0e0 transparent',
  },
  center:     { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner:    { width: 28, height: 28, border: '3px solid #eee', borderTop: `3px solid ${C.orangeDark}`, borderRadius: '50%', animation: 'chatSpin 0.8s linear infinite' },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 20px' },
  aiGlow: {
    width: 64, height: 64, borderRadius: '50%',
    background: `linear-gradient(135deg, #eef2ff, #e0e7ff)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 0 0 8px #eef2ff`,
  },
  quickChip: {
    padding: '9px 14px', borderRadius: 22,
    border: `1.5px solid ${C.indigo}33`,
    background: '#f5f3ff', color: '#4338ca',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    textAlign: 'left', transition: 'all 0.18s',
    className: 'chat-quick-chip',
  },
  clearBtn: {
    alignSelf: 'center', marginBottom: 12,
    padding: '4px 14px', borderRadius: 20,
    border: '1px solid #e0e0e0', background: '#fafafa',
    color: '#9ca3af', fontSize: 11, cursor: 'pointer',
    transition: 'all 0.15s',
    className: 'chat-clear-btn',
  },
  dayLabel: {
    textAlign: 'center', fontSize: 11, color: '#c0c0c0',
    margin: '8px 0', letterSpacing: 0.3,
  },
  senderAvatar: {
    width: 28, height: 28, borderRadius: '50%',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 13, flexShrink: 0,
    transition: 'opacity 0.1s',
  },
  inputWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 8px 8px 12px',
    background: '#fff', flexShrink: 0,
    border: '1.5px solid #e8e8e8',
    borderRadius: 14, margin: '0 10px 10px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: '50%',
    color: '#fff', border: 'none', cursor: 'pointer',
    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.2s, transform 0.15s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
};
