const router = require('express').Router();
const { Category, MenuItem } = require('../models/index');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const audit = require('../utils/audit');

// GET /categories — public
router.get('/', async (req, res) => {
  try {
    const cats = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /categories — admin
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    await audit({ userId: req.user.id, username: req.user.username, action: 'CREATE', entity: 'category', entityId: cat.id, details: req.body });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /categories/:id — admin
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    const oldName = cat.name;
    await cat.update(req.body);
    // Cascade name change to menu items that used the old name
    if (req.body.name && req.body.name !== oldName) {
      await MenuItem.update({ category: req.body.name }, { where: { category: oldName } });
    }
    await audit({ userId: req.user.id, username: req.user.username, action: 'UPDATE', entity: 'category', entityId: cat.id, details: req.body });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /categories/:id — admin
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    // Clear the category string field on menu items before deleting (categoryId FK will auto SET NULL)
    await MenuItem.update({ category: null }, { where: { category: cat.name } });
    await audit({ userId: req.user.id, username: req.user.username, action: 'DELETE', entity: 'category', entityId: cat.id, details: { name: cat.name } });
    await cat.destroy();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
