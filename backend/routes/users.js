import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user profile (already covered in auth routes)
// This file can contain additional user-related routes

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Import here to avoid circular dependency
    const Order = (await import('../models/Order.js')).default;

    const userId = req.user._id;

    // Get order statistics
    const totalOrders = await Order.countDocuments({ user: userId });
    const completedOrders = await Order.countDocuments({
      user: userId,
      status: 'delivered'
    });

    // Get total spent
    const spentResult = await Order.aggregate([
      {
        $match: {
          user: userId,
          'paymentInfo.status': 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$orderSummary.total' }
        }
      }
    ]);

    const totalSpent = spentResult.length > 0 ? spentResult[0].totalSpent : 0;

    // Get favorite restaurant
    const favoriteResult = await Order.aggregate([
      {
        $match: {
          user: userId,
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: '$restaurant',
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      }
    ]);

    const favoriteRestaurant = favoriteResult.length > 0 ? {
      name: favoriteResult[0].restaurant[0]?.name || 'N/A',
      orderCount: favoriteResult[0].orderCount
    } : null;

    res.json({
      success: true,
      stats: {
        totalOrders,
        completedOrders,
        totalSpent,
        formattedTotalSpent: `₹${(totalSpent / 100).toFixed(2)}`,
        favoriteRestaurant
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
});

// Get recent orders
router.get('/recent-orders', authenticateToken, async (req, res) => {
  try {
    // Import here to avoid circular dependency
    const Order = (await import('../models/Order.js')).default;

    const recentOrders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('restaurant', 'name image')
      .select('restaurant orderSummary.total status createdAt')
      .lean();

    const formatted = recentOrders.map(order => ({
      _id: order._id,
      restaurant: order.restaurant,
      total: `₹${(order.orderSummary.total / 100).toFixed(2)}`,
      status: order.status,
      date: order.createdAt,
      orderNumber: `ORD${order._id.toString().slice(-8).toUpperCase()}`
    }));

    res.json({
      success: true,
      recentOrders: formatted
    });
  } catch (error) {
    console.error('Get recent orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent orders',
      error: error.message
    });
  }
});

export default router;
