const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sequelize = require('../database');
const User = require('../models/User');
const MenuItem = require('../models/Menu');

const loadJson = (fileName) => {
  const filePath = path.join(__dirname, '..', 'data', fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
};

const run = async () => {
  const transaction = await sequelize.transaction();

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const legacyUsers = loadJson('users.json');
    const legacyMenu = loadJson('menu.json');

    await User.destroy({ where: {}, truncate: true, restartIdentity: true, transaction });
    await MenuItem.destroy({ where: {}, truncate: true, restartIdentity: true, transaction });

    await User.bulkCreate(
      legacyUsers.map((user) => ({
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role || 'user'
      })),
      { transaction }
    );

    await MenuItem.bulkCreate(
      legacyMenu.map((item) => ({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category || null,
        image: item.image || null
      })),
      { transaction }
    );

    await transaction.commit();

    const usersCount = await User.count();
    const menuCount = await MenuItem.count();
    console.log(`✅ Legacy migration success: users=${usersCount}, menu_items=${menuCount}`);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Legacy migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
