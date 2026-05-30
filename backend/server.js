const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv    = require('dotenv');
const path      = require('path');
require('./cron');
dotenv.config();

const app = express();

// Tin tưởng proxy nginx phía trước (cần cho rate-limit nhận đúng IP)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — chỉ cho phép frontend domain
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Rate limit cho auth endpoints — chống brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20,
  message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login',          authLimiter);
app.use('/api/auth/register',       authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password',  authLimiter);

app.use(express.json());

// Cho phép truy cập ảnh upload qua URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Routes (sẽ thêm dần ở các bước sau)
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/trips',    require('./routes/trips'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/posts',    require('./routes/posts'));
app.use('/api/routes',   require('./routes/routes'));
app.use('/api/chat',     require('./routes/chat'));
app.use('/api/wallet',   require('./routes/wallet'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/points',   require('./routes/points'));
app.use('/api/contact',  require('./routes/contact'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Booking Xe API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
