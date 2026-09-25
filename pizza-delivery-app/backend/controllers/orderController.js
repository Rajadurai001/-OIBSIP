const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');

// @desc  Get logged-in user's own orders (used for the dashboard polling
//        that shows live status: Order Received -> In Kitchen -> Sent to Delivery)
// @route GET /api/orders/my-orders
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort('-createdAt')
    .populate('items.base items.sauce items.cheese items.vegetables', 'name category');
  res.json(orders);
});

// @desc  Get a single order by id (must belong to the requesting user)
// @route GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate(
    'items.base items.sauce items.cheese items.vegetables',
    'name category'
  );
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  res.json(order);
});

// ---- Admin-side order management ----

// @desc  Get all orders across all users (admin panel)
// @route GET /api/admin/orders
const getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const orders = await Order.find(filter)
    .sort('-createdAt')
    .populate('user', 'name email phone')
    .populate('items.base items.sauce items.cheese items.vegetables', 'name category');
  res.json(orders);
});

// @desc  Update an order's status (Order Received -> In Kitchen -> Sent to
//        Delivery -> Delivered). Frontend polls /my-orders so this change
//        shows up on the user's dashboard within a few seconds.
// @route PUT /api/admin/orders/:id/status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  order.status = status;
  await order.save();
  res.json(order);
});

module.exports = { getMyOrders, getOrderById, getAllOrders, updateOrderStatus };
