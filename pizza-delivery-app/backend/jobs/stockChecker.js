const cron = require('node-cron');
const Inventory = require('../models/Inventory');
const sendEmail = require('../utils/sendEmail');

// Runs on the schedule set in STOCK_CHECK_CRON (default: hourly).
// For any item whose stock has fallen below its threshold, emails the admin
// once, then remembers it has alerted (lastLowStockAlertAt) so it doesn't
// spam the same email every hour - the flag clears automatically once stock
// is topped back up (see inventoryController.updateInventoryItem) or after
// stock is replenished past the threshold on its own.
const checkLowStock = async () => {
  try {
    const lowItems = await Inventory.find({
      $expr: { $lt: ['$stock', '$lowStockThreshold'] },
      lastLowStockAlertAt: null,
    });

    if (!lowItems.length) return;

    const rows = lowItems
      .map(
        (item) =>
          `<tr><td>${item.name}</td><td>${item.category}</td><td>${item.stock} ${item.unit}</td><td>${item.lowStockThreshold}</td></tr>`
      )
      .join('');

    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `⚠️ Low stock alert - ${lowItems.length} item(s) below threshold`,
      html: `<p>The following ingredients have fallen below their configured threshold:</p>
             <table border="1" cellpadding="6" cellspacing="0">
               <tr><th>Item</th><th>Category</th><th>Current stock</th><th>Threshold</th></tr>
               ${rows}
             </table>
             <p>Please restock soon to avoid delays fulfilling orders.</p>`,
    });

    await Inventory.updateMany(
      { _id: { $in: lowItems.map((i) => i._id) } },
      { $set: { lastLowStockAlertAt: new Date() } }
    );

    console.log(`Low-stock alert email sent for ${lowItems.length} item(s).`);
  } catch (err) {
    console.error('Stock check job failed:', err.message);
  }
};

const startStockChecker = () => {
  const schedule = process.env.STOCK_CHECK_CRON || '0 * * * *'; // default hourly
  cron.schedule(schedule, checkLowStock);
  console.log(`Low-stock cron job scheduled: "${schedule}"`);
  // Also run once at boot so newly-low stock isn't missed for a full hour
  checkLowStock();
};

module.exports = { startStockChecker, checkLowStock };
