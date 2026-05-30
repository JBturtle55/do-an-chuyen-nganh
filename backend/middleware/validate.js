/**
 * Lightweight validation middleware — không cần thư viện ngoài
 */

function validate(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, checks] of Object.entries(rules)) {
      const val = req.body[field];
      for (const check of checks) {
        const err = check(val, field);
        if (err) { errors.push(err); break; }
      }
    }
    if (errors.length) return res.status(400).json({ message: errors[0] });
    next();
  };
}

/* ── reusable checkers ── */
const required = (val, field) =>
  (val === undefined || val === null || String(val).trim() === '')
    ? `${field} không được để trống`
    : null;

const isEmail = (val) =>
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    ? 'Email không hợp lệ'
    : null;

const minLen = (n) => (val) =>
  String(val || '').trim().length < n
    ? `Tối thiểu ${n} ký tự`
    : null;

const maxLen = (n) => (val) =>
  String(val || '').trim().length > n
    ? `Tối đa ${n} ký tự`
    : null;

const isPhone = (val) =>
  !/^(0|\+84)[0-9]{8,10}$/.test(String(val || '').trim())
    ? 'Số điện thoại không hợp lệ (VD: 0901234567)'
    : null;

const isNumber = (val, field) =>
  isNaN(Number(val)) || Number(val) < 0
    ? `${field} phải là số dương`
    : null;

const isArray = (val, field) =>
  !Array.isArray(val) || val.length === 0
    ? `${field} phải là mảng không rỗng`
    : null;

const isMongoId = (val, field) =>
  !/^[a-f\d]{24}$/i.test(String(val || ''))
    ? `${field} không hợp lệ`
    : null;

module.exports = { validate, required, isEmail, minLen, maxLen, isPhone, isNumber, isArray, isMongoId };
