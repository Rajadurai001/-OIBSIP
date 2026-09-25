const express = require('express');
const router = express.Router();
const { loginAdmin, getAdminMe } = require('../controllers/adminAuthController');
const {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} = require('../controllers/inventoryController');
const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { adminProtect } = require('../middleware/adminAuth');

// Admin auth (separate from user auth entirely)
router.post('/auth/login', loginAdmin);
router.get('/auth/me', adminProtect, getAdminMe);

// Inventory management
router.get('/inventory', adminProtect, getInventory);
router.post('/inventory', adminProtect, createInventoryItem);
router.put('/inventory/:id', adminProtect, updateInventoryItem);
router.delete('/inventory/:id', adminProtect, deleteInventoryItem);

// Order management
router.get('/orders', adminProtect, getAllOrders);
router.put('/orders/:id/status', adminProtect, updateOrderStatus);

module.exports = router;
