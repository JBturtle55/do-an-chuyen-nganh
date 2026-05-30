import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  updateProfile, changePassword,
  getMyBookings, cancelBooking,
  getWallet, walletTopupVnpay, walletWithdraw,
  getPoints,
} from '../services/api';
import { useToast } from '../components/Toast';
import { formatPrice } from '../utils/format';
import useSEO from '../hooks/useSEO';
import ConfirmDialog from '../components/ConfirmDialog';

const P     = '#1D7DB8';
const INK   = '#0C1825';
const INK2  = '#1C3351';
const MUTED = '#5E7A96';
const LINE  = '#C8D5E4';
const SOFT  = '#E3F1FA';
const TEAL  = '#0f766e';

const STATUS_COLOR = { pending:'#d97706', processing:'#d97706', confirmed:'#15803d', completed:'#6b7280', cancelled:'#dc2626' };
const STATUS_BG    = { pending:'#fef9c3', processing:'#fef9c3', confirmed:'#dcfce7', completed:'#f3f4f6', cancelled:'#fee2e2' };

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000];

// ── Modal nạp/rút ────────────────────────────────────────
function AmountModal({ title, color, actionLabel, onConfirm, onClose }) {
  const [raw, setRaw] = useState('');
  const parsed = Number(raw.replace(/\D/g, ''));

  return (
    <div style={ov.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={ov.modal}>
        <div style={{ ...ov.header, background: color }}>
          <span style={{ color:'#fff', fontWeight:800, fontSize:15 }}>{title}</span>
          <button onClick={onClose} style={ov.close}>×</button>
        </div>
        <div style={{ padding:24 }}>
          <label style={f.label}>Số tiền</label>
          <input style={{ ...f.input, fontSize:20, fontWeight:700, textAlign:'right', letterSpacing:'-0.5px' }}
            placeholder="Nhập số tiền..."
            value={parsed > 0 ? parsed.toLocaleString('vi-VN') : ''}
            onChange={e => setRaw(e.target.value.replace(/\D/g,''))}
            autoFocus/>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, margin:'14px 0 22px' }}>
            {QUICK_AMOUNTS.map(a => (
              <button key={a} type="button"
                onClick={() => setRaw(String(a))}
                style={{ ...ov.chip, borderColor: parsed===a ? color : LINE,
                          color: parsed===a ? color : MUTED,
                          background: parsed===a ? `${color}12` : '#fafafa',
                          fontWeight: parsed===a ? 700 : 500 }}>
                {a.toLocaleString('vi-VN')}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={ov.cancelBtn}>Huỷ</button>
            <button disabled={parsed < 10_000}
              onClick={() => onConfirm(parsed)}
              style={{ ...ov.confirmBtn, background:color, opacity: parsed<10_000 ? .4 : 1 }}>
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Điểm thưởng ────────────────────────────────────
function PointsTab() {
  const { addToast } = useToast();
  const [data,    setData]    = useState({ points: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ date: '', type: '' });

  const PT_CONFIG = {
    earn:   { label: 'Nhận điểm', color:'#15803d', sign:'+', bg:'#dcfce7' },
    redeem: { label: 'Dùng điểm', color:'#7c3aed', sign:'−', bg:'#ede9fe' },
  };

  useEffect(() => {
    setLoading(true);
    getPoints()
      .then(r => setData(r.data))
      .catch(() => addToast('Không tải được điểm thưởng', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const filtered = data.transactions.filter(tx => {
    if (filter.type && tx.type !== filter.type) return false;
    if (filter.date) {
      const d = new Date(tx.createdAt).toISOString().split('T')[0];
      if (d !== filter.date) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Balance card */}
      <div style={{ background:'linear-gradient(135deg,#78350f,#b45309,#d97706)', borderRadius:14,
                    padding:'24px 28px', marginBottom:24, display:'flex',
                    justifyContent:'space-between', alignItems:'center',
                    boxShadow:'0 6px 24px rgba(180,83,9,0.28)' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)',
                        marginBottom:8, textTransform:'uppercase', letterSpacing:2 }}>
            Điểm thưởng
          </div>
          {loading
            ? <div style={{ height:44, width:140, background:'rgba(255,255,255,0.2)', borderRadius:8 }}/>
            : <div style={{ fontSize:40, fontWeight:900, color:'#fff', letterSpacing:'-1.5px', lineHeight:1 }}>
                {data.points.toLocaleString('vi-VN')}
                <span style={{ fontSize:18, marginLeft:8, fontWeight:600, opacity:.8 }}>điểm</span>
              </div>
          }
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginTop:8 }}>
            1 điểm = 1đ · Dùng tại bước thanh toán (tối đa 30%/đơn)
          </div>
        </div>
        <div style={{ fontSize:52, opacity:.4 }}>⭐</div>
      </div>

      {/* Cách kiếm điểm */}
      <div style={{ background:'#fffbeb', border:`1px solid #fde68a`, borderRadius:12,
                    padding:'14px 18px', marginBottom:22, fontSize:13, color:'#78350f' }}>
        <div style={{ fontWeight:700, marginBottom:8 }}>Cách kiếm &amp; dùng điểm</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 20px' }}>
          <span>⭐ Mỗi lần đặt vé nhận <strong>1% giá trị</strong> vào điểm</span>
          <span>🎁 Dùng điểm giảm tối đa <strong>30%</strong> mỗi đơn</span>
          <span>💳 Áp dụng cả thanh toán FASTPAY lẫn ATM</span>
          <span>🚫 Không rút thành tiền mặt</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...tbl.filterRow, marginBottom:8 }}>
        <div style={tbl.filterItem}>
          <div style={tbl.filterLabel}>Thời gian</div>
          <input type="date" style={tbl.filterInput}
            value={filter.date} onChange={e => setFilter({ ...filter, date: e.target.value })}/>
        </div>
        <div style={tbl.filterItem}>
          <div style={tbl.filterLabel}>Loại</div>
          <select style={tbl.filterInput} value={filter.type}
            onChange={e => setFilter({ ...filter, type: e.target.value })}>
            <option value="">Tất cả</option>
            <option value="earn">Nhận điểm</option>
            <option value="redeem">Dùng điểm</option>
          </select>
        </div>
        <button onClick={() => setFilter({ date:'', type:'' })} style={tbl.clearBtn}>
          Xoá lọc
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto' }}>
        <table style={tbl.table}>
          <thead>
            <tr style={{ background:'#f8fafc' }}>
              {['Điểm', 'Nội dung', 'Số dư sau', 'Thời gian', 'Loại'].map(h => (
                <th key={h} style={tbl.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={tbl.empty}>Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign:'center', padding:'52px 0', color:MUTED }}>
                  <div style={{ fontSize:44, marginBottom:10 }}>⭐</div>
                  <div style={{ fontSize:14, fontWeight:500 }}>Chưa có giao dịch điểm nào</div>
                </td>
              </tr>
            ) : filtered.map((tx, i) => {
              const cfg = PT_CONFIG[tx.type] || PT_CONFIG.earn;
              return (
                <tr key={tx._id} style={{ background: i%2===0?'#fff':'#fafbfc' }}>
                  <td style={{ ...tbl.td, fontWeight:800, color:cfg.color, fontSize:15 }}>
                    {cfg.sign}{tx.points.toLocaleString('vi-VN')}
                  </td>
                  <td style={{ ...tbl.td, color:MUTED, fontSize:13 }}>{tx.description}</td>
                  <td style={{ ...tbl.td, fontWeight:700, color:INK2 }}>
                    {tx.balance.toLocaleString('vi-VN')} điểm
                  </td>
                  <td style={{ ...tbl.td, fontSize:12, color:MUTED, whiteSpace:'nowrap' }}>
                    {new Date(tx.createdAt).toLocaleString('vi-VN', {
                      day:'2-digit', month:'2-digit', year:'numeric',
                      hour:'2-digit', minute:'2-digit',
                    })}
                  </td>
                  <td style={tbl.td}>
                    <span style={{ ...tbl.badge, background:cfg.bg, color:cfg.color }}>
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: FASTPAY ─────────────────────────────────────────
function WalletTab() {
  const { addToast } = useToast();
  const [data,    setData]    = useState({ balance:0, transactions:[] });
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [acting,  setActing]  = useState(false);
  const [txFilter, setTxFilter] = useState({ date:'', type:'' });

  const TX_CONFIG = {
    topup:   { label:'Nạp tiền',   color:'#15803d', sign:'+' },
    withdraw:{ label:'Rút tiền',   color:'#dc2626', sign:'-' },
    payment: { label:'Thanh toán', color:'#dc2626', sign:'-' },
    refund:  { label:'Hoàn tiền',  color:'#15803d', sign:'+' },
  };

  const load = useCallback(() => {
    setLoading(true);
    getWallet().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleTopup = async (amount) => {
    setActing(true);
    try {
      const r = await walletTopupVnpay(amount);
      window.location.href = r.data.payUrl;
    } catch (err) {
      addToast(err.response?.data?.message || 'Không thể kết nối VNPay', 'error');
      setActing(false);
    }
  };

  const handleWithdraw = async (amount) => {
    setActing(true);
    try {
      const r = await walletWithdraw(amount);
      setData(prev => ({ balance:r.data.balance,
        transactions:[r.data.transaction, ...prev.transactions] }));
      setModal(null);
      addToast(`Rút ${amount.toLocaleString('vi-VN')}đ thành công!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Rút tiền thất bại', 'error');
    } finally { setActing(false); }
  };

  const filtered = data.transactions.filter(tx => {
    if (txFilter.type && tx.type !== txFilter.type) return false;
    if (txFilter.date) {
      const d = new Date(tx.createdAt).toISOString().split('T')[0];
      if (d !== txFilter.date) return false;
    }
    return true;
  });

  return (
    <div>
      {modal === 'topup' && (
        <AmountModal title="Nạp tiền FASTPAY" color={TEAL} actionLabel="Nạp tiền"
          onConfirm={handleTopup} onClose={() => !acting && setModal(null)}/>
      )}
      {modal === 'withdraw' && (
        <AmountModal title="Rút tiền FASTPAY" color="#dc2626" actionLabel="Rút tiền"
          onConfirm={handleWithdraw} onClose={() => !acting && setModal(null)}/>
      )}

      {/* Balance card */}
      <div style={w.balanceCard}>
        <div style={{ flex:1 }}>
          <div style={w.balLabel}>Số dư ví FASTPAY</div>
          {loading
            ? <div style={{ height:40, width:170, background:'rgba(255,255,255,0.2)', borderRadius:8 }}/>
            : <div style={w.balAmount}>{formatPrice(data.balance)}</div>
          }
        </div>
        <div style={{ display:'flex', gap:10, flexShrink:0 }}>
          <button onClick={() => setModal('topup')} disabled={acting} style={w.actionBtn}>
            ↑ Nạp tiền
          </button>
          <button onClick={() => setModal('withdraw')} disabled={acting}
            style={{ ...w.actionBtn, background:'rgba(255,255,255,0.15)', borderColor:'rgba(255,255,255,0.3)' }}>
            ↓ Rút tiền
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div style={{ marginTop:24 }}>
        <div style={tbl.sectionTitle}>Lịch sử giao dịch</div>
        <div style={{ ...tbl.filterRow, marginTop:12 }}>
          <div style={tbl.filterItem}>
            <div style={tbl.filterLabel}>Thời gian</div>
            <input type="date" style={tbl.filterInput}
              value={txFilter.date} onChange={e => setTxFilter({...txFilter, date:e.target.value})}/>
          </div>
          <div style={tbl.filterItem}>
            <div style={tbl.filterLabel}>Loại giao dịch</div>
            <select style={tbl.filterInput} value={txFilter.type}
              onChange={e => setTxFilter({...txFilter, type:e.target.value})}>
              <option value="">Tất cả</option>
              <option value="topup">Nạp tiền</option>
              <option value="withdraw">Rút tiền</option>
              <option value="payment">Thanh toán</option>
              <option value="refund">Hoàn tiền</option>
            </select>
          </div>
          <button onClick={() => setTxFilter({date:'',type:''})} style={tbl.clearBtn}>
            Xoá lọc
          </button>
        </div>

        <div style={{ overflowX:'auto', marginTop:8 }}>
          <table style={tbl.table}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Mã giao dịch', 'Số tiền', 'Nội dung', 'Thời gian', 'Loại'].map(h => (
                  <th key={h} style={tbl.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={tbl.empty}>Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign:'center', padding:'52px 0', color:MUTED }}>
                    <div style={{ fontSize:44, marginBottom:10 }}>📭</div>
                    <div style={{ fontSize:14, fontWeight:500 }}>Chưa có giao dịch nào</div>
                  </td>
                </tr>
              ) : filtered.map((tx, i) => {
                const cfg = TX_CONFIG[tx.type] || TX_CONFIG.payment;
                const isCredit = tx.type==='topup' || tx.type==='refund';
                return (
                  <tr key={tx._id} style={{ background: i%2===0?'#fff':'#fafbfc' }}>
                    <td style={tbl.td}>
                      <span style={{ fontFamily:'monospace', fontSize:12, color:MUTED, fontWeight:600 }}>
                        {tx._id.slice(-10).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ ...tbl.td, fontWeight:800, color:isCredit?'#15803d':'#dc2626', fontSize:14 }}>
                      {cfg.sign}{formatPrice(tx.amount)}
                    </td>
                    <td style={{ ...tbl.td, color:MUTED, fontSize:13 }}>{tx.description}</td>
                    <td style={{ ...tbl.td, fontSize:12, color:MUTED, whiteSpace:'nowrap' }}>
                      {new Date(tx.createdAt).toLocaleString('vi-VN',{
                        day:'2-digit',month:'2-digit',year:'numeric',
                        hour:'2-digit',minute:'2-digit'
                      })}
                    </td>
                    <td style={tbl.td}>
                      <span style={{ ...tbl.badge,
                        background:isCredit?'#dcfce7':'#fee2e2',
                        color:isCredit?'#15803d':'#dc2626' }}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Lịch sử mua vé ──────────────────────────────────
function BookingsTab() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filters,   setFilters]   = useState({ code:'', date:'', route:'', status:'' });
  const [cancelId,  setCancelId]  = useState(null);

  const STATUS_LABEL = {
    pending:    'Chờ TT',
    processing: 'Chờ TT',
    confirmed:  'Đã xác nhận',
    completed:  'Đã sử dụng',
    cancelled:  'Đã huỷ',
  };

  const load = useCallback(() => {
    setLoading(true);
    getMyBookings().then(r => setBookings(r.data)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await cancelBooking(cancelId);
      addToast('Huỷ vé thành công', 'success');
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Huỷ thất bại', 'error');
    } finally { setCancelId(null); }
  };

  const filtered = bookings.filter(b => {
    const code  = b._id.slice(-8).toUpperCase();
    const route = `${b.trip?.route?.from||''} ${b.trip?.route?.to||''}`.toLowerCase();
    if (filters.code   && !code.includes(filters.code.toUpperCase())) return false;
    if (filters.route  && !route.includes(filters.route.toLowerCase())) return false;
    if (filters.status) {
      const match = filters.status === 'pending'
        ? (b.status === 'pending' || b.status === 'processing')
        : b.status === filters.status;
      if (!match) return false;
    }
    if (filters.date) {
      const dep = new Date(b.trip?.departureTime).toISOString().split('T')[0];
      if (dep !== filters.date) return false;
    }
    return true;
  });

  return (
    <div>
      {cancelId && (
        <ConfirmDialog
          title="Huỷ vé?"
          message="Vé sẽ bị huỷ và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?"
          confirmLabel="Huỷ vé"
          cancelLabel="Không huỷ"
          onConfirm={handleCancel}
          onCancel={() => setCancelId(null)}
        />
      )}

      <div style={tbl.titleRow}>
        <div>
          <div style={tbl.title}>Lịch sử mua vé</div>
          <div style={tbl.sub}>Theo dõi và quản lý lịch sử đặt vé của bạn</div>
        </div>
        <button onClick={() => navigate('/search')} style={tbl.bookBtn}>+ Đặt vé mới</button>
      </div>

      <div style={tbl.filterRow}>
        <div style={tbl.filterItem}>
          <div style={tbl.filterLabel}>Mã đặt vé</div>
          <input placeholder="Nhập mã vé" style={tbl.filterInput}
            value={filters.code} onChange={e => setFilters({...filters, code:e.target.value})}/>
        </div>
        <div style={tbl.filterItem}>
          <div style={tbl.filterLabel}>Thời gian</div>
          <input type="date" style={tbl.filterInput}
            value={filters.date} onChange={e => setFilters({...filters, date:e.target.value})}/>
        </div>
        <div style={tbl.filterItem}>
          <div style={tbl.filterLabel}>Tuyến đường</div>
          <input placeholder="VD: TP.HCM" style={tbl.filterInput}
            value={filters.route} onChange={e => setFilters({...filters, route:e.target.value})}/>
        </div>
        <div style={tbl.filterItem}>
          <div style={tbl.filterLabel}>Trạng thái</div>
          <select style={tbl.filterInput} value={filters.status}
            onChange={e => setFilters({...filters, status:e.target.value})}>
            <option value="">Tất cả</option>
            <option value="pending">Chờ TT</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="cancelled">Đã huỷ</option>
          </select>
        </div>
        <button onClick={() => setFilters({code:'',date:'',route:'',status:''})} style={tbl.clearBtn}>
          Xoá lọc
        </button>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={tbl.table}>
          <colgroup>
            <col style={{ width:110 }}/><col style={{ width:60 }}/><col/>
            <col style={{ width:130 }}/><col style={{ width:110 }}/>
            <col style={{ width:110 }}/><col style={{ width:160 }}/>
          </colgroup>
          <thead>
            <tr style={{ background:'#f8fafc' }}>
              {['Mã vé','Số vé','Tuyến đường','Ngày đi','Số tiền','Trạng thái','Thao tác'].map(h => (
                <th key={h} style={tbl.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={tbl.empty}>Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign:'center', padding:'52px 0', color:MUTED }}>
                  <div style={{ fontSize:44, marginBottom:10 }}>📭</div>
                  <div style={{ fontSize:14, fontWeight:500 }}>Chưa có đặt vé nào</div>
                </td>
              </tr>
            ) : filtered.map((b, i) => (
              <tr key={b._id} style={{ background:i%2===0?'#fff':'#fafbfc' }}>
                <td style={tbl.td}>
                  <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:13, color:INK2 }}>
                    {b._id.slice(-8).toUpperCase()}
                  </span>
                </td>
                <td style={{ ...tbl.td, textAlign:'center', fontWeight:700, color:INK2 }}>
                  {b.seats?.length}
                </td>
                <td style={{ ...tbl.td, fontWeight:600, color:INK }}>
                  {b.trip?.route?.from} → {b.trip?.route?.to}
                </td>
                <td style={{ ...tbl.td, whiteSpace:'nowrap', fontSize:12, color:MUTED }}>
                  {b.trip?.departureTime
                    ? new Date(b.trip.departureTime).toLocaleString('vi-VN',{
                        hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'
                      })
                    : '—'}
                </td>
                <td style={{ ...tbl.td, fontWeight:800, color:P, fontSize:14 }}>
                  {formatPrice(b.totalPrice)}
                </td>
                <td style={tbl.td}>
                  <span style={{ ...tbl.badge, background:STATUS_BG[b.status], color:STATUS_COLOR[b.status] }}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </td>
                <td style={{ ...tbl.td, whiteSpace:'nowrap' }}>
                  <button onClick={() => navigate(`/ticket/${b._id}`)} style={tbl.viewBtn}>
                    🎫 Xem vé
                  </button>
                  {(b.status==='pending' || b.status==='processing') && (
                    <button onClick={() => navigate(`/checkout/${b._id}`)} style={tbl.payBtn}>
                      {b.status==='processing' ? 'Tiếp tục TT' : 'Thanh toán'}
                    </button>
                  )}
                  {b.status==='pending' && (
                    <button onClick={() => setCancelId(b._id)} style={tbl.cancelBtn}>Huỷ</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Thông tin tài khoản ─────────────────────────────
function InfoTab() {
  const { user, loginUser } = useAuth();
  const { addToast } = useToast();
  const [info,   setInfo]   = useState({ name:user?.name||'', phone:user?.phone||'' });
  const [saving, setSaving] = useState(false);

  const handleInfo = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await updateProfile(info);
      loginUser(localStorage.getItem('token'), res.data);
      addToast('Cập nhật thành công!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Lỗi cập nhật', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={tbl.title}>Thông tin tài khoản</div>
      <div style={tbl.sub}>Cập nhật thông tin cá nhân của bạn</div>
      <form onSubmit={handleInfo} style={{ marginTop:24, maxWidth:480 }}>
        {[
          ['Họ và tên', 'name',  'text',  false],
          ['Email',     'email', 'email', true ],
          ['SĐT',       'phone', 'tel',   false],
        ].map(([label, key, type, disabled]) => (
          <div key={key} style={{ marginBottom:18 }}>
            <label style={f.label}>{label}</label>
            <input type={type} disabled={disabled}
              style={{ ...f.input, background:disabled?'#f5f5f5':'#fff',
                        color:disabled?MUTED:INK, cursor:disabled?'not-allowed':'text' }}
              value={key==='email' ? user?.email : info[key]}
              onChange={e => !disabled && setInfo({...info,[key]:e.target.value})}/>
          </div>
        ))}
        <button type="submit" disabled={saving} style={f.btn}>
          {saving ? 'Đang lưu...' : 'Lưu thông tin'}
        </button>
      </form>
    </div>
  );
}

// ── Tab: Đặt lại mật khẩu ───────────────────────────────
function PasswordTab() {
  const { addToast } = useToast();
  const [pass,   setPass]   = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [saving, setSaving] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (pass.newPassword !== pass.confirm) return addToast('Mật khẩu mới không khớp','error');
    if (pass.newPassword.length < 6)       return addToast('Tối thiểu 6 ký tự','warning');
    setSaving(true);
    try {
      await changePassword({ currentPassword:pass.currentPassword, newPassword:pass.newPassword });
      addToast('Đổi mật khẩu thành công!','success');
      setPass({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Thất bại','error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div style={tbl.title}>Đặt lại mật khẩu</div>
      <div style={tbl.sub}>Cập nhật mật khẩu để bảo vệ tài khoản</div>
      <form onSubmit={handle} style={{ marginTop:24, maxWidth:480 }}>
        {[
          ['currentPassword','Mật khẩu hiện tại'],
          ['newPassword',    'Mật khẩu mới'     ],
          ['confirm',        'Xác nhận mật khẩu'],
        ].map(([k, label]) => (
          <div key={k} style={{ marginBottom:18 }}>
            <label style={f.label}>{label}</label>
            <input type="password" required style={f.input}
              value={pass[k]} onChange={e => setPass({...pass,[k]:e.target.value})}/>
          </div>
        ))}
        <button type="submit" disabled={saving} style={f.btn}>
          {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────
export default function Profile() {
  useSEO({ title: 'Tài khoản — FASTBUS' });
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || 'wallet');

  const MENU = [
    { key:'wallet',   label:'Ví FASTPAY',          icon: <IcWallet/> },
    { key:'points',   label:'Điểm thưởng',          icon: <IcStar/>   },
    { key:'bookings', label:'Lịch sử mua vé',       icon: <IcTicket/> },
    { key:'info',     label:'Thông tin tài khoản',  icon: <IcUser/>   },
    { key:'password', label:'Đặt lại mật khẩu',    icon: <IcLock/>   },
  ];

  const handleLogout = () => { logoutUser(); navigate('/'); };
  const initials = (user?.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={s.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .menu-btn { transition: background .12s, color .12s; border: none; }
        .menu-btn:hover:not(.active) { background: ${SOFT} !important; }
        @media (max-width: 760px) {
          .profile-wrap    { flex-direction: column !important; }
          .profile-sidebar { width: 100% !important; position: static !important; }
          .profile-content { padding: 18px !important; }
        }
      `}</style>

      <div style={s.wrap} className="profile-wrap">

        {/* ── Sidebar ── */}
        <aside style={s.sidebar} className="profile-sidebar">

          {/* Avatar + info */}
          <div style={s.avatarSection}>
            <div style={s.avatarCircle}>{initials}</div>
            <div style={s.userName}>{user?.name}</div>
            <div style={s.userEmail}>{user?.email}</div>
          </div>

          <div style={s.divider}/>

          {/* Menu */}
          <nav style={{ padding:'6px 0 8px' }}>
            {MENU.map(({ key, label, icon }) => {
              const active = tab === key;
              return (
                <button key={key} onClick={() => setTab(key)}
                  className={`menu-btn${active ? ' active' : ''}`}
                  style={{ ...s.menuBtn, background: active ? P : 'transparent',
                    color: active ? '#fff' : INK2 }}>
                  <span style={{ ...s.menuIconWrap, color: active ? '#fff' : P }}>
                    {icon}
                  </span>
                  <span style={{ fontWeight: active ? 700 : 500, fontSize: 14 }}>{label}</span>
                </button>
              );
            })}

            <div style={s.divider}/>

            <button onClick={handleLogout} className="menu-btn"
              style={{ ...s.menuBtn, color:'#e11d48' }}>
              <span style={{ ...s.menuIconWrap, color:'#e11d48' }}><IcLogout/></span>
              <span style={{ fontWeight:500, fontSize:14 }}>Đăng xuất</span>
            </button>
          </nav>
        </aside>

        {/* ── Content ── */}
        <main style={s.content} className="profile-content">
          {tab==='wallet'   && <WalletTab/>}
          {tab==='points'   && <PointsTab/>}
          {tab==='bookings' && <BookingsTab/>}
          {tab==='info'     && <InfoTab/>}
          {tab==='password' && <PasswordTab/>}
        </main>

      </div>
    </div>
  );
}

/* ── Sidebar icons ── */
function IcWallet() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
}
function IcStar() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
}
function IcTicket() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/><line x1="9" y1="12" x2="15" y2="12" strokeDasharray="2 2"/></svg>;
}
function IcUser() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function IcLock() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function IcLogout() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

// ── Styles ───────────────────────────────────────────────
const s = {
  page: { minHeight:'100vh', background:'#f4f6f9' },

  wrap: {
    maxWidth:1080, margin:'0 auto', padding:'28px 16px 52px',
    display:'flex', gap:20, alignItems:'flex-start',
  },

  sidebar: {
    width:240, flexShrink:0, background:'#fff', borderRadius:14,
    boxShadow:'0 2px 16px rgba(0,0,0,0.08)', overflow:'hidden',
    position:'sticky', top:80,
  },

  avatarSection: {
    padding:'28px 20px 20px', textAlign:'center',
  },
  avatarCircle: {
    width:64, height:64, borderRadius:'50%',
    background:`linear-gradient(135deg,#0a5a8c,${P})`,
    color:'#fff', fontWeight:900, fontSize:22, letterSpacing:1,
    display:'flex', alignItems:'center', justifyContent:'center',
    margin:'0 auto 12px',
    boxShadow:`0 4px 14px ${P}44`,
  },
  userName:  { fontWeight:800, fontSize:15, color:INK, letterSpacing:'-0.01em' },
  userEmail: { fontSize:12, color:MUTED, marginTop:3 },

  divider: { height:1, background:LINE, margin:'0 0' },

  menuBtn: {
    display:'flex', alignItems:'center', gap:10, width:'100%',
    padding:'11px 20px', cursor:'pointer', textAlign:'left', borderRadius:0,
  },
  menuIconWrap: {
    width:20, height:20, display:'flex', alignItems:'center',
    justifyContent:'center', flexShrink:0,
  },

  content: {
    flex:1, background:'#fff', borderRadius:14, padding:'28px 32px',
    boxShadow:'0 2px 16px rgba(0,0,0,0.08)', minHeight:540,
  },
};

const w = {
  balanceCard: {
    background:'linear-gradient(135deg,#0d5c56,#0f766e,#14b8a6)',
    borderRadius:14, padding:'22px 26px', display:'flex',
    justifyContent:'space-between', alignItems:'center',
    marginBottom:16, boxShadow:'0 6px 24px rgba(15,118,110,0.28)',
  },
  balLabel:  { fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.6)',
                marginBottom:8, textTransform:'uppercase', letterSpacing:2 },
  balAmount: { fontSize:36, fontWeight:900, color:'#fff', letterSpacing:'-1.5px' },
  actionBtn: { padding:'9px 18px', border:'1.5px solid rgba(255,255,255,0.4)',
                borderRadius:8, color:'#fff', fontWeight:700, fontSize:13,
                cursor:'pointer', background:'rgba(255,255,255,0.22)',
                backdropFilter:'blur(4px)' },
};

const tbl = {
  titleRow:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  title:       { fontSize:20, fontWeight:900, color:INK, marginBottom:4, letterSpacing:'-0.02em' },
  sectionTitle:{ fontSize:16, fontWeight:800, color:INK, marginBottom:4 },
  sub:         { fontSize:13, color:MUTED },
  bookBtn:     { padding:'10px 22px', background:P, color:'#fff', border:'none',
                  borderRadius:30, fontWeight:700, fontSize:13, cursor:'pointer',
                  boxShadow:`0 4px 12px ${P}44`, flexShrink:0 },
  filterRow:   { display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end',
                  background:'#f8fafc', padding:'14px 16px', borderRadius:10,
                  border:`1px solid ${LINE}`, marginBottom:16 },
  filterItem:  { display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:120 },
  filterLabel: { fontSize:11, fontWeight:700, color:MUTED, textTransform:'uppercase', letterSpacing:.5 },
  filterInput: { padding:'8px 10px', border:`1.5px solid ${LINE}`, borderRadius:8,
                  fontSize:13, background:'#fff', outline:'none', color:INK },
  clearBtn:    { padding:'8px 18px', background:P, color:'#fff', border:'none',
                  borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer',
                  flexShrink:0, alignSelf:'flex-end' },
  table:       { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:          { padding:'10px 14px', textAlign:'left', fontWeight:700, color:MUTED,
                  fontSize:11, borderBottom:`2px solid ${LINE}`, whiteSpace:'nowrap',
                  textTransform:'uppercase', letterSpacing:.5 },
  td:          { padding:'12px 14px', borderBottom:`1px solid #f0f4f8`, verticalAlign:'middle' },
  badge:       { padding:'3px 10px', borderRadius:20, fontWeight:700, fontSize:11,
                  whiteSpace:'nowrap', display:'inline-block' },
  empty:       { textAlign:'center', padding:40, color:MUTED },
  viewBtn:     { padding:'5px 12px', background:'#f0f4f8', color:INK2,
                  border:`1px solid ${LINE}`, borderRadius:6, fontSize:12, fontWeight:600,
                  cursor:'pointer', marginRight:4 },
  payBtn:      { padding:'5px 12px', background:P, color:'#fff', border:'none',
                  borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer', marginRight:4 },
  cancelBtn:   { padding:'5px 10px', background:'#fff', color:'#dc2626',
                  border:'1.5px solid #dc2626', borderRadius:6, fontSize:12, cursor:'pointer' },
};

const f = {
  label: { display:'block', fontSize:13, fontWeight:700, color:INK2, marginBottom:6 },
  input: { width:'100%', padding:'11px 14px', borderRadius:10, border:`1.5px solid ${LINE}`,
            fontSize:14, boxSizing:'border-box', outline:'none', color:INK,
            transition:'border-color .15s' },
  btn:   { padding:'11px 28px', background:P, color:'#fff', border:'none',
            borderRadius:30, fontSize:14, fontWeight:700, cursor:'pointer',
            boxShadow:`0 4px 14px ${P}44`, marginTop:8 },
};

const ov = {
  overlay:    { position:'fixed', inset:0, background:'rgba(12,24,37,0.55)', zIndex:9000,
                 display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal:      { background:'#fff', borderRadius:16, width:'100%', maxWidth:390,
                 boxShadow:'0 24px 64px rgba(0,0,0,0.22)', overflow:'hidden' },
  header:     { padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  close:      { background:'rgba(255,255,255,0.25)', border:'none', color:'#fff',
                 width:28, height:28, borderRadius:'50%', fontSize:18, cursor:'pointer',
                 display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 },
  chip:       { padding:'6px 13px', border:'1.5px solid', borderRadius:20, fontSize:12,
                 cursor:'pointer', transition:'all .12s' },
  cancelBtn:  { flex:1, padding:11, background:'#f5f5f5', border:`1px solid ${LINE}`,
                 borderRadius:8, cursor:'pointer', fontSize:14, color:MUTED },
  confirmBtn: { flex:2, padding:11, border:'none', borderRadius:8, color:'#fff',
                 cursor:'pointer', fontSize:14, fontWeight:700 },
};
