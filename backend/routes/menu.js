import express from 'express';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const isMockAuth = process.env.AUTH_MODE === 'mock';

// Popular menu items (for homepage grid)
router.get('/popular', optionalAuth, async (req, res) => {
  try {
    // Try real DB first
    let items = [];
    try {
      items = await MenuItem.find({ isAvailable: true })
        .sort({ orderCount: -1, 'rating.average': -1 })
        .limit(12)
        .populate('restaurant', 'name')
        .select('-__v');
    } catch (e) {
      // DB might be down; fall back below
    }

    if (!items || items.length === 0) {
      // Mock fallback set
      const mockRestaurant = { _id: 'mock_rest', name: 'Curry Palace' };
      const fallback = [
        { name: 'Margherita Pizza', image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500', price: 19900, restaurant: { _id: 'mock_r1', name: 'Pizzeria A' } },
        { name: 'Cheeseburger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', price: 14900, restaurant: { _id: 'mock_r2', name: 'Burger Joint' } },
        { name: 'Chicken Tikka Masala', image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500', price: 24900, restaurant: { _id: 'mock_r3', name: 'Spice House' } },
        { name: 'Paneer Butter Masala', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500', price: 22900, restaurant: mockRestaurant },
        { name: 'Chow Mein', image: 'https://images.unsplash.com/photo-1580557924943-3c24c1d02cba?w=500', price: 17900, restaurant: { _id: 'mock_r4', name: 'Dragon Wok' } },
        { name: 'Chocolate Cake', image: 'https://images.unsplash.com/photo-1599785209796-d8e3ee8b7c94?w=500', price: 12900, restaurant: { _id: 'mock_r5', name: 'Sweet Treats' } },
      ];

      return res.json({
        success: true,
        items: fallback.map((i, idx) => ({
          _id: `mock_item_${idx}`,
          name: i.name,
          image: i.image,
          price: i.price,
          formattedPrice: `₹${(i.price / 100).toFixed(2)}`,
          restaurant: i.restaurant,
        }))
      });
    }

    const formatted = items.map((item) => ({
      _id: item._id,
      name: item.name,
      image: item.image,
      price: item.price,
      formattedPrice: `₹${(item.price / 100).toFixed(2)}`,
      restaurant: item.restaurant,
    }));

    res.json({ success: true, items: formatted });
  } catch (error) {
    console.error('Get popular menu error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch popular items', error: error.message });
  }
});

// Get menu items for a restaurant
router.get('/restaurant/:restaurantId', optionalAuth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { category, isVeg, sortBy = 'category', search } = req.query;

    // Verify restaurant exists and is active
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive || !restaurant.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found or not available'
      });
    }

    // Build filter query
    const filter = { restaurant: restaurantId, isAvailable: true };

    if (category) {
      filter.category = category;
    }

    if (isVeg === 'true') {
      filter.isVeg = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort query
    let sortQuery = {};
    switch (sortBy) {
      case 'price_low':
        sortQuery = { price: 1 };
        break;
      case 'price_high':
        sortQuery = { price: -1 };
        break;
      case 'rating':
        sortQuery = { 'rating.average': -1 };
        break;
      case 'popular':
        sortQuery = { orderCount: -1 };
        break;
      default:
        sortQuery = { category: 1, name: 1 };
    }

    const menuItems = await MenuItem.find(filter)
      .sort(sortQuery)
      .populate('restaurant', 'name')
      .select('-__v');

    // Group by category
    const groupedMenu = {};
    const categories = [];

    menuItems.forEach(item => {
      const itemObj = item.toObject();
      itemObj.formattedPrice = `₹${(item.price / 100).toFixed(2)}`;

      if (item.originalPrice) {
        itemObj.formattedOriginalPrice = `₹${(item.originalPrice / 100).toFixed(2)}`;
        itemObj.discountPercentage = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
      }

      if (!groupedMenu[item.category]) {
        groupedMenu[item.category] = [];
        categories.push(item.category);
      }

      groupedMenu[item.category].push(itemObj);
    });

    res.json({
      success: true,
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        image: restaurant.image
      },
      menu: groupedMenu,
      categories: categories.sort(),
      totalItems: menuItems.length
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu',
      error: error.message
    });
  }
});

// Get single menu item
router.get('/item/:itemId', optionalAuth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.itemId)
      .populate('restaurant', 'name image deliveryTime')
      .select('-__v');

    if (!menuItem || !menuItem.isAvailable) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found or not available'
      });
    }

    const itemObj = menuItem.toObject();
    itemObj.formattedPrice = `₹${(menuItem.price / 100).toFixed(2)}`;

    if (menuItem.originalPrice) {
      itemObj.formattedOriginalPrice = `₹${(menuItem.originalPrice / 100).toFixed(2)}`;
      itemObj.discountPercentage = Math.round(((menuItem.originalPrice - menuItem.price) / menuItem.originalPrice) * 100);
    }

    res.json({
      success: true,
      menuItem: itemObj
    });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch menu item',
      error: error.message
    });
  }
});

// Get menu categories for a restaurant
router.get('/restaurant/:restaurantId/categories', async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const categories = await MenuItem.distinct('category', {
      restaurant: restaurantId,
      isAvailable: true
    });

    res.json({
      success: true,
      categories: categories.sort()
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Get recommended items
router.get('/recommended/:restaurantId', optionalAuth, async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const recommendedItems = await MenuItem.find({
      restaurant: restaurantId,
      isAvailable: true,
      $or: [
        { isRecommended: true },
        { isBestseller: true },
        { 'rating.average': { $gte: 4.0 } }
      ]
    })
      .sort({ 'rating.average': -1, orderCount: -1 })
      .limit(6)
      .populate('restaurant', 'name')
      .select('-__v');

    const formatted = recommendedItems.map(item => {
      const itemObj = item.toObject();
      itemObj.formattedPrice = `₹${(item.price / 100).toFixed(2)}`;

      if (item.originalPrice) {
        itemObj.formattedOriginalPrice = `₹${(item.originalPrice / 100).toFixed(2)}`;
        itemObj.discountPercentage = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
      }

      return itemObj;
    });

    res.json({
      success: true,
      recommendedItems: formatted
    });
  } catch (error) {
    console.error('Get recommended items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommended items',
      error: error.message
    });
  }
});

export default router;
