const router = require('express').Router();
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../database');
const { Order, OrderItem, MenuItem, User } = require('../models/index');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const audit = require('../utils/audit');

// POST /orders — authenticated user places order
router.post('/', authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { items, notes } = req.body;
    // items: [{ menuItemId, quantity }]
    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menuItemId, { transaction: t });
      if (!menuItem) {
        await t.rollback();
        return res.status(404).json({ message: `Menu item ${item.menuItemId} not found` });
      }
      const unitPrice = parseFloat(menuItem.price);
      const qty = parseInt(item.quantity) || 1;
      const subtotal = unitPrice * qty;
      totalAmount += subtotal;
      orderItemsData.push({
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity: qty,
        unitPrice,
        subtotal
      });
    }

    const order = await Order.create(
      { userId: req.user.id, totalAmount, notes, status: 'pending' },
      { transaction: t }
    );

    for (const oi of orderItemsData) {
      await OrderItem.create({ ...oi, orderId: order.id }, { transaction: t });
    }

    await t.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }, { model: User, as: 'user', attributes: ['id', 'username'] }]
    });

    await audit({ userId: req.user.id, username: req.user.username, action: 'CREATE', entity: 'order', entityId: order.id, details: { totalAmount, itemCount: items.length } });

    // Notify admin via socket
    if (req.app.get('io')) {
      req.app.get('io').to('admin').emit('order:new', fullOrder);
    }

    res.status(201).json(fullOrder);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /orders — admin: all orders | user: own orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (req.user.role !== 'admin') where.userId = req.user.id;
    if (status && status !== 'all') where.status = status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: OrderItem, as: 'items' },
        { model: User, as: 'user', attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({ data: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /orders/:id — own order or admin
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: User, as: 'user', attributes: ['id', 'username'] }
      ]
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role !== 'admin' && order.userId !== req.user.id)
      return res.status(403).json({ message: 'Forbidden' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /orders/:id/status — admin updates order status
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const oldStatus = order.status;
    order.status = status;
    await order.save();

    await audit({ userId: req.user.id, username: req.user.username, action: 'UPDATE', entity: 'order', entityId: order.id, details: { from: oldStatus, to: status } });

    // Notify the user via socket
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${order.userId}`).emit('order:status', { orderId: order.id, status });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
