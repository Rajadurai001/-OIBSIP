const mongoose = require('mongoose');

// A single collection holds every ingredient type; `category` distinguishes
// pizza bases / sauces / cheeses / vegetables so the admin dashboard can
// group them, and each item carries its own low-stock threshold override.
const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['base', 'sauce', 'cheese', 'vegetable'],
    },
    stock: { type: Number, required: true, default: 0, min: 0 },
    unit: { type: String, default: 'units' },
    // Price added per pizza when this ingredient is chosen (rupees).
    // Bases/sauces/cheeses are usually a base charge; vegetables a small add-on.
    price: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 20 },
    lastLowStockAlertAt: { type: Date, default: null },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

inventorySchema.index({ category: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
