import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    customizations: [{
      name: String,
      selectedOptions: [{
        name: String,
        price: Number
      }]
    }],
    specialInstructions: String,
    itemTotal: {
      type: Number,
      required: true
    }
  }],
  orderSummary: {
    subtotal: {
      type: Number,
      required: true
    },
    deliveryFee: {
      type: Number,
      required: true
    },
    taxes: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  deliveryAddress: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    landmark: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contactInfo: {
    phone: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  paymentInfo: {
    razorpayOrderId: {
      type: String,
      required: true
    },
    razorpayPaymentId: String,
    razorpaySignature: String,
    method: {
      type: String,
      enum: ['card', 'netbanking', 'wallet', 'upi'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    failureReason: String
  },
  status: {
    type: String,
    enum: [
      'pending_payment',
      'payment_failed',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ],
    default: 'pending_payment'
  },
  estimatedDeliveryTime: {
    type: Date,
    required: true
  },
  actualDeliveryTime: Date,
  orderTracking: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String
  }],
  deliveryPartner: {
    name: String,
    phone: String,
    vehicle: String
  },
  rating: {
    food: {
      type: Number,
      min: 1,
      max: 5
    },
    delivery: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  specialInstructions: String,
  couponApplied: {
    code: String,
    discount: Number
  },
  refund: {
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['requested', 'approved', 'processed', 'rejected']
    },
    processedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'paymentInfo.razorpayOrderId': 1 });
orderSchema.index({ 'paymentInfo.status': 1 });

// Pre-save middleware to calculate estimated delivery time
orderSchema.pre('save', function (next) {
  if (this.isNew && !this.estimatedDeliveryTime) {
    // Add 30-45 minutes from now as estimated delivery time
    const now = new Date();
    const estimatedTime = new Date(now.getTime() + (35 * 60 * 1000)); // 35 minutes
    this.estimatedDeliveryTime = estimatedTime;
  }
  next();
});

// Virtual for order number
orderSchema.virtual('orderNumber').get(function () {
  return `ORD${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for formatted total
orderSchema.virtual('formattedTotal').get(function () {
  return `₹${(this.orderSummary.total / 100).toFixed(2)}`;
});

export default mongoose.model('Order', orderSchema);
