import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});

    console.log('📦 Cleared existing data');

    // Create sample users
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        phone: '9876543210',
        role: 'customer',
        addresses: [{
          type: 'home',
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          landmark: 'Near Metro Station',
          isDefault: true
        }]
      },
      {
        name: 'Pizza Palace Owner',
        email: 'owner@pizzapalace.com',
        password: 'Password123',
        phone: '9876543211',
        role: 'restaurant_owner'
      },
      {
        name: 'Burger Hub Owner',
        email: 'owner@burgerhub.com',
        password: 'Password123',
        phone: '9876543212',
        role: 'restaurant_owner'
      }
    ]);

    console.log('👥 Created sample users');

    // Create sample restaurants
    const restaurants = await Restaurant.create([
      {
        name: 'Pizza Palace',
        description: 'Authentic Italian pizzas made with fresh ingredients and traditional recipes',
        cuisine: ['Italian', 'Pizza'],
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500',
        images: [
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500',
          'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=500'
        ],
        address: {
          street: 'Shop 12, Food Court, Linking Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          landmark: 'Near Bandra Station',
          coordinates: {
            latitude: 19.0596,
            longitude: 72.8295
          }
        },
        contact: {
          phone: '9876543211',
          email: 'contact@pizzapalace.com'
        },
        owner: users[1]._id,
        rating: {
          average: 4.5,
          count: 150
        },
        pricing: '₹₹',
        deliveryTime: {
          min: 30,
          max: 45
        },
        deliveryFee: 4000, // ₹40
        minimumOrder: 20000, // ₹200
        isActive: true,
        isApproved: true,
        tags: ['pizza', 'italian', 'cheese', 'fast-food'],
        offers: [{
          title: 'Buy 1 Get 1 Free',
          description: 'Buy any large pizza and get a medium pizza free',
          discountType: 'flat',
          discountValue: 0,
          minimumOrder: 50000, // ₹500
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        }]
      },
      {
        name: 'Burger Hub',
        description: 'Juicy burgers and crispy fries made with premium ingredients',
        cuisine: ['American', 'Fast Food', 'Burger'],
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
        images: [
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
          'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500'
        ],
        address: {
          street: '45 MG Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          landmark: 'Opposite City Mall',
          coordinates: {
            latitude: 19.0760,
            longitude: 72.8777
          }
        },
        contact: {
          phone: '9876543212',
          email: 'contact@burgerhub.com'
        },
        owner: users[2]._id,
        rating: {
          average: 4.2,
          count: 89
        },
        pricing: '₹₹',
        deliveryTime: {
          min: 25,
          max: 35
        },
        deliveryFee: 3500, // ₹35
        minimumOrder: 15000, // ₹150
        isActive: true,
        isApproved: true,
        tags: ['burger', 'american', 'fries', 'fast-food']
      },
      {
        name: 'Spice Garden',
        description: 'Traditional Indian cuisine with authentic spices and flavors',
        cuisine: ['North Indian', 'South Indian'],
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500',
        images: [
          'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500'
        ],
        address: {
          street: '78 Carter Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          landmark: 'Near Bandra Bandstand',
          coordinates: {
            latitude: 19.0544,
            longitude: 72.8181
          }
        },
        contact: {
          phone: '9876543213',
          email: 'contact@spicegarden.com'
        },
        owner: users[1]._id,
        rating: {
          average: 4.7,
          count: 200
        },
        pricing: '₹₹₹',
        deliveryTime: {
          min: 35,
          max: 50
        },
        deliveryFee: 5000, // ₹50
        minimumOrder: 25000, // ₹250
        isActive: true,
        isApproved: true,
        tags: ['indian', 'curry', 'biryani', 'vegetarian']
      }
    ]);

    console.log('🏪 Created sample restaurants');

    // Create sample menu items
    const menuItems = [
      // Pizza Palace Menu
      {
        name: 'Margherita Pizza',
        description: 'Classic pizza with fresh tomatoes, mozzarella cheese, and basil',
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500',
        category: 'Main Course',
        restaurant: restaurants[0]._id,
        price: 35000, // ₹350
        originalPrice: 40000, // ₹400
        isVeg: true,
        spiceLevel: 'mild',
        preparationTime: 20,
        ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella cheese', 'Fresh basil'],
        isAvailable: true,
        isRecommended: true,
        rating: { average: 4.6, count: 45 },
        tags: ['pizza', 'cheese', 'vegetarian', 'italian']
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Delicious pizza topped with spicy pepperoni and cheese',
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500',
        category: 'Main Course',
        restaurant: restaurants[0]._id,
        price: 45000, // ₹450
        isVeg: false,
        spiceLevel: 'medium',
        preparationTime: 22,
        ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella cheese', 'Pepperoni'],
        isAvailable: true,
        isBestseller: true,
        rating: { average: 4.8, count: 67 },
        tags: ['pizza', 'pepperoni', 'non-vegetarian', 'spicy']
      },
      {
        name: 'Garlic Bread',
        description: 'Crispy bread with garlic butter and herbs',
        image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500',
        category: 'Starters',
        restaurant: restaurants[0]._id,
        price: 15000, // ₹150
        isVeg: true,
        spiceLevel: 'mild',
        preparationTime: 10,
        ingredients: ['Bread', 'Garlic', 'Butter', 'Herbs'],
        isAvailable: true,
        rating: { average: 4.3, count: 23 },
        tags: ['bread', 'garlic', 'starter', 'vegetarian']
      },

      // Burger Hub Menu
      {
        name: 'Classic Beef Burger',
        description: 'Juicy beef patty with lettuce, tomato, onion, and special sauce',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
        category: 'Main Course',
        restaurant: restaurants[1]._id,
        price: 32000, // ₹320
        isVeg: false,
        spiceLevel: 'medium',
        preparationTime: 15,
        ingredients: ['Beef patty', 'Burger bun', 'Lettuce', 'Tomato', 'Onion', 'Special sauce'],
        customizations: [{
          name: 'Patty Style',
          options: [
            { name: 'Well Done', price: 0 },
            { name: 'Medium', price: 0 },
            { name: 'Extra Spicy', price: 2000 }
          ],
          isRequired: true,
          allowMultiple: false
        }],
        isAvailable: true,
        isBestseller: true,
        rating: { average: 4.5, count: 78 },
        tags: ['burger', 'beef', 'non-vegetarian', 'american']
      },
      {
        name: 'Veggie Burger',
        description: 'Plant-based patty with fresh vegetables and mayo',
        image: 'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=500',
        category: 'Main Course',
        restaurant: restaurants[1]._id,
        price: 28000, // ₹280
        isVeg: true,
        spiceLevel: 'mild',
        preparationTime: 12,
        ingredients: ['Veggie patty', 'Burger bun', 'Lettuce', 'Tomato', 'Mayo'],
        isAvailable: true,
        isRecommended: true,
        rating: { average: 4.2, count: 34 },
        tags: ['burger', 'vegetarian', 'healthy', 'plant-based']
      },
      {
        name: 'French Fries',
        description: 'Crispy golden fries seasoned with salt',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
        category: 'Snacks',
        restaurant: restaurants[1]._id,
        price: 12000, // ₹120
        isVeg: true,
        spiceLevel: 'mild',
        preparationTime: 8,
        ingredients: ['Potatoes', 'Salt', 'Oil'],
        customizations: [{
          name: 'Size',
          options: [
            { name: 'Regular', price: 0 },
            { name: 'Large', price: 5000 }
          ],
          isRequired: true,
          allowMultiple: false
        }],
        isAvailable: true,
        rating: { average: 4.1, count: 56 },
        tags: ['fries', 'snack', 'vegetarian', 'crispy']
      },

      // Spice Garden Menu
      {
        name: 'Butter Chicken',
        description: 'Creamy tomato-based curry with tender chicken pieces',
        image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500',
        category: 'Main Course',
        restaurant: restaurants[2]._id,
        price: 38000, // ₹380
        isVeg: false,
        spiceLevel: 'medium',
        preparationTime: 25,
        ingredients: ['Chicken', 'Tomato', 'Cream', 'Butter', 'Indian spices'],
        isAvailable: true,
        isBestseller: true,
        rating: { average: 4.9, count: 89 },
        tags: ['chicken', 'curry', 'non-vegetarian', 'creamy', 'indian']
      },
      {
        name: 'Paneer Tikka Masala',
        description: 'Grilled cottage cheese in rich tomato and cream gravy',
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500',
        category: 'Main Course',
        restaurant: restaurants[2]._id,
        price: 32000, // ₹320
        isVeg: true,
        spiceLevel: 'medium',
        preparationTime: 20,
        ingredients: ['Paneer', 'Tomato', 'Cream', 'Onion', 'Indian spices'],
        isAvailable: true,
        isRecommended: true,
        rating: { average: 4.7, count: 67 },
        tags: ['paneer', 'vegetarian', 'curry', 'tikka', 'indian']
      },
      {
        name: 'Chicken Biryani',
        description: 'Fragrant basmati rice cooked with marinated chicken and aromatic spices',
        image: 'https://images.unsplash.com/photo-1563379091339-03246963d29b?w=500',
        category: 'Rice & Biryani',
        restaurant: restaurants[2]._id,
        price: 42000, // ₹420
        isVeg: false,
        spiceLevel: 'spicy',
        preparationTime: 35,
        ingredients: ['Basmati rice', 'Chicken', 'Yogurt', 'Biryani spices', 'Saffron'],
        isAvailable: true,
        isBestseller: true,
        rating: { average: 4.8, count: 112 },
        tags: ['biryani', 'rice', 'chicken', 'non-vegetarian', 'aromatic']
      },
      {
        name: 'Naan',
        description: 'Soft and fluffy Indian bread baked in tandoor',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
        category: 'Breads',
        restaurant: restaurants[2]._id,
        price: 8000, // ₹80
        isVeg: true,
        spiceLevel: 'mild',
        preparationTime: 8,
        ingredients: ['Flour', 'Yogurt', 'Salt', 'Baking powder'],
        customizations: [{
          name: 'Type',
          options: [
            { name: 'Plain', price: 0 },
            { name: 'Butter', price: 2000 },
            { name: 'Garlic', price: 3000 }
          ],
          isRequired: true,
          allowMultiple: false
        }],
        isAvailable: true,
        rating: { average: 4.4, count: 45 },
        tags: ['naan', 'bread', 'vegetarian', 'tandoor', 'indian']
      }
    ];

    await MenuItem.create(menuItems);
    console.log('🍽️ Created sample menu items');

    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Sample Login Credentials:');
    console.log('Customer: john@example.com / Password123');
    console.log('Restaurant Owner 1: owner@pizzapalace.com / Password123');
    console.log('Restaurant Owner 2: owner@burgerhub.com / Password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
