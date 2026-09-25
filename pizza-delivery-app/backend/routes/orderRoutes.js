const express = require('express');
const router = express.Router();
const { getMyOrders, getOrderById } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

module.exports = router;
