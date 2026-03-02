'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Seed categories
    const now = new Date();
    await queryInterface.bulkInsert('categories', [
      { name: 'Pizza', description: 'Italian pizza dishes', icon: '🍕', createdAt: now, updatedAt: now },
      { name: 'Pasta', description: 'Pasta and noodles', icon: '🍝', createdAt: now, updatedAt: now },
      { name: 'Salad', description: 'Fresh salads', icon: '🥗', createdAt: now, updatedAt: now },
      { name: 'Seafood', description: 'Fish and seafood', icon: '🐟', createdAt: now, updatedAt: now },
      { name: 'Dessert', description: 'Sweet endings', icon: '🍰', createdAt: now, updatedAt: now }
    ], {});

    // Seed dev users
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash  = await bcrypt.hash('user123', 10);
    await queryInterface.bulkInsert('users', [
      { username: 'admin', email: 'admin@example.com', password: adminHash, role: 'admin', createdAt: now, updatedAt: now },
      { username: 'user',  email: 'user@example.com',  password: userHash,  role: 'user',  createdAt: now, updatedAt: now }
    ], {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', { username: ['admin', 'user'] }, {});
  }
};
