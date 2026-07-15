/**
 * Seed Script: Default Textile Waste Categories
 * Run: node src/scripts/seedCategories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/textilewaste';

const DEFAULT_CATEGORIES = [
  {
    name: 'Fabric Waste',
    slug: 'fabric-waste',
    description: 'Roll leftovers, cutting scraps, woven fabric stock lots',
    fieldSchema: {
      materialType: { type: 'enum', values: ['cotton', 'polyester', 'blended', 'silk', 'wool', 'nylon', 'other'], required: true },
      quantityKg: { type: 'number', required: true },
      priceExpectationPerKg: { type: 'number', required: false },
      gsm: { type: 'number', required: false },
      colors: { type: 'array', required: false },
      location: { type: 'string', required: true },
      condition: { type: 'enum', values: ['new_surplus', 'lightly_used', 'mixed'], required: false },
      description: { type: 'string', required: false },
    },
    isActive: true,
  },
  {
    name: 'Yarn Waste',
    slug: 'yarn-waste',
    description: 'Cotton, synthetic thread, bobbin wastes, cone yarn',
    fieldSchema: {
      yarnType: { type: 'enum', values: ['cotton', 'polyester', 'nylon', 'blended', 'acrylic', 'viscose', 'other'], required: true },
      countNe: { type: 'string', required: false },
      quantityKg: { type: 'number', required: true },
      priceExpectationPerKg: { type: 'number', required: false },
      colors: { type: 'array', required: false },
      location: { type: 'string', required: true },
      description: { type: 'string', required: false },
    },
    isActive: true,
  },
  {
    name: 'Thread Waste',
    slug: 'thread-waste',
    description: 'Hanks, spools, synthetic/natural thread scrap',
    fieldSchema: {
      threadType: { type: 'enum', values: ['polyester', 'cotton', 'nylon', 'silk', 'other'], required: true },
      quantityKg: { type: 'number', required: true },
      priceExpectationPerKg: { type: 'number', required: false },
      colors: { type: 'array', required: false },
      location: { type: 'string', required: true },
      description: { type: 'string', required: false },
    },
    isActive: true,
  },
  {
    name: 'Fibre Waste',
    slug: 'fibre-waste',
    description: 'Raw cotton fibers, synthetic staple fiber, linters',
    fieldSchema: {
      fibreType: { type: 'enum', values: ['cotton', 'polyester_staple', 'viscose', 'acrylic', 'jute', 'other'], required: true },
      quantityKg: { type: 'number', required: true },
      priceExpectationPerKg: { type: 'number', required: false },
      micronage: { type: 'string', required: false },
      location: { type: 'string', required: true },
      description: { type: 'string', required: false },
    },
    isActive: true,
  },
  {
    name: 'Hosiery Cutting Waste',
    slug: 'hosiery-cutting-waste',
    description: 'Knit clips, cotton-lycra blend cuttings, rib waste',
    fieldSchema: {
      fabricType: { type: 'enum', values: ['single_jersey', 'rib', 'interlock', 'fleece', 'other'], required: true },
      composition: { type: 'string', required: false },
      quantityKg: { type: 'number', required: true },
      priceExpectationPerKg: { type: 'number', required: false },
      colors: { type: 'array', required: false },
      location: { type: 'string', required: true },
      description: { type: 'string', required: false },
    },
    isActive: true,
  },
  {
    name: 'Denim Waste',
    slug: 'denim-waste',
    description: 'Indigo denim cuttings, scrap borders, raw denim surplus',
    fieldSchema: {
      denimType: { type: 'enum', values: ['raw', 'washed', 'stretch', 'blended', 'other'], required: true },
      quantityKg: { type: 'number', required: true },
      priceExpectationPerKg: { type: 'number', required: false },
      oz: { type: 'string', required: false },
      colors: { type: 'array', required: false },
      location: { type: 'string', required: true },
      description: { type: 'string', required: false },
    },
    isActive: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const cat of DEFAULT_CATEGORIES) {
      const exists = await Category.findOne({ slug: cat.slug });
      if (exists) {
        console.log(`  ⏭  Skipping (already exists): ${cat.name}`);
        skipped++;
      } else {
        await Category.create(cat);
        console.log(`  ✅ Created: ${cat.name}`);
        created++;
      }
    }

    console.log(`\nSeed complete: ${created} created, ${skipped} skipped`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
