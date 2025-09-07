import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Filter, Star, Clock, MapPin, X } from 'lucide-react';
import PopularGrid from '../components/PopularGrid';

const Restaurants = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Mock data (fallback)
  const defaultRestaurants = [
    {
      _id: '1',
      name: 'Spice Garden',
      cuisine: ['North Indian', 'Biryani'],
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
      rating: { average: 4.5, count: 150 },
      deliveryTime: { min: 25, max: 35 },
      deliveryFee: 0,
      formattedDeliveryFee: 'Free',
      location: 'Sector 1, New Delhi',
      description: 'Authentic North Indian cuisine with traditional flavors'
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
      location: 'Central Market, Delhi',
      description: 'Fresh wood-fired pizzas and Italian delicacies'
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
      location: 'Mall Road, Delhi',
      description: 'Juicy burgers and crispy fries made fresh daily'
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
      location: 'Karol Bagh, Delhi',
      description: 'Authentic Asian noodles and stir-fry dishes'
    },
    {
      _id: '5',
      name: 'Cafe Delight',
      cuisine: ['Continental', 'Desserts'],
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      rating: { average: 4.2, count: 95 },
      deliveryTime: { min: 20, max: 30 },
      deliveryFee: 0,
      formattedDeliveryFee: 'Free',
      location: 'Connaught Place, Delhi',
      description: 'Cozy cafe with great coffee and desserts'
    },
    {
      _id: '6',
      name: 'Masala Kitchen',
      cuisine: ['South Indian', 'Biryani'],
      image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400',
      rating: { average: 4.6, count: 220 },
      deliveryTime: { min: 25, max: 35 },
      deliveryFee: 1000,
      formattedDeliveryFee: '₹10',
      location: 'Lajpat Nagar, Delhi',
      description: 'Traditional South Indian flavors and aromatic biryanis'
    }
  ];

  const defaultCuisines = [
    'North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican', 'Thai',
    'Continental', 'Fast Food', 'Desserts', 'Beverages', 'Biryani', 'Pizza'
  ];

  // URL filter state
  const currentFilters = {
    search: searchParams.get('search') || '',
    cuisine: searchParams.get('cuisine') || '',
    rating: searchParams.get('rating') || '',
    pricing: searchParams.get('pricing') || '',
    sortBy: searchParams.get('sortBy') || 'rating',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  };
  // Navbar handles pushing ?search=...; page reads from URL only

  // Restaurants (with fallback)
  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurants', currentFilters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        Object.entries(currentFilters).forEach(([k, v]) => v && params.append(k, v));
        const res = await api.get(`/restaurants?${params.toString()}`);
        if (res.data?.restaurants?.length) return res.data;
      } catch { }
      return {
        restaurants: defaultRestaurants.map(r => ({
          ...r,
          formattedMinimumOrder: r.minimumOrder ? `₹${Math.round(r.minimumOrder / 100)}` : '₹199'
        })),
        pagination: { totalRestaurants: defaultRestaurants.length }
      };
    },
    staleTime: 2 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false
  });

  // Cuisines (with fallback)
  const { data: cuisines = defaultCuisines } = useQuery({
    queryKey: ['cuisines'],
    queryFn: async () => {
      const res = await api.get('/restaurants/meta/cuisines');
      return res.data.cuisines;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  // Search box removed here to avoid duplicate floating input overlay.

  // Count only real filters (exclude search/sort keys)
  const activeFiltersCount = useMemo(() => {
    const { search, sortBy, sortOrder, ...rest } = currentFilters;
    return Object.values(rest).filter(Boolean).length;
  }, [currentFilters]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600">Failed to load restaurants. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header: Filters button and active filters (search is in navbar) */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Active filters:</span>
              {Object.entries(currentFilters).map(([key, value]) => {
                if (!value || ['sortBy', 'sortOrder', 'search'].includes(key)) return null;
                return (
                  <span key={key} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                    {value}
                    <button onClick={() => updateFilter(key, '')} className="hover:bg-orange-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 underline">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Popular Cuisines */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Popular Cuisines</h2>
          <PopularGrid />
        </div>

        <div className="flex gap-6">
          {/* Sidebar: hide on <lg to avoid squeezing grid */}
          {showFilters && (
            <div className="hidden lg:block w-64 bg-white rounded-lg shadow-sm border p-6 h-fit sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={currentFilters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="rating">Rating</option>
                  <option value="deliveryTime">Delivery Time</option>
                  <option value="deliveryFee">Delivery Fee</option>
                  <option value="name">Name</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine</label>
                <select
                  value={currentFilters.cuisine}
                  onChange={(e) => updateFilter('cuisine', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="">All Cuisines</option>
                  {cuisines?.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <select
                  value={currentFilters.rating}
                  onChange={(e) => updateFilter('rating', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <select
                  value={currentFilters.pricing}
                  onChange={(e) => updateFilter('pricing', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="">Any Price</option>
                  <option value="₹">₹ - Budget</option>
                  <option value="₹₹">₹₹ - Mid-range</option>
                  <option value="₹₹₹">₹₹₹ - Premium</option>
                </select>
              </div>

              <button onClick={clearFilters} className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                Clear All Filters
              </button>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {currentFilters.search ? `Search results for "${currentFilters.search}"` : 'All Restaurants'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {(data?.pagination?.totalRestaurants) ?? defaultRestaurants.length} restaurants found
                </p>
              </div>
            </div>

            {/* Loading skeleton */}
            {isLoading && (
              <div className="mx-auto max-w-7xl grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-300 rounded-lg aspect-[4/3] mb-4"></div>
                    <div className="bg-gray-300 rounded h-6 mb-2"></div>
                    <div className="bg-gray-300 rounded h-4 mb-2"></div>
                    <div className="bg-gray-300 rounded h-4 w-2/3"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Cards */}
            {data && data.restaurants.length > 0 && (
              <div className="mx-auto max-w-7xl grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {data.restaurants.map((restaurant) => (
                  <Link
                    key={restaurant._id}
                    to={`/restaurant/${restaurant._id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group"
                  >
                    <div className="relative">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://placehold.co/600x400?text=Restaurant';
                          }}
                        />
                      </div>

                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          {restaurant.rating.average}
                        </span>
                        {restaurant.pricing && (
                          <span className="bg-white text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">
                            {restaurant.pricing}
                          </span>
                        )}
                      </div>

                      {restaurant.offers?.length > 0 && (
                        <div className="absolute bottom-4 left-4">
                          <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            {restaurant.offers[0].title}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">{restaurant.name}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{restaurant.description}</p>
                      <p className="text-orange-500 text-sm mb-3 font-medium">{restaurant.cuisine.join(', ')}</p>

                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {restaurant.deliveryTime.min}-{restaurant.deliveryTime.max} mins
                        </span>
                        <span>{restaurant.formattedDeliveryFee} delivery</span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>Min order: {restaurant.formattedMinimumOrder || '₹199'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty state */}
            {data && data.restaurants.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">😔</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No restaurants found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filters to find more restaurants.</p>
                <button
                  onClick={clearFilters}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restaurants;
