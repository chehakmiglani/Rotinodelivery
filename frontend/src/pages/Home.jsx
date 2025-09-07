import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ArrowRight, Star, Clock, Truck, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import PopularGrid from '../components/PopularGrid';

const Home = () => {
  const { addItem } = useCart();
  // Mock data as fallback
  const defaultCuisines = [
    'North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican', 'Thai',
    'Continental', 'Fast Food', 'Desserts', 'Beverages', 'Biryani', 'Pizza'
  ];

  const defaultRestaurants = [
    {
      _id: '1',
      name: 'Spice Garden',
      cuisine: ['North Indian', 'Biryani'],
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300',
      rating: { average: 4.5, count: 150 },
      deliveryTime: { min: 25, max: 35 },
      deliveryFee: 0,
      formattedDeliveryFee: 'Free'
    },
    {
      _id: '2',
      name: 'Pizza Corner',
      cuisine: ['Italian', 'Pizza'],
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300',
      rating: { average: 4.3, count: 200 },
      deliveryTime: { min: 20, max: 30 },
      deliveryFee: 2000,
      formattedDeliveryFee: '₹20'
    },
    {
      _id: '3',
      name: 'Burger Palace',
      cuisine: ['Fast Food', 'Burger'],
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300',
      rating: { average: 4.1, count: 120 },
      deliveryTime: { min: 15, max: 25 },
      deliveryFee: 1500,
      formattedDeliveryFee: '₹15'
    },
    {
      _id: '4',
      name: 'Noodle House',
      cuisine: ['Chinese', 'Thai'],
      image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300',
      rating: { average: 4.4, count: 180 },
      deliveryTime: { min: 30, max: 40 },
      deliveryFee: 2500,
      formattedDeliveryFee: '₹25'
    }
  ];

  // Fetch featured restaurants with fallback
  const { data: featuredRestaurants = defaultRestaurants, isLoading: loadingRestaurants } = useQuery({
    queryKey: ['featured-restaurants'],
    queryFn: async () => {
      const response = await api.get('/restaurants/featured/list');
      return response.data.restaurants;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch cuisines with fallback
  const { data: cuisines = defaultCuisines, isLoading: loadingCuisines } = useQuery({
    queryKey: ['cuisines'],
    queryFn: async () => {
      const response = await api.get('/restaurants/meta/cuisines');
      return response.data.cuisines;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const features = [
    {
      icon: <Truck className="w-8 h-8 text-orange-500" />,
      title: "Fast Delivery",
      description: "Get your favorite food delivered in 30 minutes or less"
    },
    {
      icon: <Shield className="w-8 h-8 text-orange-500" />,
      title: "Safe & Secure",
      description: "Your payments and personal data are always protected"
    },
    {
      icon: <Star className="w-8 h-8 text-orange-500" />,
      title: "Quality Food",
      description: "Only the best restaurants and highest quality ingredients"
    },
    {
      icon: <Clock className="w-8 h-8 text-orange-500" />,
      title: "24/7 Support",
      description: "Customer support available round the clock for you"
    }
  ];

  const navigate = useNavigate();
  const searchRef = useRef(null);

  return (
    <div className="min-h-screen">
      {/* Hero Section (template style) */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', height: 260 }}>
          {[ // soft blurred food stripes background
            'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&auto=format&fit=crop',
            // fixed last image (was broken)
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop'
          ].map((src, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img
                src={src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6) blur(0px)' }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://placehold.co/800x600?text=Food';
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-center" style={{ color: '#fff' }}>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Craving? Search. Savor.</h1>
            <div className="bg-white rounded-full shadow-md flex items-center" style={{ padding: '0.5rem 0.75rem', width: 560, maxWidth: '90vw', margin: '0 auto' }}>
              <input
                type="text"
                ref={searchRef}
                placeholder="Search for restaurants or dishes"
                className="w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = e.currentTarget.value.trim();
                    navigate(q ? `/restaurants?search=${encodeURIComponent(q)}` : '/restaurants');
                  }
                }}
                style={{ border: 'none', outline: 'none', padding: '0.5rem 0.75rem' }}
              />
              <button
                onClick={() => {
                  const q = (searchRef.current?.value || '').trim();
                  navigate(q ? `/restaurants?search=${encodeURIComponent(q)}` : '/restaurants');
                }}
                className="text-gray-800"
                style={{ padding: '0 0.75rem' }}
                aria-label="Search"
              >
                🔍
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose Rotino?
            </h2>
            <p className="text-lg text-gray-600">
              We make food delivery simple, fast, and delicious
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-text">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Removed extra Popular Cuisines row to avoid duplication */}

      {/* Popular items (cards with Add to Cart) */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <PopularGrid />
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Featured Restaurants</h2>
              <p className="text-lg text-gray-600">Handpicked restaurants just for you</p>
            </div>
            <Link to="/restaurants" className="text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingRestaurants ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-300 rounded-lg h-48 mb-4"></div>
                  <div className="bg-gray-300 rounded h-6 mb-2"></div>
                  <div className="bg-gray-300 rounded h-4 mb-2"></div>
                  <div className="bg-gray-300 rounded h-4 w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRestaurants?.map((restaurant) => (
                <Link
                  key={restaurant._id}
                  to={`/restaurant/${restaurant._id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
                >
                  <div className="relative">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/600x400?text=Food';
                      }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {restaurant.rating.average} ★
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-800 mb-1">{restaurant.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{restaurant.cuisine.join(', ')}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {restaurant.deliveryTime.min}-{restaurant.deliveryTime.max} mins
                      </span>
                      <span>{restaurant.formattedDeliveryFee} delivery</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - light theme for visibility */}
      <section className="py-16 bg-white text-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Order?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers and experience the best food delivery service
          </p>
          {/* Start Ordering link removed as per request */}
        </div>
      </section>
    </div>
  );
};

// Helper function to get cuisine emoji
const getCuisineEmoji = (cuisine) => {
  const emojiMap = {
    'North Indian': '🍛',
    'South Indian': '🥘',
    'Chinese': '🥢',
    'Italian': '🍝',
    'Mexican': '🌮',
    'Thai': '🍜',
    'Continental': '🍽️',
    'Fast Food': '🍔',
    'Desserts': '🍰',
    'Beverages': '🥤',
    'Biryani': '🍚',
    'Pizza': '🍕',
    'Burger': '🍔',
    'Sandwich': '🥪',
    'Healthy': '🥗',
    'Vegan': '🌱'
  };
  return emojiMap[cuisine] || '🍴';
};

export default Home;

