const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Recomputes each pizza's price straight from the Inventory collection
// (never trusts a price the client might send) and returns both the
// itemized breakdown and the grand total. Also used to validate stock.
const priceItems = async (items) => {
  if (!items || !items.length) {
    const err = new Error('Order must contain at least one pizza item');
    err.statusCode = 400;
    throw err;
  }

  const allIds = new Set();
  items.forEach((item) => {
    [item.base, item.sauce, item.cheese, ...(item.vegetables || [])].forEach((id) => allIds.add(id));
  });

  const docs = await Inventory.find({ _id: { $in: [...allIds] } });
  const map = new Map(docs.map((d) => [d._id.toString(), d]));

  const pricedItems = items.map((item) => {
    const ids = [item.base, item.sauce, item.cheese, ...(item.vegetables || [])];
    let unitPrice = 0;
    for (const id of ids) {
      const doc = map.get(String(id));
      if (!doc) {
        const err = new Error('One or more selected ingredients no longer exist');
        err.statusCode = 400;
        throw err;
      }
      unitPrice += doc.price;
    }
    return {
      ...item,
      quantity: item.quantity || 1,
      price: unitPrice,
    };
  });

  const totalAmount = pricedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { pricedItems, totalAmount, inventoryMap: map };
};

// @desc  Recompute the order total server-side and open a Razorpay order
//        for that amount. The frontend then opens Razorpay's checkout
//        widget with this order id - in test mode, clicking "Success"
//        completes payment without a real card being charged.
// @route POST /api/payment/create-order
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const { totalAmount } = await priceItems(items);

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100), // paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  });

  res.json({
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    totalAmount,
  });
});

// @desc  Verify Razorpay payment signature, re-price + re-check stock for
//        every item, then create the real Order document and decrement
//        ingredient stock atomically.
// @route POST /api/payment/verify
const verifyPaymentAndCreateOrder = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    items,
    deliveryAddress,
    contactPhone,
  } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed - signature mismatch');
  }

  const { pricedItems, totalAmount } = await priceItems(items);

  // Check every ingredient has enough stock BEFORE decrementing anything
  const requiredCounts = {};
  pricedItems.forEach((item) => {
    const ids = [item.base, item.sauce, item.cheese, ...(item.vegetables || [])];
    ids.forEach((id) => {
      requiredCounts[id] = (requiredCounts[id] || 0) + item.quantity;
    });
  });

  const inventoryIds = Object.keys(requiredCounts);
  const inventoryDocs = await Inventory.find({ _id: { $in: inventoryIds } });
  const stockMap = new Map(inventoryDocs.map((d) => [d._id.toString(), d]));

  for (const id of inventoryIds) {
    const doc = stockMap.get(id);
    if (!doc || doc.stock < requiredCounts[id]) {
      res.status(409);
      throw new Error(`Insufficient stock for ingredient: ${doc ? doc.name : id}`);
    }
  }

  const bulkOps = inventoryIds.map((id) => ({
    updateOne: {
      filter: { _id: id },
      update: { $inc: { stock: -requiredCounts[id] } },
    },
  }));
  await Inventory.bulkWrite(bulkOps);

  const order = await Order.create({
    user: req.user._id,
    items: pricedItems,
    totalAmount,
    paymentStatus: 'paid',
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    deliveryAddress,
    contactPhone,
  });

  res.status(201).json(order);
});

module.exports = { createRazorpayOrder, verifyPaymentAndCreateOrder };
