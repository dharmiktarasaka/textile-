require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const Company = require('../models/Company');
const Category = require('../models/Category');
const Listing = require('../models/Listing');
const Interest = require('../models/Interest');
const ContactRequest = require('../models/ContactRequest');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const ListingView = require('../models/ListingView');
const OTP = require('../models/OTP');

// Category Data definitions with exact fieldSchemas required
const categoriesData = [
  {
    name: 'Fabric Waste',
    slug: 'fabric-waste',
    description: 'Industrial fabric scraps, roll leftovers, cutting waste, and rejected fabric stock.',
    fieldSchema: {
      fabricType: { type: 'enum', values: ['cotton', 'polyester', 'blend', 'denim', 'rayon', 'viscose', 'other'], required: true },
      gsm: { type: 'number', required: false },
      colors: { type: 'array', required: true },
      form: { type: 'enum', values: ['rolls', 'cuttings', 'rags', 'rejected_lots'], required: true },
      quantityKg: { type: 'number', required: true },
      priceExpectationPerKg: { type: 'number', required: false },
      location: { type: 'string', required: true },
      qualityGrade: { type: 'enum', values: ['premium', 'clean', 'mixed', 'low_grade'], required: false }
    }
  },
  {
    name: 'Thread/Yarn Waste',
    slug: 'thread-yarn-waste',
    description: 'Leftover threads and industrial yarn waste on cones, hanks, bobbins, or loose packaging.',
    fieldSchema: {
      yarnType: { type: 'enum', values: ['cotton', 'synthetic', 'blended', 'polyester', 'viscose'], required: true },
      countOrDenier: { type: 'string', required: false },
      colors: { type: 'array', required: true },
      form: { type: 'enum', values: ['cones', 'hanks', 'loose', 'bobbins'], required: true },
      quantityKg: { type: 'number', required: true },
      priceExpectationPerKg: { type: 'number', required: false },
      location: { type: 'string', required: true }
    }
  },
  {
    name: 'Fibre Waste',
    slug: 'fibre-waste',
    description: 'Raw textile fibre wastes, slivers, carding waste, and synthetic staple fibers.',
    fieldSchema: {
      fibreType: { type: 'string', required: true },
      stapleLength: { type: 'string', required: false },
      contaminationLevel: { type: 'enum', values: ['clean', 'mixed', 'low_grade'], required: true },
      quantityKg: { type: 'number', required: true },
      location: { type: 'string', required: true },
      priceExpectationPerKg: { type: 'number', required: false }
    }
  },
  {
    name: 'Hosiery Cutting Waste',
    slug: 'hosiery-cutting-waste',
    description: 'Cotton, polyester, and elastane rich hosiery clips, cuttings, and rags from apparel factories.',
    fieldSchema: {
      material: { type: 'enum', values: ['cotton', 'polyester', 'lycra', 'blend', 'other'], required: true },
      colors: { type: 'array', required: true },
      form: { type: 'enum', values: ['cuttings', 'rags', 'mixed'], required: true },
      quantityKg: { type: 'number', required: true },
      location: { type: 'string', required: true },
      priceExpectationPerKg: { type: 'number', required: false }
    }
  },
  {
    name: 'Denim Waste',
    slug: 'denim-waste',
    description: 'Stretch, non-stretch, and mixed denim pieces, cuttings, and rejected rolls.',
    fieldSchema: {
      denimType: { type: 'enum', values: ['stretch', 'non_stretch', 'mixed'], required: true },
      colors: { type: 'array', required: true },
      form: { type: 'enum', values: ['cuttings', 'rolls', 'scraps', 'rejected_pieces'], required: true },
      quantityKg: { type: 'number', required: true },
      location: { type: 'string', required: true },
      priceExpectationPerKg: { type: 'number', required: false }
    }
  },
  {
    name: 'Export Surplus Fabric',
    slug: 'export-surplus-fabric',
    description: 'High quality rolls and rejected stock lots of finished fabrics, ready for export re-routing.',
    fieldSchema: {
      fabricType: { type: 'enum', values: ['cotton', 'polyester', 'blend', 'denim', 'rayon', 'viscose', 'other'], required: true },
      gsm: { type: 'number', required: false },
      colors: { type: 'array', required: true },
      form: { type: 'enum', values: ['rolls', 'rejected_lots'], required: true },
      quantityKg: { type: 'number', required: true },
      priceExpectationPerKg: { type: 'number', required: false },
      location: { type: 'string', required: true },
      qualityGrade: { type: 'enum', values: ['premium', 'clean', 'mixed'], required: true }
    }
  }
];

// Seed 20 Companies across Surat, Ahmedabad, Tiruppur, Ludhiana, Panipat, Mumbai, Bhilwara, Ichalkaranji
const companiesData = [
  { name: 'Shree Krishna Textile Mills', city: 'Surat', state: 'Gujarat', companyType: 'MILL', email: 'skmills@example.com' },
  { name: 'Surat Cotton Waste Traders', city: 'Surat', state: 'Gujarat', companyType: 'TRADER', email: 'suratwaste@example.com' },
  { name: 'GreenLoop Fibre Recyclers', city: 'Ahmedabad', state: 'Gujarat', companyType: 'RECYCLER', email: 'greenloop@example.com' },
  { name: 'Tiruppur Hosiery Waste Suppliers', city: 'Tiruppur', state: 'Tamil Nadu', companyType: 'TRADER', email: 'tiruppurhosiery@example.com' },
  { name: 'Ahmedabad Fabric Recovery Co.', city: 'Ahmedabad', state: 'Gujarat', companyType: 'RECYCLER', email: 'ahmedabadfabric@example.com' },
  { name: 'Panipat Recycled Yarn House', city: 'Panipat', state: 'Haryana', companyType: 'MILL', email: 'panipatyarn@example.com' },
  { name: 'Ludhiana Thread Waste Traders', city: 'Ludhiana', state: 'Punjab', companyType: 'TRADER', email: 'ludhianathread@example.com' },
  { name: 'Bhilwara Surplus Fabric Mart', city: 'Bhilwara', state: 'Rajasthan', companyType: 'EXPORTER', email: 'bhilwaramart@example.com' },
  { name: 'Ichalkaranji Weaving Salvage', city: 'Ichalkaranji', state: 'Maharashtra', companyType: 'MILL', email: 'ichalkaranji@example.com' },
  { name: 'Mumbai Denim Cuttings Corp', city: 'Mumbai', state: 'Maharashtra', companyType: 'TRADER', email: 'mumbaidenim@example.com' },
  { name: 'Vardhman Recycling Solutions', city: 'Ludhiana', state: 'Punjab', companyType: 'RECYCLER', email: 'vardhman@example.com' },
  { name: 'Nahar Cotton Cleaners', city: 'Panipat', state: 'Haryana', companyType: 'MILL', email: 'naharcotton@example.com' },
  { name: 'Gujarat Yarn Salvage Ind', city: 'Surat', state: 'Gujarat', companyType: 'OTHER', email: 'gujaratyarn@example.com' },
  { name: 'Apex Export Surplus Buyers', city: 'Mumbai', state: 'Maharashtra', companyType: 'EXPORTER', email: 'apexexport@example.com' },
  { name: 'Kalyan Fabric Waste Exporters', city: 'Ichalkaranji', state: 'Maharashtra', companyType: 'EXPORTER', email: 'kalyanfabric@example.com' },
  { name: 'Maruti Hosiery Clips', city: 'Tiruppur', state: 'Tamil Nadu', companyType: 'TRADER', email: 'marutihosiery@example.com' },
  { name: 'Suraj Recyclers Pvt Ltd', city: 'Ahmedabad', state: 'Gujarat', companyType: 'RECYCLER', email: 'surajrecyclers@example.com' },
  { name: 'Sangam Waste Processors', city: 'Bhilwara', state: 'Rajasthan', companyType: 'MILL', email: 'sangam@example.com' },
  { name: 'Tiruppur Eco Fibres', city: 'Tiruppur', state: 'Tamil Nadu', companyType: 'RECYCLER', email: 'ecofibres@example.com' },
  { name: 'Haryana Threads & Rags', city: 'Panipat', state: 'Haryana', companyType: 'TRADER', email: 'haryanathreads@example.com' },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/textile_waste_hub');

    console.log('Clearing existing data...');
    await Company.deleteMany({});
    await Category.deleteMany({});
    await Listing.deleteMany({});
    await Interest.deleteMany({});
    await ContactRequest.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    await ListingView.deleteMany({});
    await OTP.deleteMany({});

    console.log('Seeding categories...');
    const seededCategories = await Category.insertMany(categoriesData);
    console.log(`${seededCategories.length} categories seeded.`);

    console.log('Generating password hashes for companies...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const companiesToInsert = companiesData.map((c, i) => {
      // 15 unique verified & pending companies
      // 18 approved (verified), 2 pending, 1 rejected
      let verificationStatus = 'VERIFIED';
      let rejectionReason = null;
      let emailVerified = true;

      if (i === 17) {
        verificationStatus = 'PENDING';
        emailVerified = true;
      } else if (i === 18) {
        verificationStatus = 'PENDING';
        emailVerified = false; // Needs OTP verify
      } else if (i === 19) {
        verificationStatus = 'REJECTED';
        rejectionReason = 'GST registration document is expired/illegible';
        emailVerified = true;
      }

      // Generate a valid GST pattern: e.g. 24 + 5 chars + 4 numbers + 1 char + 1 num + Z + 1 num
      const idxStr = String(i + 1).padStart(2, '0');
      const gstNumber = `24ABCDE${idxStr}01F1Z1`;

      return {
        name: c.name,
        gstNumber,
        companyType: c.companyType,
        contactPersonName: `Manager ${c.name.split(' ')[0]}`,
        contactEmail: c.email,
        contactPhone: `9876543${String(i).padStart(3, '0')}`,
        address: `GIDC Phase ${i + 1}, Industrial Area`,
        city: c.city,
        state: c.state,
        verificationStatus,
        rejectionReason,
        verificationDocUrl: verificationStatus !== 'PENDING' || emailVerified ? `gst-doc-company-${i}.pdf` : null,
        passwordHash,
        emailVerified,
        verifiedAt: verificationStatus === 'VERIFIED' ? new Date() : null,
      };
    });

    console.log('Seeding companies...');
    const seededCompanies = await Company.insertMany(companiesToInsert);
    console.log(`${seededCompanies.length} companies seeded.`);

    // Extract categories refs
    const catMap = {};
    seededCategories.forEach((cat) => {
      catMap[cat.slug] = cat._id;
    });

    // Extract verified companies
    const verifiedCompanies = seededCompanies.filter((c) => c.verificationStatus === 'VERIFIED');

    console.log('Creating 50 realistic listings...');
    const listingsToInsert = [];

    // Realistic listings pool
    const mockListingsData = [
      // Fabric Waste
      { title: '800 KG Cotton Fabric Cuttings', slug: 'fabric-waste', fields: { fabricType: 'cotton', gsm: 180, colors: ['White', 'Grey'], form: 'cuttings', quantityKg: 800, priceExpectationPerKg: 32, location: 'Surat', qualityGrade: 'clean' } },
      { title: '1200 KG Polyester Roll Waste', slug: 'fabric-waste', fields: { fabricType: 'polyester', gsm: 120, colors: ['Blue', 'Black'], form: 'rolls', quantityKg: 1200, priceExpectationPerKg: 18, location: 'Ahmedabad', qualityGrade: 'mixed' } },
      { title: '3000 KG Poly-Cotton Knit Rags', slug: 'fabric-waste', fields: { fabricType: 'blend', gsm: 160, colors: ['Mixed'], form: 'rags', quantityKg: 3000, priceExpectationPerKg: 22, location: 'Tiruppur', qualityGrade: 'low_grade' } },
      { title: '1500 KG Rayon Print leftovers', slug: 'fabric-waste', fields: { fabricType: 'rayon', gsm: 140, colors: ['Red', 'Multi'], form: 'cuttings', quantityKg: 1500, priceExpectationPerKg: 29, location: 'Surat', qualityGrade: 'premium' } },
      { title: '950 KG Viscose Rejected Stocks', slug: 'fabric-waste', fields: { fabricType: 'viscose', gsm: 150, colors: ['Green'], form: 'rejected_lots', quantityKg: 950, priceExpectationPerKg: 26, location: 'Bhilwara', qualityGrade: 'clean' } },
      
      // Thread/Yarn Waste
      { title: '700 KG Cotton Yarn Cone Waste', slug: 'thread-yarn-waste', fields: { yarnType: 'cotton', countOrDenier: '20s/2', colors: ['White'], form: 'cones', quantityKg: 700, priceExpectationPerKg: 40, location: 'Ludhiana' } },
      { title: '400 KG Polyester Thread Bobbins', slug: 'thread-yarn-waste', fields: { yarnType: 'polyester', countOrDenier: '150D', colors: ['Assorted'], form: 'bobbins', quantityKg: 400, priceExpectationPerKg: 25, location: 'Surat' } },
      { title: '1.5 Ton Synthetic Loose Yarn', slug: 'thread-yarn-waste', fields: { yarnType: 'synthetic', colors: ['Mixed'], form: 'loose', quantityKg: 1500, priceExpectationPerKg: 14, location: 'Panipat' } },
      { title: '850 KG Blended Thread Hank Waste', slug: 'thread-yarn-waste', fields: { yarnType: 'blended', countOrDenier: '30s', colors: ['Grey', 'Black'], form: 'hanks', quantityKg: 850, priceExpectationPerKg: 28, location: 'Ludhiana' } },

      // Fibre Waste
      { title: '2 Ton Mixed Polyester Staple Fibre', slug: 'fibre-waste', fields: { fibreType: 'Polyester Staple', stapleLength: '32mm', contaminationLevel: 'mixed', quantityKg: 2000, priceExpectationPerKg: 12, location: 'Panipat' } },
      { title: '1200 KG Clean Cotton Comber Noil', slug: 'fibre-waste', fields: { fibreType: 'Cotton Comber', stapleLength: '12-15mm', contaminationLevel: 'clean', quantityKg: 1200, priceExpectationPerKg: 55, location: 'Ahmedabad' } },
      { title: '500 KG Viscose Sliver Waste', slug: 'fibre-waste', fields: { fibreType: 'Viscose Sliver', contaminationLevel: 'clean', quantityKg: 500, priceExpectationPerKg: 38, location: 'Bhilwara' } },
      { title: '3 Ton Low-grade Carding Waste', slug: 'fibre-waste', fields: { fibreType: 'Cotton Carding', contaminationLevel: 'low_grade', quantityKg: 3000, priceExpectationPerKg: 8, location: 'Ichalkaranji' } },

      // Hosiery Cutting Waste
      { title: '500 KG White Hosiery Cutting Waste', slug: 'hosiery-cutting-waste', fields: { material: 'cotton', colors: ['White'], form: 'cuttings', quantityKg: 500, priceExpectationPerKg: 28, location: 'Tiruppur' } },
      { title: '900 KG Colored Hosiery Clips', slug: 'hosiery-cutting-waste', fields: { material: 'cotton', colors: ['Red', 'Blue', 'Green'], form: 'cuttings', quantityKg: 900, priceExpectationPerKg: 24, location: 'Tiruppur' } },
      { title: '1200 KG Lycra Blend Cutting Scrap', slug: 'hosiery-cutting-waste', fields: { material: 'lycra', colors: ['Black', 'Navy'], form: 'mixed', quantityKg: 1200, priceExpectationPerKg: 31, location: 'Mumbai' } },
      { title: '600 KG Polyester Hosiery Rags', slug: 'hosiery-cutting-waste', fields: { material: 'polyester', colors: ['Mixed'], form: 'rags', quantityKg: 600, priceExpectationPerKg: 15, location: 'Ahmedabad' } },

      // Denim Waste
      { title: '300 KG Denim Cutting Waste', slug: 'denim-waste', fields: { denimType: 'non_stretch', colors: ['Indigo'], form: 'cuttings', quantityKg: 300, priceExpectationPerKg: 35, location: 'Mumbai' } },
      { title: '1500 KG Stretch Denim Scraps', slug: 'denim-waste', fields: { denimType: 'stretch', colors: ['Blue', 'Black'], form: 'scraps', quantityKg: 1500, priceExpectationPerKg: 28, location: 'Ahmedabad' } },
      { title: '800 KG Denim Rejected Roll Ends', slug: 'denim-waste', fields: { denimType: 'mixed', colors: ['Dark Blue'], form: 'rolls', quantityKg: 800, priceExpectationPerKg: 33, location: 'Surat' } },

      // Export Surplus Fabric
      { title: '1.2 Ton Cotton Twill Rolls Surplus', slug: 'export-surplus-fabric', fields: { fabricType: 'cotton', gsm: 240, colors: ['Khaki', 'Olive'], form: 'rolls', quantityKg: 1200, priceExpectationPerKg: 95, location: 'Bhilwara', qualityGrade: 'premium' } },
      { title: '600 KG Polyester Satin Rejected Lot', slug: 'export-surplus-fabric', fields: { fabricType: 'polyester', gsm: 90, colors: ['Gold', 'Silver', 'Red'], form: 'rejected_lots', quantityKg: 600, priceExpectationPerKg: 65, location: 'Mumbai', qualityGrade: 'clean' } }
    ];

    // Generate 50 items by cycling through the mock pool
    for (let idx = 0; idx < 50; idx++) {
      const template = mockListingsData[idx % mockListingsData.length];
      const randomCompany = verifiedCompanies[idx % verifiedCompanies.length];
      const categoryId = catMap[template.slug];

      // Assign statuses: 38 ACTIVE, 6 SOLD, 6 EXPIRED
      let status = 'ACTIVE';
      let soldAt = null;
      if (idx % 8 === 0) {
        status = 'SOLD';
        soldAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      } else if (idx % 12 === 0) {
        status = 'EXPIRED';
      }

      // Vary title slightly
      const qtyMultiplier = Math.floor(Math.random() * 3) + 1; // 1 to 3
      const modifiedFields = { ...template.fields };
      modifiedFields.quantityKg = Math.floor(modifiedFields.quantityKg * qtyMultiplier);
      if (modifiedFields.priceExpectationPerKg) {
        modifiedFields.priceExpectationPerKg = Math.round(modifiedFields.priceExpectationPerKg * (0.9 + Math.random() * 0.2)); // Adjust +/- 10%
      }

      // Dynamic location
      modifiedFields.location = randomCompany.city;

      const title = `${modifiedFields.quantityKg} KG ${template.title.split(' ').slice(2).join(' ')} - ${randomCompany.city}`;

      // Mock image placeholders
      const photoUrls = [
        `https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80`,
        `https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=600&q=80`
      ];

      listingsToInsert.push({
        companyId: randomCompany._id,
        categoryId,
        title,
        fields: modifiedFields,
        photoUrls,
        status,
        viewCount: Math.floor(Math.random() * 25) + 2,
        createdAt: new Date(Date.now() - idx * 6 * 60 * 60 * 1000), // Incremental history
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        soldAt,
      });
    }

    const seededListings = await Listing.insertMany(listingsToInsert);
    console.log(`${seededListings.length} listings seeded successfully.`);

    // Seed some Interests, ContactRequests, Notifications, and AuditLogs to make data real
    console.log('Seeding active trading history...');

    // Save interest for Company 1 (Shree Krishna Textile Mills) for Hosiery waste
    const company1 = verifiedCompanies[0];
    const company2 = verifiedCompanies[1];
    const categoryHosiery = seededCategories.find(c => c.slug === 'hosiery-cutting-waste');
    await Interest.create({
      companyId: company1._id,
      categoryId: categoryHosiery._id,
      subFilters: { minQty: 400, location: 'Tiruppur' },
    });

    // Create unique Listing views
    const sampleListing = seededListings.find(l => l.status === 'ACTIVE');
    if (sampleListing) {
      await ListingView.create({
        listingId: sampleListing._id,
        companyId: company1._id,
      });
      await ListingView.create({
        listingId: sampleListing._id,
        companyId: company2._id,
      });
    }

    // Create 3 Contact Requests (1 ACCEPTED, 1 REQUESTED, 1 DECLINED)
    const activeListingsNotOwnedByC1 = seededListings.filter(
      l => l.status === 'ACTIVE' && l.companyId.toString() !== company1._id.toString()
    );

    if (activeListingsNotOwnedByC1.length >= 3) {
      // 1. Accepted request
      await ContactRequest.create({
        listingId: activeListingsNotOwnedByC1[0]._id,
        buyerCompanyId: company1._id,
        sellerCompanyId: activeListingsNotOwnedByC1[0].companyId,
        status: 'ACCEPTED',
        message: 'Looking to purchase this cotton fabric waste on regular basis. Please share phone.',
        respondedAt: new Date(),
      });

      // 2. Pending request
      await ContactRequest.create({
        listingId: activeListingsNotOwnedByC1[1]._id,
        buyerCompanyId: company1._id,
        sellerCompanyId: activeListingsNotOwnedByC1[1].companyId,
        status: 'REQUESTED',
        message: 'We are recyclers based in Surat, ready to lift this lot.',
      });

      // 3. Declined request
      await ContactRequest.create({
        listingId: activeListingsNotOwnedByC1[2]._id,
        buyerCompanyId: company1._id,
        sellerCompanyId: activeListingsNotOwnedByC1[2].companyId,
        status: 'DECLINED',
        message: 'Can you offer delivery to Ahmedabad?',
        respondedAt: new Date(),
      });
    }

    // Create Audit Logs
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@textilewastehub.com';
    const rejectedCompany = seededCompanies.find(c => c.verificationStatus === 'REJECTED');
    if (rejectedCompany) {
      await AuditLog.create({
        adminId: adminEmail,
        action: 'REJECT_COMPANY',
        targetCompanyId: rejectedCompany._id,
        reason: 'GST registration document is expired/illegible',
      });
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Execute seeding
seedDB();
