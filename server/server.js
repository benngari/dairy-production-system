require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth');
const recipeRoutes = require('./src/routes/recipes');
const ingredientRoutes = require('./src/routes/ingredients');
const productionRoutes = require('./src/routes/production');
const packagingRoutes = require('./src/routes/packaging');
const reportRoutes = require('./src/routes/reports');
const dashboardRoutes = require('./src/routes/dashboard');
const settingsRoutes = require('./src/routes/settings');
const userRoutes = require('./src/routes/users');
const auditLogRoutes = require('./src/routes/auditLog');
const dailyStockRoutes = require('./src/routes/dailyStock');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// One-time self-healing check: the dailyStocks collection originally had a
// plain unique index (date+productType+size) before Trash/soft-delete was
// added. That old index doesn't know about isDeleted, so it wrongly blocks
// creating a new row when an old soft-deleted row shares the same
// date/product/size — causing "Failed to load daily stock" errors. If we
// find that outdated index, drop it so Mongoose recreates the correct
// partial index (which only enforces uniqueness among non-deleted rows).
// Safe to run on every boot — it's a no-op once the index is already fixed.
async function fixDailyStockIndex() {
  try {
    const collection = mongoose.connection.collection('dailystocks');
    const indexes = await collection.indexes();
    const staleIndex = indexes.find(
      idx => idx.name === 'date_1_productType_1_size_1' && !idx.partialFilterExpression
    );
    if (staleIndex) {
      await collection.dropIndex(staleIndex.name);
      console.log('Dropped outdated dailystocks index — Mongoose will recreate it correctly.');
    }
  } catch (err) {
    // Non-fatal — e.g. collection doesn't exist yet on a brand-new database.
    console.log('dailystocks index check skipped:', err.message);
  }
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected');
  await fixDailyStockIndex();
})
.catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/packaging', packagingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/daily-stock', dailyStockRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));