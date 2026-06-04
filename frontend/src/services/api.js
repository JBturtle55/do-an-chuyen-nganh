import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

// Tự động gắn token vào mỗi request nếu user đã đăng nhập
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const register  = (data) => api.post('/auth/register', data);
export const login     = (data) => api.post('/auth/login', data);
export const getMe     = ()     => api.get('/auth/me');

// Trips
export const getTrips  = (params) => api.get('/trips', { params });
export const getTrip   = (id)     => api.get(`/trips/${id}`);

// Bookings
export const createBooking  = (data) => api.post('/bookings', data);
export const getMyBookings  = ()     => api.get('/bookings/me');
export const cancelBooking  = (id)   => api.put(`/bookings/${id}/cancel`);

// Admin
export const adminGetBookings = (params) => api.get('/admin/bookings', { params });
export const adminGetUsers    = (params) => api.get('/admin/users', { params });
export const adminGetRefunds        = ()  => api.get('/admin/refunds');
export const adminGetRefundHistory  = ()  => api.get('/admin/refunds?status=completed');
export const adminConfirmRefund = (id)   => api.put(`/admin/bookings/${id}/refund`);
export const adminGetBuses    = ()       => api.get('/admin/buses');
export const adminCreateBus   = (data)   => api.post('/admin/buses', data);
export const adminUpdateBus   = (id, data) => api.put(`/admin/buses/${id}`, data);
export const adminDeleteBus   = (id)     => api.delete(`/admin/buses/${id}`);
export const getCities        = ()       => api.get('/routes/cities');
export const adminGetRoutes   = ()       => api.get('/admin/routes');
export const adminCreateRoute = (data)   => api.post('/admin/routes', data);
export const adminUpdateRoute = (id, data) => api.put(`/admin/routes/${id}`, data);
export const adminDeleteRoute = (id)     => api.delete(`/admin/routes/${id}`);
export const adminBulkTrips   = (data)   => api.post('/trips/bulk', data);
export const adminUpdateTrip  = (id, data) => api.put(`/trips/${id}`, data);
export const adminDeleteTrip  = (id)     => api.delete(`/trips/${id}`);
export const adminConfirmBooking = (id) => api.put(`/admin/bookings/${id}/confirm`);
export const adminCancelBooking  = (id) => api.put(`/admin/bookings/${id}/cancel`);
export const getBookedSeats = (tripId) => api.get(`/trips/${tripId}/booked-seats`);
export const createVnpayPayment  = (bookingId, voucherCode, pointsToUse) => api.post('/payments/vnpay/create', { bookingId, voucherCode, pointsToUse });
export const payWithWallet       = (bookingId, voucherCode, pointsToUse) => api.post('/payments/wallet', { bookingId, voucherCode, pointsToUse });
// Wallet FASTPAY
export const getWallet           = ()       => api.get('/wallet');
export const walletTopupVnpay    = (amount) => api.post('/payments/vnpay/wallet-topup', { amount });
export const walletWithdraw      = (amount) => api.post('/wallet/withdraw', { amount });
export const updateProfile    = (data) => api.put('/auth/profile', data);
export const changePassword   = (data) => api.put('/auth/change-password', data);
export const forgotPassword   = (data) => api.post('/auth/forgot-password', data);
export const resetPassword    = (data) => api.post('/auth/reset-password', data);
export const googleLogin      = (data) => api.post('/auth/google', data);
export const adminGetStats = () => api.get('/admin/stats');
export const adminUpdateUser  = (id, data) => api.put(`/admin/users/${id}`, data);
export const adminDeleteUser  = (id)       => api.delete(`/admin/users/${id}`);
export const getBooking       = (id)           => api.get(`/bookings/${id}`);
export const submitReview     = (id, data)     => api.post(`/bookings/${id}/review`, data);
export const getBookingReview = (id)           => api.get(`/bookings/${id}/review`);
export const getTripReviews   = (tripId)       => api.get(`/trips/${tripId}/reviews`);

// Points
export const getPoints = () => api.get('/points');

// Vouchers
export const getPublicVouchers  = ()     => api.get('/vouchers/public');
export const validateVoucher    = (data) => api.post('/vouchers/validate', data);
export const adminGetVouchers   = ()     => api.get('/vouchers');
export const adminCreateVoucher = (data) => api.post('/vouchers', data);
export const adminUpdateVoucher = (id, data) => api.put(`/vouchers/${id}`, data);
export const adminDeleteVoucher = (id)   => api.delete(`/vouchers/${id}`);

// Posts (public)
export const getPosts      = (params) => api.get('/posts', { params });
export const getPost       = (slug)   => api.get(`/posts/${slug}`);
// Posts (admin)
export const adminGetPosts    = ()           => api.get('/posts/admin/all');
export const adminCreatePost  = (data)       => api.post('/posts', data);
export const adminUpdatePost  = (id, data)   => api.put(`/posts/${id}`, data);
export const adminDeletePost  = (id)         => api.delete(`/posts/${id}`);

// Chat (user) — truyền { conversationId } trong params/data
export const chatGetMessages = (params) => api.get('/chat/messages', { params });
export const chatSend        = (data)   => api.post('/chat/messages', data);
export const chatGetUnread   = (params) => api.get('/chat/unread', { params });
export const chatGetStatus   = (params) => api.get('/chat/status', { params });
export const chatAI          = (data)   => api.post('/chat/ai', data);

// Chat (admin)
export const adminChatConversations = (status = 'active') => api.get(`/admin/chat/conversations?status=${status}`);
export const adminChatMessages      = (userId)            => api.get(`/admin/chat/${userId}`);
export const adminChatReply         = (userId, content)   => api.post(`/admin/chat/${userId}/reply`, { content });
export const adminChatUnread        = ()                  => api.get('/admin/chat/unread-count');
export const adminChatComplete      = (conversationId)    => api.put(`/admin/chat/${conversationId}/complete`);
export const adminChatReopen        = (conversationId)    => api.put(`/admin/chat/${conversationId}/reopen`);
export const adminExportBookings    = (params)            => api.get('/admin/bookings/export', { params, responseType: 'blob' });

// Contact
export const submitContact = (data) => api.post('/contact', data);

export default api;
