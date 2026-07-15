const Interest = require('../models/Interest');
const Company = require('../models/Company');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

/**
 * Compares listing fields against interest subFilters.
 * Returns true if the listing matches the interest parameters.
 */
const isMatch = (listing, subFilters) => {
  if (!subFilters || Object.keys(subFilters).length === 0) return true;

  for (const [key, filterValue] of Object.entries(subFilters)) {
    if (filterValue === undefined || filterValue === null || filterValue === '') continue;

    // Handle min quantity check
    if (key === 'minQty' || key === 'minQuantityKg') {
      const qty = Number(listing.fields?.quantityKg);
      if (isNaN(qty) || qty < Number(filterValue)) {
        return false;
      }
      continue;
    }

    // Handle location filter (check case-insensitive match on city, state, or location field)
    if (key === 'location') {
      const val = (filterValue || '').toString().toLowerCase();
      const listingLoc = (listing.fields?.location || '').toString().toLowerCase();
      if (!listingLoc.includes(val)) {
        return false;
      }
      continue;
    }

    // Standard field exact or array match
    const listingValue = listing.fields?.[key];
    if (listingValue === undefined) {
      return false;
    }

    // If listing field is an array (like colors), check if filter value matches any or subset
    if (Array.isArray(listingValue)) {
      const fVal = Array.isArray(filterValue) ? filterValue : [filterValue];
      const hasOverlap = fVal.some(item => listingValue.map(x => x.toLowerCase()).includes(item.toLowerCase()));
      if (!hasOverlap) return false;
      continue;
    }

    // String/Number comparisons
    if (listingValue.toString().toLowerCase() !== filterValue.toString().toLowerCase()) {
      return false;
    }
  }

  return true;
};

/**
 * Match a new listing with registered interests and notify buyers.
 * synchronously runs for MVP. (Note: move to BullMQ + Redis background queue for production scale).
 */
const matchAndNotify = async (listing) => {
  try {
    // Populate listing Category to get category details
    await listing.populate('categoryId');
    const categoryName = listing.categoryId?.name || 'Textile Waste';

    // Find all interests for this category
    const interests = await Interest.find({ categoryId: listing.categoryId._id })
      .populate('companyId');

    for (const interest of interests) {
      const buyer = interest.companyId;

      // Exclude listing owner
      if (buyer._id.toString() === listing.companyId.toString()) {
        continue;
      }

      // Check if buyer company is verified
      if (buyer.verificationStatus !== 'VERIFIED') {
        continue;
      }

      // Perform matching logic
      if (isMatch(listing, interest.subFilters)) {
        const title = `New Matching Listing: ${listing.title}`;
        const message = `A new listing matching your interests was posted: "${listing.title}". Quantity: ${listing.fields?.quantityKg || 'N/A'} kg, Location: ${listing.fields?.location || 'N/A'}.`;

        // Create In-App Notification
        await Notification.create({
          listingId: listing._id,
          companyId: buyer._id,
          title,
          message,
          channel: 'in_app',
        });

        // Create Email Notification record
        await Notification.create({
          listingId: listing._id,
          companyId: buyer._id,
          title,
          message,
          channel: 'email',
        });

        // Send actual mock email
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
            <h2 style="color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 10px;">TextileWasteHub Alert</h2>
            <p>Dear ${buyer.contactPersonName},</p>
            <p>We found a new listing that matches your registered interests for <strong>${categoryName}</strong>:</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0f172a;">${listing.title}</h3>
              <p><strong>Quantity:</strong> ${listing.fields?.quantityKg || 'N/A'} kg</p>
              <p><strong>Location:</strong> ${listing.fields?.location || 'N/A'}</p>
              ${listing.fields?.priceExpectationPerKg ? `<p><strong>Target Price:</strong> ₹${listing.fields.priceExpectationPerKg}/kg</p>` : ''}
            </div>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/listings/${listing._id}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Listing Details</a></p>
            <p style="color: #64748b; font-size: 12px; margin-top: 30px;">You received this because you registered an interest in this category. To update preferences, log into your profile dashboard.</p>
          </div>
        `;

        await sendEmail({
          to: buyer.contactEmail,
          subject: title,
          html: emailHtml,
        });
      }
    }
  } catch (error) {
    console.error('Error during interest matching:', error);
  }
};

module.exports = {
  matchAndNotify,
};
