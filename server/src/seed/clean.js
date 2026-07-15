require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

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
const Review = require('../models/Review');

const cleanDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/textile_waste_hub';
    console.log(`Connecting to database to clean dummy data: ${mongoUri.split('@')[1] || mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing dummy data collections (except Categories)...');
    
    const companyRes = await Company.deleteMany({});
    console.log(`Cleared companies: ${companyRes.deletedCount}`);

    const listingRes = await Listing.deleteMany({});
    console.log(`Cleared listings: ${listingRes.deletedCount}`);

    const interestRes = await Interest.deleteMany({});
    console.log(`Cleared interests: ${interestRes.deletedCount}`);

    const contactRes = await ContactRequest.deleteMany({});
    console.log(`Cleared contact requests: ${contactRes.deletedCount}`);

    const notifyRes = await Notification.deleteMany({});
    console.log(`Cleared notifications: ${notifyRes.deletedCount}`);

    const auditRes = await AuditLog.deleteMany({});
    console.log(`Cleared audit logs: ${auditRes.deletedCount}`);

    const viewRes = await ListingView.deleteMany({});
    console.log(`Cleared listing views: ${viewRes.deletedCount}`);

    const otpRes = await OTP.deleteMany({});
    console.log(`Cleared OTPs: ${otpRes.deletedCount}`);

    const reviewRes = await Review.deleteMany({});
    console.log(`Cleared reviews: ${reviewRes.deletedCount}`);

    console.log('Database cleared of dummy data successfully. Essential categories are preserved for registration/listings.');
    process.exit(0);
  } catch (error) {
    console.error('Database cleaning failed:', error);
    process.exit(1);
  }
};

cleanDB();
