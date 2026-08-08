// One-off correction script: fixes Mala production batches that were
// recorded before the "no sugar/starch/pectin for Mala" fix. Recalculates
// costBreakdown, totalBudgetCost, and profit for affected records, then
// syncs the matching ProductionHistory entry. Safe to run more than once —
// it only touches records that still have non-zero sugar/starch/pectin cost,
// so already-fixed records are skipped automatically.

require('dotenv').config();
const mongoose = require('mongoose');
const Production = require('../src/models/Production');
const ProductionHistory = require('../src/models/ProductionHistory');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const affected = await Production.find({
    productType: 'Mala',
    $or: [
      { 'costBreakdown.sugarCost': { $gt: 0 } },
      { 'costBreakdown.starchCost': { $gt: 0 } },
      { 'costBreakdown.pectinCost': { $gt: 0 } }
    ]
  });

  console.log(`Found ${affected.length} affected Mala batch(es).`);

  for (const batch of affected) {
    const cb = batch.costBreakdown;

    const oldSugar = cb.sugarCost || 0;
    const oldStarch = cb.starchCost || 0;
    const oldPectin = cb.pectinCost || 0;
    const oldConsumables = cb.consumablesCost || 0;
    const oldTotal = cb.totalBudgetCost || 0;
    const oldProfit = batch.profit || 0;

    // Recompute consumables the same way the real formula does:
    // 5% of (labour + milkCost) now that sugar/starch/pectin are zeroed.
    const newConsumables = 0.05 * (cb.labour + cb.milkCost);

    cb.sugarCost = 0;
    cb.starchCost = 0;
    cb.pectinCost = 0;
    cb.consumablesCost = newConsumables;
    cb.totalBudgetCost = cb.labour + cb.milkCost + cb.cultureCost + newConsumables;

    batch.sugarKg = 0;
    batch.starchGrams = 0;
    batch.pectinGrams = 0;

    const newProfit = (batch.revenue?.totalRevenue || 0) - cb.totalBudgetCost;
    batch.profit = newProfit;

    await batch.save();

    // Keep the ProductionHistory summary row in sync too.
    await ProductionHistory.findOneAndUpdate(
      { productionId: batch._id },
      { totalCost: cb.totalBudgetCost, profit: newProfit }
    );

    console.log(`Fixed batch ${batch._id} (${batch.date.toDateString()}):`);
    console.log(`  Removed: Sugar KSh ${oldSugar.toFixed(2)}, Starch KSh ${oldStarch.toFixed(2)}, Pectin KSh ${oldPectin.toFixed(2)}`);
    console.log(`  Consumables: KSh ${oldConsumables.toFixed(2)} -> KSh ${newConsumables.toFixed(2)}`);
    console.log(`  Total Cost: KSh ${oldTotal.toFixed(2)} -> KSh ${cb.totalBudgetCost.toFixed(2)}`);
    console.log(`  Profit: KSh ${oldProfit.toFixed(2)} -> KSh ${newProfit.toFixed(2)}`);
  }

  console.log('Done.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error running fix script:', err);
  process.exit(1);
});