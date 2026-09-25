const mongoose = require('mongoose');

const pizzaItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Custom Pizza' },
    base: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    sauce: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    cheese: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    vegetables: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }],
    quantity: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const ORDER_STATUSES = ['Order Received', 'In Kitchen', 'Sent to Delivery', 'Delivered', 'Cancelled'];

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [pizzaItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'Order Received' },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    deliveryAddress: { type: String, required: true },
    contactPhone: { type: String, required: true },
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (this.isModified('status') || this.isNew) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
