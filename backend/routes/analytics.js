const router = require('express').Router();
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../database');
const { Order, OrderItem, MenuItem, User, AuditLog } = require('../models/index');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /analytics/summary — admin (always all-time, no date filter)
router.get('/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('totalAmount', { where: { status: { [Op.ne]: 'cancelled' } } });
    const totalUsers = await User.count();
    const totalMenuItems = await MenuItem.count();
    const pendingOrders = await Order.count({ where: { status: 'pending' } });
    const completedOrders = await Order.count({ where: { status: 'completed' } });

    res.json({
      totalOrders,
      totalRevenue: totalRevenue || 0,
      totalUsers,
      totalMenuItems,
      pendingOrders,
      completedOrders
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /analytics/orders-by-day — accepts ?start=YYYY-MM-DD&end=YYYY-MM-DD (or legacy ?days=N)
router.get('/orders-by-day', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let since, until;
    if (req.query.start && req.query.end) {
      since = new Date(req.query.start + 'T00:00:00');
      until = new Date(req.query.end + 'T23:59:59');
    } else {
      const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
      since = new Date();
      since.setDate(since.getDate() - days);
      until = new Date();
    }

    const rows = await Order.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('totalAmount')), 'revenue']
      ],
      where: { createdAt: { [Op.gte]: since, [Op.lte]: until } },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /analytics/top-items — top 10 ordered items
router.get('/top-items', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let orderWhere = {};
    if (req.query.start && req.query.end) {
      const since = new Date(req.query.start + 'T00:00:00');
      const until = new Date(req.query.end + 'T23:59:59');
      orderWhere = { createdAt: { [Op.gte]: since, [Op.lte]: until }, status: { [Op.ne]: 'cancelled' } };
    }
    const rows = await OrderItem.findAll({
      attributes: [
        ['menuItemName', 'name'],
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('subtotal')), 'totalRevenue']
      ],
      include: Object.keys(orderWhere).length ? [{ model: Order, as: 'order', attributes: [], where: orderWhere, required: true }] : [],
      group: ['menuItemName'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: 10,
      raw: true
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /analytics/orders-by-status
router.get('/orders-by-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let dateFilter = {};
    if (req.query.start && req.query.end) {
      const since = new Date(req.query.start + 'T00:00:00');
      const until = new Date(req.query.end + 'T23:59:59');
      dateFilter = { createdAt: { [Op.gte]: since, [Op.lte]: until } };
    }
    const rows = await Order.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count']
      ],
      where: dateFilter,
      group: ['status'],
      raw: true
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /analytics/revenue-by-category
router.get('/revenue-by-category', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await OrderItem.findAll({
      attributes: [
        [literal('"menuItem"."category"'), 'category'],
        [fn('SUM', col('OrderItem.subtotal')), 'totalRevenue'],
        [fn('COUNT', col('OrderItem.id')), 'count']
      ],
      include: [{ model: MenuItem, as: 'menuItem', attributes: [] }],
      group: [literal('"menuItem"."category"')],
      raw: true
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
