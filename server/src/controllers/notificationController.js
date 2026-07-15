const Notification = require('../models/Notification');

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      companyId: req.company._id,
      channel: 'in_app',
    })
      .populate('listingId', 'title')
      .sort({ createdAt: -1 });

    return res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Verify ownership
    if (notification.companyId.toString() !== req.company._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to notification' });
    }

    notification.isRead = true;
    notification.openedAt = new Date();
    await notification.save();

    return res.status(200).json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
};
