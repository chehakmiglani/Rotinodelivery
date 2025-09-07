import express from 'express';
import Restaurant from '../models/Restaurant.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Mock data for when database is not available
const mockRestaurants = [
  {
    _id: '1',
    name: 'Spice Garden',
    cuisine: ['North Indian', 'Biryani'],
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    rating: { average: 4.5, count: 150 },
    deliveryTime: { min: 25, max: 35 },
    deliveryFee: 0,
    formattedDeliveryFee: 'Free',
    location: { address: 'Sector 1, New Delhi' },
    description: 'Authentic North Indian cuisine with traditional flavors',
    isActive: true,
    isApproved: true,
    isFeatured: true
  },
  {
    _id: '2',
    name: 'Pizza Corner',
    cuisine: ['Italian', 'Pizza'],
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    rating: { average: 4.3, count: 200 },
    deliveryTime: { min: 20, max: 30 },
    deliveryFee: 2000,
    formattedDeliveryFee: '₹20',
    location: { address: 'Central Market, Delhi' },
    description: 'Fresh wood-fired pizzas and Italian delicacies',
    isActive: true,
    isApproved: true,
    isFeatured: true
  },
  {
    _id: '3',
    name: 'Burger Palace',
    cuisine: ['Fast Food', 'Burger'],
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    rating: { average: 4.1, count: 120 },
    deliveryTime: { min: 15, max: 25 },
    deliveryFee: 1500,
    formattedDeliveryFee: '₹15',
    location: { address: 'Mall Road, Delhi' },
    description: 'Juicy burgers and crispy fries made fresh daily',
    isActive: true,
    isApproved: true,
    isFeatured: false
  },
  {
    _id: '4',
    name: 'Noodle House',
    cuisine: ['Chinese', 'Thai'],
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400',
    rating: { average: 4.4, count: 180 },
    deliveryTime: { min: 30, max: 40 },
    deliveryFee: 2500,
    formattedDeliveryFee: '₹25',
    location: { address: 'Karol Bagh, Delhi' },
    description: 'Authentic Asian noodles and stir-fry dishes',
    isActive: true,
    isApproved: true,
    isFeatured: true
  }
];

const mockCuisines = [
  'North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican', 'Thai',
  'Continental', 'Fast Food', 'Desserts', 'Beverages', 'Biryani', 'Pizza'
];

// Get all restaurants (with filters)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      cuisine,
      rating,
      pricing,
      sortBy = 'rating',
      sortOrder = 'desc',
      page = 1,
      limit = 12
    } = req.query;

    // Check if database is connected
    let isDbConnected = false;
    try {
      isDbConnected = Restaurant.db && Restaurant.db.readyState === 1;
    } catch (error) {
      isDbConnected = false;
    }

    if (!isDbConnected) {
      // Return mock data
      let filteredRestaurants = [...mockRestaurants];

      // Apply filters
      if (search) {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.name.toLowerCase().includes(search.toLowerCase()) ||
          restaurant.description.toLowerCase().includes(search.toLowerCase()) ||
          restaurant.cuisine.some(c => c.toLowerCase().includes(search.toLowerCase()))
        );
      }

      if (cuisine) {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.cuisine.includes(cuisine)
        );
      }

      if (rating) {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
          restaurant.rating.average >= parseFloat(rating)
        );
      }

      // Sort
      filteredRestaurants.sort((a, b) => {
        const aVal = sortBy === 'rating' ? a.rating.average : a.deliveryTime.min;
        const bVal = sortBy === 'rating' ? b.rating.average : b.deliveryTime.min;
        return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });

      return res.json({
        success: true,
        restaurants: filteredRestaurants,
        total: filteredRestaurants.length,
        totalPages: 1,
        currentPage: 1,
        message: 'Using mock data - database not connected'
      });
    }    // Build filter query
    const filter = { isActive: true, isApproved: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $in: [new RegExp(search, 'i')] } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (cuisine) {
      const cuisines = cuisine.split(',');
      filter.cuisine = { $in: cuisines };
    }

    if (rating) {
      filter['rating.average'] = { $gte: parseFloat(rating) };
    }

    if (pricing) {
      filter.pricing = pricing;
    }

    // Build sort query
    let sortQuery = {};
    switch (sortBy) {
      case 'rating':
        sortQuery = { 'rating.average': sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'deliveryTime':
        sortQuery = { 'deliveryTime.min': sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'deliveryFee':
        sortQuery = { deliveryFee: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'name':
        sortQuery = { name: sortOrder === 'asc' ? 1 : -1 };
        break;
      default:
        sortQuery = { 'rating.average': -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const restaurants = await Restaurant.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name email')
      .select('-__v');

    const total = await Restaurant.countDocuments(filter);

    // Add formatted pricing and current open status
    const formattedRestaurants = restaurants.map(restaurant => {
      const restaurantObj = restaurant.toObject();
      restaurantObj.formattedDeliveryFee = `₹${(restaurant.deliveryFee / 100).toFixed(2)}`;
      restaurantObj.formattedMinimumOrder = `₹${(restaurant.minimumOrder / 100).toFixed(2)}`;

      // Check if currently open (you can implement this logic)
      restaurantObj.isCurrentlyOpen = true; // Placeholder

      return restaurantObj;
    });

    res.json({
      success: true,
      restaurants: formattedRestaurants,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: restaurants.length,
        totalRestaurants: total
      }
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants',
      error: error.message
    });
  }
});

// Get restaurant by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email phone')
      .select('-__v');

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (!restaurant.isActive || !restaurant.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant is not available'
      });
    }

    const restaurantObj = restaurant.toObject();
    restaurantObj.formattedDeliveryFee = `₹${(restaurant.deliveryFee / 100).toFixed(2)}`;
    restaurantObj.formattedMinimumOrder = `₹${(restaurant.minimumOrder / 100).toFixed(2)}`;
    restaurantObj.isCurrentlyOpen = true; // Placeholder

    res.json({
      success: true,
      restaurant: restaurantObj
    });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant',
      error: error.message
    });
  }
});

// Get featured restaurants
router.get('/featured/list', optionalAuth, async (req, res) => {
  try {
    // Check if database is connected
    let isDbConnected = false;
    try {
      isDbConnected = Restaurant.db && Restaurant.db.readyState === 1;
    } catch (error) {
      isDbConnected = false;
    }

    if (!isDbConnected) {
      // Return mock featured restaurants
      const featuredRestaurants = mockRestaurants.filter(r => r.isFeatured);
      return res.json({
        success: true,
        restaurants: featuredRestaurants,
        message: 'Using mock data - database not connected'
      });
    } const featuredRestaurants = await Restaurant.find({
      isActive: true,
      isApproved: true,
      'rating.average': { $gte: 4.0 }
    })
      .sort({ 'rating.average': -1 })
      .limit(6)
      .select('name description cuisine image rating pricing deliveryTime deliveryFee')
      .lean();

    const formatted = featuredRestaurants.map(restaurant => ({
      ...restaurant,
      formattedDeliveryFee: `₹${(restaurant.deliveryFee / 100).toFixed(2)}`,
      isCurrentlyOpen: true
    }));

    res.json({
      success: true,
      restaurants: formatted
    });
  } catch (error) {
    console.error('Get featured restaurants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured restaurants',
      error: error.message
    });
  }
});

// Get cuisines
router.get('/meta/cuisines', async (req, res) => {
  try {
    // Check if database is connected
    let isDbConnected = false;
    try {
      isDbConnected = Restaurant.db && Restaurant.db.readyState === 1;
    } catch (error) {
      isDbConnected = false;
    }

    if (!isDbConnected) {
      // Return mock cuisines
      return res.json({
        success: true,
        cuisines: mockCuisines,
        message: 'Using mock data - database not connected'
      });
    } const cuisines = await Restaurant.distinct('cuisine', {
      isActive: true,
      isApproved: true
    });

    res.json({
      success: true,
      cuisines: cuisines.sort()
    });
  } catch (error) {
    console.error('Get cuisines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cuisines',
      error: error.message
    });
  }
});

export default router;
