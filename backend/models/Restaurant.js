import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    maxlength: [100, 'Restaurant name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  cuisine: [{
    type: String,
    required: true,
    enum: [
      'North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican',
      'Thai', 'Continental', 'Fast Food', 'Desserts', 'Beverages',
      'Biryani', 'Pizza', 'Burger', 'Sandwich', 'Healthy', 'Vegan'
    ]
  }],
  image: {
    type: String,
    required: [true, 'Restaurant image is required']
  },
  images: [{
    type: String
  }],
  address: {
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
      required: true,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
    },
    landmark: String,
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  contact: {
    phone: {
      type: String,
      required: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    email: {
      type: String,
      required: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  pricing: {
    type: String,
    enum: ['₹', '₹₹', '₹₹₹'],
    default: '₹₹'
  },
  deliveryTime: {
    min: {
      type: Number,
      required: true,
      min: 10
    },
    max: {
      type: Number,
      required: true,
      min: 15
    }
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0,
    // Store in paise
    default: 3000 // ₹30
  },
  minimumOrder: {
    type: Number,
    required: true,
    min: 0,
    // Store in paise
    default: 15000 // ₹150
  },
  operatingHours: {
    monday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '23:00' }
    },
    sunday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '23:00' }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  offers: [{
    title: String,
    description: String,
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage'
    },
    discountValue: Number,
    minimumOrder: Number,
    maxDiscount: Number,
    validUntil: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
restaurantSchema.index({ 'address.coordinates': '2dsphere' });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ 'rating.average': -1 });
restaurantSchema.index({ isActive: 1, isApproved: 1 });
restaurantSchema.index({ tags: 1 });

// Virtual for checking if restaurant is currently open
restaurantSchema.virtual('isCurrentlyOpen').get(function () {
  const now = new Date();
  const dayName = now.toLocaleLowerCase().substring(0, 3);
  const currentTime = now.toTimeString().slice(0, 5);

  const todayHours = this.operatingHours[dayName];
  if (!todayHours || !todayHours.isOpen) return false;

  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
});

export default mongoose.model('Restaurant', restaurantSchema);
