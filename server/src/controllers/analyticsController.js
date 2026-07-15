const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const getSellerAnalytics = async (req, res, next) => {
  try {
    const companyId = req.company._id;

    // Aggregate listing metrics
    const analytics = await Listing.aggregate([
      {
        $match: { companyId: new mongoose.Types.ObjectId(companyId) }
      },
      {
        $lookup: {
          from: 'contactrequests',
          localField: '_id',
          foreignField: 'listingId',
          as: 'requests'
        }
      },
      {
        $project: {
          title: 1,
          status: 1,
          viewCount: 1,
          createdAt: 1,
          soldAt: 1,
          totalRequests: { $size: '$requests' },
          acceptedRequests: {
            $size: {
              $filter: {
                input: '$requests',
                as: 'req',
                cond: { $eq: ['$$req.status', 'ACCEPTED'] }
              }
            }
          },
          declinedRequests: {
            $size: {
              $filter: {
                input: '$requests',
                as: 'req',
                cond: { $eq: ['$$req.status', 'DECLINED'] }
              }
            }
          },
          pendingRequests: {
            $size: {
              $filter: {
                input: '$requests',
                as: 'req',
                cond: { $eq: ['$$req.status', 'REQUESTED'] }
              }
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Calculate aggregated company-level summaries
    let overallViews = 0;
    let overallRequests = 0;
    let overallAccepted = 0;
    let totalActive = 0;
    let totalSold = 0;

    analytics.forEach((item) => {
      overallViews += item.viewCount || 0;
      overallRequests += item.totalRequests || 0;
      overallAccepted += item.acceptedRequests || 0;
      if (item.status === 'ACTIVE') totalActive++;
      if (item.status === 'SOLD') totalSold++;
    });

    return res.status(200).json({
      summary: {
        overallViews,
        overallRequests,
        overallAccepted,
        totalActive,
        totalSold,
        listingCount: analytics.length,
      },
      listings: analytics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSellerAnalytics,
};
