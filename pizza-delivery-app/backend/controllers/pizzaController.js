const asyncHandler = require('express-async-handler');
const Inventory = require('../models/Inventory');

// @desc  Get all pizza-builder options grouped by category (bases, sauces,
//        cheeses, vegetables), only items currently in stock & available.
// @route GET /api/pizza/options
const getPizzaOptions = asyncHandler(async (req, res) => {
  const items = await Inventory.find({ isAvailable: true, stock: { $gt: 0 } }).sort('name');

  const grouped = { base: [], sauce: [], cheese: [], vegetable: [] };
  items.forEach((item) => {
    grouped[item.category].push({
      id: item._id,
      name: item.name,
      stock: item.stock,
      unit: item.unit,
      price: item.price,
    });
  });

  res.json(grouped);
});

module.exports = { getPizzaOptions };
