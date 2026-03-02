const router = require('express').Router();
const bcrypt = require('bcrypt');
const { User, Order, OrderItem } = require('../models/index');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const audit = require('../utils/audit');

// GET /users — admin only
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password', 'refreshToken'] } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /users/me — current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password', 'refreshToken'] } });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /users/me — update own profile (username, email, password)
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username !== undefined) {
      if (!username.trim() || username.trim().length < 2)
        return res.status(400).json({ message: 'Username must be at least 2 characters' });
      const exists = await User.findOne({ where: { username: username.trim() } });
      if (exists && exists.id !== req.user.id)
        return res.status(400).json({ message: 'Username already taken' });
      user.username = username.trim();
    }

    if (email !== undefined) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        return res.status(400).json({ message: 'Invalid email address' });
      const exists = await User.findOne({ where: { email: email.trim().toLowerCase() } });
      if (exists && exists.id !== req.user.id)
        return res.status(400).json({ message: 'Email already in use' });
      user.email = email.trim().toLowerCase();
    }

    if (newPassword !== undefined) {
      if (!currentPassword)
        return res.status(400).json({ message: 'Current password is required to change password' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid)
        return res.status(400).json({ message: 'Current password is incorrect' });
      if (newPassword.length < 6)
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    const { password: pw, refreshToken, ...result } = user.toJSON();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /users/:id — admin: get user detail with order stats
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password', 'refreshToken'] } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { count: orderCount, rows: orders } = await Order.findAndCountAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    const totalSpent = await Order.sum('totalAmount', { where: { userId: user.id, status: { [require('sequelize').Op.ne]: 'cancelled' } } });
    res.json({ ...user.toJSON(), orderCount, totalSpent: totalSpent || 0, recentOrders: orders });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /users/:id/role — admin only
router.put('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await audit({ userId: req.user.id, username: req.user.username, action: 'UPDATE', entity: 'user', entityId: user.id, details: { from: oldRole, to: role } });
    const { password, refreshToken, ...result } = user.toJSON();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /users/:id — admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await audit({ userId: req.user.id, username: req.user.username, action: 'DELETE', entity: 'user', entityId: user.id, details: { username: user.username } });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
