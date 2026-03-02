const bcrypt = require('bcrypt');
require('dotenv').config();

const sequelize = require('../database');
const User = require('../models/User');
const MenuItem = require('../models/Menu');

const defaultUsers = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    username: 'user',
    email: 'user@example.com',
    password: 'user123',
    role: 'user'
  }
];

const defaultMenuItems = [
  { name: 'Burger', price: 50000, description: '🍔 Delicious beef burger' },
  { name: 'Pizza', price: 80000, description: '🍕 Cheese pizza' },
  { name: 'Pasta', price: 60000, description: '🍝 Creamy carbonara' },
  { name: 'Salad', price: 40000, description: '🥗 Fresh garden salad' },
  { name: 'Coffee', price: 25000, description: '☕ Premium coffee' }
];

const run = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const usersCount = await User.count();
    if (usersCount === 0) {
      const usersToCreate = [];
      for (const user of defaultUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        usersToCreate.push({ ...user, password: hashedPassword });
      }
      await User.bulkCreate(usersToCreate);
      console.log('✅ Default users seeded');
    } else {
      console.log('ℹ️ Skip users seed: users table is not empty');
    }

    const menuCount = await MenuItem.count();
    if (menuCount === 0) {
      await MenuItem.bulkCreate(defaultMenuItems);
      console.log('✅ Default menu items seeded');
    } else {
      console.log('ℹ️ Skip menu seed: menu_items table is not empty');
    }
  } catch (error) {
    console.error('❌ Default seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
