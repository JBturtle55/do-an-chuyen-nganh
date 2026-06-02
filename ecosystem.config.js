// PM2 config — FORK mode, 1 instance.
// Lý do: SSE (chat + seat-update) dùng registry in-memory. Cluster nhiều worker
// → mỗi worker 1 registry → broadcast trượt giữa các worker. 1 instance đảm bảo
// SSE realtime hoạt động. Traffic đồ án thấp nên không cần multi-core.
// Muốn scale lại nhiều worker thì phải chuyển SSE sang Redis pub/sub.
module.exports = {
  apps: [{
    name:      'backend',
    script:    'server.js',
    cwd:       '/home/booking-xe/backend',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    max_memory_restart: '400M',
  }],
};
