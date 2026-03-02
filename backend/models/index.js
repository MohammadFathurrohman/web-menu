// Central associations file
const User = require('./User');
const MenuItem = require('./Menu');
const Category = require('./Category');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const AuditLog = require('./AuditLog');

// Category <-> MenuItem
Category.hasMany(MenuItem, { foreignKey: 'categoryId', as: 'menuItems' });
MenuItem.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoryInfo' });

// User <-> Order
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// MenuItem <-> OrderItem
MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId', as: 'orderItems' });
OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId', as: 'menuItem' });

// User <-> AuditLog
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });

module.exports = { User, MenuItem, Category, Order, OrderItem, AuditLog };
