import express from 'express';
import { razorpayInstance } from '../config/razorpay.js';
import { razorpayConfig } from '../config/razorpay.js';
import Order from '../models/Order.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRazorpaySignature } from '../utils/razorpayUtils.js';
import { generateOrderReceipt } from '../utils/pricing.js';
import { addMockOrder, getMockOrder } from '../utils/mockStore.js';

const router = express.Router();

// Create Razorpay order
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Mock mode: create a virtual order
    if (razorpayConfig.isMock) {
      const amount = Number(req.body.amount) > 0 ? Number(req.body.amount) : 49900; // fallback ₹499.00
      const mockOrder = {
        _id: orderId || `mock_${Date.now()}`,
        orderSummary: { total: amount },
        user: req.user?._id || 'mock_user',
        restaurant: 'mock_restaurant',
      };

      const rpOrder = await razorpayInstance.orders.create({
        amount,
        currency: 'INR',
        receipt: generateOrderReceipt(mockOrder._id),
        notes: {
          orderId: mockOrder._id.toString(),
          userId: mockOrder.user.toString(),
          restaurantId: mockOrder.restaurant.toString()
        }
      });

      return res.json({
        success: true,
        message: 'Mock payment order created',
        razorpayOrder: {
          id: rpOrder.id,
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          receipt: rpOrder.receipt
        },
        order: {
          _id: mockOrder._id,
          total: amount,
          formattedTotal: `₹${(amount / 100).toFixed(2)}`
        }
      });
    }

    // Find the order (real mode)
    const order = await Order.findById(orderId);
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

    // Check if order is in correct status
    if (order.status !== 'pending_payment') {
      return res.status(400).json({
        success: false,
        message: 'Order is not pending payment'
      });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: order.orderSummary.total, // Amount in paise
      currency: 'INR',
      receipt: generateOrderReceipt(order._id),
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        restaurantId: order.restaurant.toString()
      }
    });

    // Update order with Razorpay order ID
    order.paymentInfo.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      message: 'Razorpay order created successfully',
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      },
      order: {
        _id: order._id,
        total: order.orderSummary.total,
        formattedTotal: `₹${(order.orderSummary.total / 100).toFixed(2)}`
      }
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

// Verify payment
router.post('/verify-payment', authenticateToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    if (!razorpayConfig.isMock) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required payment details'
        });
      }
    } else if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required'
      });
    }

    // Mock mode: simulate success without DB
    if (razorpayConfig.isMock) {
      const existing = getMockOrder(orderId);
      const mockOrder = existing || addMockOrder({
        _id: orderId || `mock_${Date.now()}`,
        user: req.user?._id || 'mock_user',
        status: 'confirmed',
        orderSummary: { total: Number(req.body.amount) || 0 },
        createdAt: new Date().toISOString(),
        restaurant: 'mock_restaurant',
        items: [],
      });
      return res.json({
        success: true,
        message: 'Mock payment verified successfully',
        order: {
          _id: mockOrder._id,
          status: mockOrder.status,
          orderNumber: `ORD${mockOrder._id.toString().slice(-8).toUpperCase()}`,
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60000).toISOString(),
          formattedTotal: mockOrder.orderSummary.total ? `₹${(mockOrder.orderSummary.total / 100).toFixed(2)}` : undefined
        },
      });
    }

    // Find the order (real mode)
    const order = await Order.findById(orderId);
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

    // Verify Razorpay order ID matches
    if (order.paymentInfo.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay order ID'
      });
    }

    // Verify signature
    const isSignatureValid = validateRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isSignatureValid) {
      // Mark payment as failed
      order.paymentInfo.status = 'failed';
      order.paymentInfo.failureReason = 'Invalid signature';
      order.status = 'payment_failed';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Update order with payment details
    order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
    order.paymentInfo.razorpaySignature = razorpay_signature;
    order.paymentInfo.status = 'paid';
    order.paymentInfo.paidAt = new Date();
    order.status = 'confirmed';

    // Add tracking entry
    order.orderTracking.push({
      status: 'confirmed',
      description: 'Payment successful and order confirmed'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: {
        _id: order._id,
        status: order.status,
        orderNumber: `ORD${order._id.toString().slice(-8).toUpperCase()}`,
        estimatedDeliveryTime: order.estimatedDeliveryTime
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

// Handle payment failure
router.post('/payment-failed', authenticateToken, async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
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

    // Update order status
    order.paymentInfo.status = 'failed';
    order.paymentInfo.failureReason = reason || 'Payment failed';
    order.status = 'payment_failed';

    // Add tracking entry
    order.orderTracking.push({
      status: 'payment_failed',
      description: `Payment failed: ${reason || 'Unknown error'}`
    });

    await order.save();

    res.json({
      success: true,
      message: 'Payment failure recorded',
      order: {
        _id: order._id,
        status: order.status
      }
    });
  } catch (error) {
    console.error('Payment failure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment failure',
      error: error.message
    });
  }
});

// Get payment status
router.get('/status/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    if (razorpayConfig.isMock) {
      return res.json({
        success: true,
        payment: {
          status: 'paid',
          razorpayOrderId: `order_mock_${orderId}`,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          paidAt: new Date().toISOString(),
          amount: 49900,
          formattedAmount: '₹499.00'
        },
        orderStatus: 'confirmed'
      });
    }

    const order = await Order.findById(orderId)
      .select('paymentInfo status orderSummary user')
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
      payment: {
        status: order.paymentInfo.status,
        razorpayOrderId: order.paymentInfo.razorpayOrderId,
        razorpayPaymentId: order.paymentInfo.razorpayPaymentId,
        paidAt: order.paymentInfo.paidAt,
        amount: order.orderSummary.total,
        formattedAmount: `₹${(order.orderSummary.total / 100).toFixed(2)}`
      },
      orderStatus: order.status
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
});

export default router;
