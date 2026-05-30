const router = require('express').Router();
const Route  = require('../models/Route');

// Public — danh sách thành phố unique từ tất cả tuyến đường
router.get('/cities', async (req, res) => {
  try {
    const routes = await Route.find().select('from to').lean();
    const set = new Set();
    routes.forEach(r => { set.add(r.from); set.add(r.to); });
    res.json([...set].sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public — lấy danh sách tuyến đường cho bản đồ
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find().select('from to distance duration basePrice');
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
