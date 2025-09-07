import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Menu item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  image: {
    type: String,
    required: [true, 'Item image is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Starters', 'Main Course', 'Rice & Biryani', 'Breads', 'Desserts',
      'Beverages', 'Salads', 'Soups', 'Snacks', 'Combo Meals'
    ]
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [500, 'Price must be at least ₹5'], // Store in paise
  },
  originalPrice: {
    type: Number,
    // For showing discounts
  },
  isVeg: {
    type: Boolean,
    required: true,
    default: true
  },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'spicy', 'very_spicy'],
    default: 'medium'
  },
  preparationTime: {
    type: Number,
    required: true,
    min: 5,
    max: 60,
    default: 15 // in minutes
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String,
    enum: ['nuts', 'dairy', 'gluten', 'soy', 'eggs', 'seafood'],
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  customizations: [{
    name: {
      type: String,
      required: true
    },
    options: [{
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        default: 0 // Additional price in paise
      }
    }],
    isRequired: {
      type: Boolean,
      default: false
    },
    allowMultiple: {
      type: Boolean,
      default: false
    }
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
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
  tags: [{
    type: String,
    lowercase: true
  }],
  orderCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
menuItemSchema.index({ isVeg: 1 });
menuItemSchema.index({ 'rating.average': -1 });
menuItemSchema.index({ tags: 1 });

// Virtual for discount percentage
menuItemSchema.virtual('discountPercentage').get(function () {
  if (!this.originalPrice || this.originalPrice <= this.price) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Virtual for formatted price
menuItemSchema.virtual('formattedPrice').get(function () {
  return `₹${(this.price / 100).toFixed(2)}`;
});

export default mongoose.model('MenuItem', menuItemSchema);
