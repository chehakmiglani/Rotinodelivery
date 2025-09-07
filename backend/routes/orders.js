import express from 'express';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { createOrderSchema, updateOrderStatusSchema, rateOrderSchema } from '../schemas/orderSchemas.js';
import { calculateOrderTotal } from '../utils/pricing.js';

dotenv.config();
const router = express.Router();
const isMock = process.env.AUTH_MODE === 'mock';

// Lightweight health endpoint for this router
router.get('/health', (req, res) => {
  res.json({ success: true, router: 'orders', mode: isMock ? 'mock' : 'live' });
});

// Create order
router.post('/', authenticateToken, validateRequest(createOrderSchema), async (req, res) => {
  try {
    const {
      restaurant: restaurantId,
      items,
      deliveryAddress,
      contactInfo,
      specialInstructions,
      couponCode
    } = req.body;

    // Verify restaurant exists and is active
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive || !restaurant.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found or not available'
      });
    }

    // Validate and calculate items
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${item.menuItem} is not available`
        });
      }

      if (menuItem.restaurant.toString() !== restaurantId) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${menuItem.name} does not belong to this restaurant`
        });
      }

      let itemPrice = menuItem.price;
      let customizationTotal = 0;

      // Calculate customization costs
      if (item.customizations && item.customizations.length > 0) {
        for (const customization of item.customizations) {
          for (const option of customization.selectedOptions) {
            customizationTotal += option.price || 0;
          }
        }
      }

      const itemTotal = (itemPrice + customizationTotal) * item.quantity;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: itemPrice,
        quantity: item.quantity,
        customizations: item.customizations || [],
        specialInstructions: item.specialInstructions || '',
        itemTotal
      });

      subtotal += itemTotal;
    }

    // Check minimum order amount
    if (subtotal < restaurant.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${(restaurant.minimumOrder / 100).toFixed(2)}`
      });
    }

    // Calculate order summary
    const orderSummary = calculateOrderTotal(orderItems, restaurant.deliveryFee);

    // Create order
    const order = new Order({
      user: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      orderSummary,
      deliveryAddress,
      contactInfo,
      specialInstructions,
      paymentInfo: {
        razorpayOrderId: '', // Will be set when creating Razorpay order
        status: 'pending'
      },
      status: 'pending_payment'
    });

    // Add initial tracking entry
    order.orderTracking.push({
      status: 'pending_payment',
      description: 'Order created, waiting for payment'
    });

    await order.save();

    // Populate the order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name image deliveryTime')
      .populate('items.menuItem', 'name image');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        _id: populatedOrder._id,
        orderNumber: `ORD${populatedOrder._id.toString().slice(-8).toUpperCase()}`,
        status: populatedOrder.status,
        restaurant: populatedOrder.restaurant,
        items: populatedOrder.items,
        orderSummary: {
          ...populatedOrder.orderSummary,
          formattedSubtotal: `₹${(populatedOrder.orderSummary.subtotal / 100).toFixed(2)}`,
          formattedDeliveryFee: `₹${(populatedOrder.orderSummary.deliveryFee / 100).toFixed(2)}`,
          formattedTaxes: `₹${(populatedOrder.orderSummary.taxes / 100).toFixed(2)}`,
          formattedTotal: `₹${(populatedOrder.orderSummary.total / 100).toFixed(2)}`
        },
        estimatedDeliveryTime: populatedOrder.estimatedDeliveryTime
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    // In mock mode, return a safe empty list so UI works without DB
    if (isMock) {
      return res.json({ success: true, orders: [], pagination: { current: 1, total: 0, count: 0, totalOrders: 0 } });
    }
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('restaurant', 'name image cuisine')
      .populate('items.menuItem', 'name image')
      .select('-paymentInfo.razorpaySignature -__v');

    const total = await Order.countDocuments(filter);

    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.orderNumber = `ORD${order._id.toString().slice(-8).toUpperCase()}`;
      orderObj.formattedTotal = `₹${(order.orderSummary.total / 100).toFixed(2)}`;
      orderObj.itemCount = order.items.length;
      return orderObj;
    });

    res.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: orders.length,
        totalOrders: total
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get single order
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('restaurant', 'name image contact deliveryTime')
      .populate('items.menuItem', 'name image')
      .select('-paymentInfo.razorpaySignature -__v');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to order'
      });
    }

    const orderObj = order.toObject();
    orderObj.orderNumber = `ORD${order._id.toString().slice(-8).toUpperCase()}`;
    orderObj.orderSummary.formattedSubtotal = `₹${(order.orderSummary.subtotal / 100).toFixed(2)}`;
    orderObj.orderSummary.formattedDeliveryFee = `₹${(order.orderSummary.deliveryFee / 100).toFixed(2)}`;
    orderObj.orderSummary.formattedTaxes = `₹${(order.orderSummary.taxes / 100).toFixed(2)}`;
    orderObj.orderSummary.formattedTotal = `₹${(order.orderSummary.total / 100).toFixed(2)}`;

    res.json({
      success: true,
      order: orderObj
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// Cancel order
router.patch('/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to order'
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending_payment', 'confirmed', 'preparing'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.orderTracking.push({
      status: 'cancelled',
      description: 'Order cancelled by customer'
    });

    // If payment was made, initiate refund
    if (order.paymentInfo.status === 'paid') {
      order.refund = {
        amount: order.orderSummary.total,
        reason: 'Order cancelled by customer',
        status: 'requested'
      };
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        _id: order._id,
        status: order.status,
        orderNumber: `ORD${order._id.toString().slice(-8).toUpperCase()}`
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

// Rate order
router.post('/:orderId/rate', authenticateToken, validateRequest(rateOrderSchema), async (req, res) => {
  try {
    const { food, delivery, overall, review } = req.body;

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to order'
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Order must be delivered to rate'
      });
    }

    // Check if already rated
    if (order.rating && order.rating.ratedAt) {
      return res.status(400).json({
        success: false,
        message: 'Order has already been rated'
      });
    }

    // Update order rating
    order.rating = {
      food,
      delivery,
      overall,
      review: review || '',
      ratedAt: new Date()
    };

    await order.save();

    res.json({
      success: true,
      message: 'Order rated successfully',
      rating: order.rating
    });
  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate order',
      error: error.message
    });
  }
});

// Get order tracking
router.get('/:orderId/tracking', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .select('status orderTracking estimatedDeliveryTime actualDeliveryTime deliveryPartner')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to order'
      });
    }

    res.json({
      success: true,
      tracking: {
        currentStatus: order.status,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        actualDeliveryTime: order.actualDeliveryTime,
        deliveryPartner: order.deliveryPartner,
        timeline: order.orderTracking
      }
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order tracking',
      error: error.message
    });
  }
});

export default router;
