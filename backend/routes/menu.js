const router = require('express').Router();
const { Op } = require('sequelize');
const { MenuItem, Category } = require('../models/index');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const audit = require('../utils/audit');

// GET /menu — public, with pagination, search, category filter
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', category = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (category && category !== 'all') {
      where.category = { [Op.iLike]: `%${category}%` };
    }

    const { count, rows } = await MenuItem.findAndCountAll({
      where,
      include: [{ model: Category, as: 'categoryInfo', attributes: ['id', 'name', 'icon'] }],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /menu/all — all items without pagination (backward compat)
router.get('/all', async (req, res) => {
  try {
    const items = await MenuItem.findAll({ order: [['name', 'ASC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /menu — admin only
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    await audit({ userId: req.user.id, username: req.user.username, action: 'CREATE', entity: 'menu', entityId: item.id, details: req.body });
    // Emit socket event
    if (req.app.get('io')) req.app.get('io').emit('menu:updated', { action: 'created', item });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /menu/:id — admin only, optimistic-friendly (returns updated item)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    const oldData = item.toJSON();
    await item.update(req.body);
    await audit({ userId: req.user.id, username: req.user.username, action: 'UPDATE', entity: 'menu', entityId: item.id, details: { before: oldData, after: req.body } });
    if (req.app.get('io')) req.app.get('io').emit('menu:updated', { action: 'updated', item });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /menu/:id — admin only, soft delete
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const item = await MenuItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    await item.destroy(); // sets deletedAt (paranoid)
    await audit({ userId: req.user.id, username: req.user.username, action: 'DELETE', entity: 'menu', entityId: item.id, details: { name: item.name } });
    if (req.app.get('io')) req.app.get('io').emit('menu:updated', { action: 'deleted', itemId: item.id });
    res.json({ message: 'Menu item deleted', id: item.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
