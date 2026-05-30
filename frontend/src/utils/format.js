// Format tiền: 150000 → "150.000 ₫"
export const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

// Format ngày: "2024-12-25T08:00:00" → "25/12/2024 08:00"
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

