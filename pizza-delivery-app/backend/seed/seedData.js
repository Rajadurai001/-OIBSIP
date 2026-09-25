// Run with: npm run seed
// Creates the first admin account + a starter inventory (5 bases, 5 sauces,
// a couple of cheeses & vegetables) so the app is usable immediately.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const Inventory = require('../models/Inventory');

// [name, price in rupees]
const bases = [
  ['Thin Crust', 149], ['Thick Crust', 169], ['Cheese Burst', 219],
  ['Whole Wheat', 159], ['Gluten Free', 199],
];
const sauces = [
  ['Classic Tomato', 0], ['BBQ', 20], ['Pesto', 30],
  ['Alfredo White Sauce', 30], ['Spicy Peri Peri', 25],
];
const cheeses = [
  ['Mozzarella', 40], ['Cheddar', 45], ['Parmesan', 55], ['Vegan Cheese', 60],
];
const vegetables = [
  ['Onion', 15], ['Bell Pepper', 15], ['Mushroom', 20], ['Olives', 20],
  ['Sweet Corn', 15], ['Jalapeno', 15], ['Tomato', 10], ['Spinach', 15],
];

const run = async () => {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pizzahub.com';
  const existingAdmin = await Admin.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await Admin.create({
      name: 'Pizza Hub Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    });
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log('Admin already exists, skipping.');
  }

  const seedCategory = async (pairs, category, startStock = 50) => {
    for (const [name, price] of pairs) {
      const exists = await Inventory.findOne({ name, category });
      if (!exists) {
        await Inventory.create({
          name,
          category,
          price,
          stock: startStock,
          lowStockThreshold: Number(process.env.LOW_STOCK_THRESHOLD) || 20,
        });
      }
    }
  };

  await seedCategory(bases, 'base');
  await seedCategory(sauces, 'sauce');
  await seedCategory(cheeses, 'cheese');
  await seedCategory(vegetables, 'vegetable');

  console.log('Inventory seed complete.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
