const ContactRequest = require('../models/ContactRequest');
const Listing = require('../models/Listing');
const Company = require('../models/Company');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');

const createContactRequest = async (req, res, next) => {
  try {
    const { listingId, message } = req.body;

    if (!listingId) {
      return res.status(400).json({ message: 'Listing ID is required' });
    }

    const listing = await Listing.findById(listingId).populate('companyId');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Check if user is trying to request contact on their own listing
    if (listing.companyId._id.toString() === req.company._id.toString()) {
      return res.status(400).json({ message: 'You cannot request contact details for your own listing' });
    }

    // Check if request already exists
    const existingRequest = await ContactRequest.findOne({
      listingId: listing._id,
      buyerCompanyId: req.company._id,
    });

    if (existingRequest) {
      return res.status(400).json({
        message: `Contact request already exists with status: ${existingRequest.status}`,
        status: existingRequest.status,
      });
    }

    const contactRequest = await ContactRequest.create({
      listingId: listing._id,
      buyerCompanyId: req.company._id,
      sellerCompanyId: listing.companyId._id,
      status: 'REQUESTED',
      message: message || '',
    });

    // Create notifications for the seller (In-App + Email)
    const title = `Contact request received for "${listing.title}"`;
    const msg = `Company "${req.company.name}" has requested contact details for your listing "${listing.title}".`;

    await Notification.create({
      listingId: listing._id,
      companyId: listing.companyId._id,
      title,
      message: msg,
      channel: 'in_app',
    });

    await Notification.create({
      listingId: listing._id,
      companyId: listing.companyId._id,
      title,
      message: msg,
      channel: 'email',
    });

    // Send email to seller
    await sendEmail({
      to: listing.companyId.contactEmail,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #0f172a; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Contact Request Received</h2>
          <p>Hello ${listing.companyId.contactPersonName},</p>
          <p>A verified company, <strong>${req.company.name}</strong>, is interested in your listing <strong>${listing.title}</strong> and has requested your business contact details.</p>
          ${message ? `<div style="background-color: #f1f5f9; padding: 10px; border-radius: 4px; font-style: italic;">"${message}"</div>` : ''}
          <p>Please log into the portal to Accept or Decline this request. Contact info is only shared if you Accept.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact-requests" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Manage Request</a></p>
        </div>
      `,
    });

    return res.status(201).json({
      message: 'Contact request submitted successfully',
      contactRequest,
    });
  } catch (error) {
    next(error);
  }
};

const respondContactRequest = async (req, res, next) => {
  try {
    const { status } = req.body; // 'ACCEPTED' or 'DECLINED'
    if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be ACCEPTED or DECLINED.' });
    }

    const contactRequest = await ContactRequest.findById(req.params.id)
      .populate('buyerCompanyId')
      .populate('sellerCompanyId')
      .populate('listingId');

    if (!contactRequest) {
      return res.status(404).json({ message: 'Contact request not found' });
    }

    // Ensure the responder is the seller
    if (contactRequest.sellerCompanyId._id.toString() !== req.company._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized. You are not the seller of this listing.' });
    }

    if (contactRequest.status !== 'REQUESTED') {
      return res.status(400).json({ message: `Request has already been processed: ${contactRequest.status}` });
    }

    contactRequest.status = status;
    contactRequest.respondedAt = new Date();
    await contactRequest.save();

    // Create notifications for the buyer
    const title = `Contact request ${status.toLowerCase()} for "${contactRequest.listingId.title}"`;
    const message = status === 'ACCEPTED'
      ? `Seller "${contactRequest.sellerCompanyId.name}" accepted your contact request for "${contactRequest.listingId.title}". You can now view their contact details.`
      : `Seller "${contactRequest.sellerCompanyId.name}" declined your contact request for "${contactRequest.listingId.title}".`;

    await Notification.create({
      listingId: contactRequest.listingId._id,
      companyId: contactRequest.buyerCompanyId._id,
      title,
      message,
      channel: 'in_app',
    });

    await Notification.create({
      listingId: contactRequest.listingId._id,
      companyId: contactRequest.buyerCompanyId._id,
      title,
      message,
      channel: 'email',
    });

    // Send email to buyer
    const buyerEmailHtml = status === 'ACCEPTED'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #10b981; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Contact Request Approved</h2>
          <p>Hello ${contactRequest.buyerCompanyId.contactPersonName},</p>
          <p>Great news! The seller <strong>${contactRequest.sellerCompanyId.name}</strong> has accepted your contact request for <strong>${contactRequest.listingId.title}</strong>.</p>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; border: 1px solid #bbf7d0; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #166534;">Seller Contact Information:</h3>
            <p><strong>Company:</strong> ${contactRequest.sellerCompanyId.name}</p>
            <p><strong>Contact Person:</strong> ${contactRequest.sellerCompanyId.contactPersonName}</p>
            <p><strong>Phone:</strong> ${contactRequest.sellerCompanyId.contactPhone}</p>
            <p><strong>Email:</strong> ${contactRequest.sellerCompanyId.contactEmail}</p>
            <p><strong>Location:</strong> ${contactRequest.sellerCompanyId.city}, ${contactRequest.sellerCompanyId.state}</p>
          </div>
          <p>Feel free to reach out directly to coordinate transaction terms, freight/logistics, and payments.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/listings/${contactRequest.listingId._id}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Listing</a></p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #ef4444; text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Contact Request Declined</h2>
          <p>Hello ${contactRequest.buyerCompanyId.contactPersonName},</p>
          <p>We want to inform you that your contact details request for <strong>${contactRequest.listingId.title}</strong> was declined by the seller <strong>${contactRequest.sellerCompanyId.name}</strong>.</p>
          <p>You can continue to search the marketplace for other active textile waste lots that suit your production needs.</p>
        </div>
      `;

    await sendEmail({
      to: contactRequest.buyerCompanyId.contactEmail,
      subject: title,
      html: buyerEmailHtml,
    });

    return res.status(200).json({
      message: `Contact request ${status.toLowerCase()} successfully`,
      contactRequest,
    });
  } catch (error) {
    next(error);
  }
};

const getMyContactRequests = async (req, res, next) => {
  try {
    // Requests sent by the company (Buyer requests)
    const sent = await ContactRequest.find({ buyerCompanyId: req.company._id })
      .populate('sellerCompanyId', 'name contactPersonName contactEmail contactPhone city state')
      .populate('listingId', 'title status fields')
      .sort({ createdAt: -1 });

    // Requests received by the company (Seller requests)
    const received = await ContactRequest.find({ sellerCompanyId: req.company._id })
      .populate('buyerCompanyId', 'name contactPersonName contactEmail contactPhone city state')
      .populate('listingId', 'title status fields')
      .sort({ createdAt: -1 });

    // Clean outputs: if status is not ACCEPTED, omit details in sent array
    const cleanedSent = sent.map((reqItem) => {
      const item = reqItem.toObject();
      if (item.status !== 'ACCEPTED') {
        item.sellerCompanyId = {
          _id: item.sellerCompanyId._id,
          name: item.sellerCompanyId.name,
          city: item.sellerCompanyId.city,
          state: item.sellerCompanyId.state,
          contactPersonName: item.sellerCompanyId.contactPersonName,
          contactEmail: '[Gated]',
          contactPhone: '[Gated]',
        };
      }
      return item;
    });

    // Clean outputs: if status is not ACCEPTED, omit details in received array
    const cleanedReceived = received.map((reqItem) => {
      const item = reqItem.toObject();
      if (item.status !== 'ACCEPTED') {
        item.buyerCompanyId = {
          _id: item.buyerCompanyId._id,
          name: item.buyerCompanyId.name,
          city: item.buyerCompanyId.city,
          state: item.buyerCompanyId.state,
          contactPersonName: item.buyerCompanyId.contactPersonName,
          contactEmail: '[Gated]',
          contactPhone: '[Gated]',
        };
      }
      return item;
    });

    return res.status(200).json({
      sent: cleanedSent,
      received: cleanedReceived,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContactRequest,
  respondContactRequest,
  getMyContactRequests,
};
