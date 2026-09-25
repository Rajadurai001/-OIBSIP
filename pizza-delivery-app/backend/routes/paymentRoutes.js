const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPaymentAndCreateOrder);

module.exports = router;
