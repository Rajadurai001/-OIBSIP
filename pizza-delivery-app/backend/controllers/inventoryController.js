const asyncHandler = require('express-async-handler');
const Inventory = require('../models/Inventory');

// @desc  Get full inventory (admin dashboard)
// @route GET /api/admin/inventory
const getInventory = asyncHandler(async (req, res) => {
  const items = await Inventory.find().sort({ category: 1, name: 1 });
  res.json(items);
});

// @desc  Create a new inventory item
// @route POST /api/admin/inventory
const createInventoryItem = asyncHandler(async (req, res) => {
  const { name, category, stock, unit, lowStockThreshold, price } = req.body;
  if (!name || !category) {
    res.status(400);
    throw new Error('Name and category are required');
  }
  const item = await Inventory.create({ name, category, stock, unit, lowStockThreshold, price });
  res.status(201).json(item);
});

// @desc  Manually update stock quantity for one item (absolute set or delta)
// @route PUT /api/admin/inventory/:id
const updateInventoryItem = asyncHandler(async (req, res) => {
  const { stock, lowStockThreshold, isAvailable, name, price } = req.body;
  const item = await Inventory.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Inventory item not found');
  }

  if (stock !== undefined) item.stock = Math.max(0, stock);
  if (lowStockThreshold !== undefined) item.lowStockThreshold = lowStockThreshold;
  if (isAvailable !== undefined) item.isAvailable = isAvailable;
  if (name !== undefined) item.name = name;
  if (price !== undefined) item.price = Math.max(0, price);

  // Manually topping up stock above the threshold clears any stale alert flag
  // so a fresh low-stock email will fire again next time it dips below.
  if (item.stock > item.lowStockThreshold) {
    item.lastLowStockAlertAt = null;
  }

  await item.save();
  res.json(item);
});

// @desc  Delete an inventory item
// @route DELETE /api/admin/inventory/:id
const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Inventory item not found');
  }
  res.json({ message: 'Inventory item deleted' });
});

module.exports = {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
};
