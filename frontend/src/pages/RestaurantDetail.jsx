import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const mockRestaurant = {
  _id: 'r1',
  name: 'Pizzeria A',
  image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&auto=format&fit=crop',
  deliveryTime: { min: 20, max: 35 },
  deliveryFee: 1000,
  minimumOrder: 19900,
};

const mockMenu = [
  { _id: 'm1', name: 'Margherita Pizza', price: 19900, image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=900&auto=format&fit=crop', isVeg: true },
  { _id: 'm2', name: 'Pepperoni Pizza', price: 24900, image: 'https://images.unsplash.com/photo-1548365328-9f547fb0953c?w=900&auto=format&fit=crop', isVeg: false },
  { _id: 'm3', name: 'Garlic Bread', price: 9900, image: 'https://images.unsplash.com/photo-1546549039-3e5f8f6a9957?w=900&auto=format&fit=crop', isVeg: true },
];

const formatINR = (p) => `₹${Math.round(p / 100)}`;

const RestaurantDetail = () => {
  const { id } = useParams();
  const { addItem } = useCart();

  // In a real app, fetch by id; for demo, use mock and map id into restaurant
  const restaurant = { ...mockRestaurant, _id: id || mockRestaurant._id };

  const handleAdd = (menu) => {
    addItem(
      {
        ...menu,
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          image: restaurant.image,
          deliveryTime: restaurant.deliveryTime,
          deliveryFee: restaurant.deliveryFee,
          minimumOrder: restaurant.minimumOrder,
        },
      },
      1
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="h-56 w-full overflow-hidden">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://placehold.co/1200x400?text=Restaurant';
              }}
            />
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{restaurant.name}</h1>
              <p className="text-gray-600 mt-1">
                Delivery in {restaurant.deliveryTime.min}-{restaurant.deliveryTime.max} mins • {formatINR(restaurant.deliveryFee)} delivery fee
              </p>
              <p className="text-gray-600">Minimum order: {formatINR(restaurant.minimumOrder)}</p>
            </div>
            <Link to="/cart" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">Go to Cart</Link>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockMenu.map((m) => (
              <div key={m._id} className="border rounded-lg overflow-hidden">
                <div className="h-40 w-full overflow-hidden">
                  <img
                    src={m.image}
                    alt={m.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://placehold.co/600x400?text=Dish';
                    }}
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{m.name}</h3>
                    <p className="text-gray-700 mt-1">{formatINR(m.price)}</p>
                  </div>
                  <button
                    onClick={() => handleAdd(m)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;
