// Optional helper script to seed the database with a default admin user,
// a starter set of ingredients + inventory, and a sample recipe.
// Run with: npm run seed
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Ingredient = require('../models/Ingredient');
const Inventory = require('../models/Inventory');
const Recipe = require('../models/Recipe');
const Settings = require('../models/Settings');

const run = async () => {
  await connectDB();

  console.log('Seeding database...');

  // Admin user
  let admin = await User.findOne({ email: 'admin@dairy.com' });
  if (!admin) {
    admin = await User.create({
      name: 'System Administrator',
      email: 'admin@dairy.com',
      password: 'Admin@123',
      role: 'Administrator',
    });
    console.log('Created admin user -> email: admin@dairy.com / password: Admin@123');
  }

  // Settings
  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    await Settings.create({ companyName: 'Fresh Valley Dairy', factoryName: 'Main Processing Plant' });
  }

  // Ingredients
  const ingredientDefs = [
    { name: 'Sugar', category: 'Sweetener', unit: 'Kilograms' },
    { name: 'Starter Culture', category: 'Culture', unit: 'Kilograms' },
    { name: 'Stabilizer', category: 'Additive', unit: 'Kilograms' },
    { name: 'Flavor', category: 'Additive', unit: 'Kilograms' },
    { name: 'Color', category: 'Additive', unit: 'Grams' },
    { name: 'Skimmed Milk Powder', category: 'Dairy Base', unit: 'Kilograms' },
  ];

  const ingredientDocs = {};
  for (const def of ingredientDefs) {
    let ing = await Ingredient.findOne({ name: def.name });
    if (!ing) {
      ing = await Ingredient.create(def);
      await Inventory.create({
        ingredient: ing._id,
        stock: 500,
        unit: def.unit,
        minimumStock: 50,
        supplier: 'Default Supplier Ltd.',
      });
      console.log(`Created ingredient + inventory: ${def.name}`);
    }
    ingredientDocs[def.name] = ing;
  }

  // Sample recipe: Flavored Yogurt (matches the example in the spec)
  const existingRecipe = await Recipe.findOne({ name: 'Flavored Yogurt' });
  if (!existingRecipe) {
    const ingredients = [
      { ingredient: ingredientDocs['Sugar']._id, name: 'Sugar', category: 'Sweetener', percentage: 8, unit: 'Kilograms' },
      { ingredient: ingredientDocs['Starter Culture']._id, name: 'Starter Culture', category: 'Culture', percentage: 2, unit: 'Kilograms' },
      { ingredient: ingredientDocs['Stabilizer']._id, name: 'Stabilizer', category: 'Additive', percentage: 0.5, unit: 'Kilograms' },
      { ingredient: ingredientDocs['Flavor']._id, name: 'Flavor', category: 'Additive', percentage: 1, unit: 'Kilograms' },
      { ingredient: ingredientDocs['Color']._id, name: 'Color', category: 'Additive', percentage: 0.05, unit: 'Grams' },
    ];

    await Recipe.create({
      name: 'Flavored Yogurt',
      description: 'Standard flavored yogurt formula (percentages relative to milk quantity)',
      category: 'Yogurt',
      yieldPercentage: 95,
      status: 'Active',
      ingredients,
      createdBy: admin._id,
      currentVersion: 1,
      versionHistory: [
        {
          versionNumber: 1,
          name: 'Flavored Yogurt',
          description: 'Standard flavored yogurt formula',
          yieldPercentage: 95,
          ingredients,
          savedBy: admin._id,
        },
      ],
    });
    console.log('Created sample recipe: Flavored Yogurt');
  }

  console.log('Seeding complete.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
