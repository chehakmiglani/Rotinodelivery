import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, calculateItemTotal } from '../lib/utils';
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

const Cart = () => {
  const { items, restaurant, updateQuantity, removeItem, clearCart, getSubtotal, addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const subtotal = getSubtotal();
  const deliveryFee = restaurant?.deliveryFee || 0;
  const taxes = Math.round(subtotal * 0.05); // 5% GST
  const discount = appliedCoupon === 'SAVE10' ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + deliveryFee + taxes - discount;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🛒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link
              to="/restaurants"
              className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Browse Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-24">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Your Cart</h1>
            <p className="text-gray-600">
              {items.length} item{items.length !== 1 ? 's' : ''} from {restaurant?.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Restaurant Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={restaurant?.image || 'https://placehold.co/80x80?text=Food'}
                      alt={restaurant?.name}
                      className="w-14 h-14 rounded-lg object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/80x80?text=Food';
                      }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800">{restaurant?.name}</h3>
                      <p className="text-sm text-gray-600">
                        Delivery in {restaurant?.deliveryTime?.min}-{restaurant?.deliveryTime?.max} mins
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-600 text-sm font-medium"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="p-6">
                <div className="space-y-6">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <img
                        src={item.image || 'https://placehold.co/100x100?text=Food'}
                        alt={item.name}
                        className="w-24 h-24 rounded-lg object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/100x100?text=Food';
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-3 h-3 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span className="text-sm text-gray-600">
                                {item.isVeg ? 'Veg' : 'Non-Veg'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Customizations */}
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="mb-2">
                            {item.customizations.map((customization, customIndex) => (
                              <div key={customIndex} className="text-sm text-gray-600">
                                <span className="font-medium">{customization.name}:</span>{' '}
                                {customization.selectedOptions?.map(option => option.name).join(', ')}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Special Instructions */}
                        {item.specialInstructions && (
                          <div className="mb-2">
                            <span className="text-sm text-gray-600">
                              <span className="font-medium">Note:</span> {item.specialInstructions}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-medium text-gray-800 w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-orange-500 bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-800">
                              {formatPrice(calculateItemTotal(item))}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatPrice(item.price)} each
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery/Restaurant note */}
            <div className="mt-6 bg-white rounded-lg border shadow-sm p-4">
              <label htmlFor="order-note" className="block text-sm font-medium text-gray-700 mb-2">
                Any instructions for the restaurant or delivery partner?
              </label>
              <textarea
                id="order-note"
                className="w-full rounded-md border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                rows={3}
                placeholder="E.g., Less spicy, ring the doorbell, call on arrival, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link
                to={`/restaurant/${restaurant?._id}`}
                className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add more items
              </Link>
            </div>

            {/* Recommended Items */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommended for you</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { id: 's1', name: 'Chow Mein', price: 17900, image: 'https://images.pexels.com/photos/3577564/pexels-photo-3577564.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' },
                  { id: 's2', name: 'Dragon Wok Special Noodles', price: 19900, image: 'https://images.pexels.com/photos/949069/pexels-photo-949069.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' },
                  { id: 's3', name: 'Veg Spring Rolls', price: 9900, image: 'https://images.unsplash.com/photo-1625944526845-9ed7f9d10bfe?w=800&auto=format&fit=crop' },
                  { id: 's4', name: 'Chocolate Cake', price: 12900, image: 'https://images.pexels.com/photos/533325/pexels-photo-533325.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1' }
                ].map((s) => (
                  <div key={s.id} className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <img
                      src={s.image}
                      alt={s.name}
                      className="h-32 w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/300x200?text=Food';
                      }}
                    />
                    <div className="p-3">
                      <div className="text-sm font-medium text-gray-800 line-clamp-2">{s.name}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold">{formatPrice(s.price)}</span>
                        <button
                          onClick={() => addItem({ _id: s.id, name: s.name, price: s.price, image: s.image, quantity: 1, restaurant: restaurant || { _id: 'r_suggest', name: 'Dragon Wok', image: s.image, deliveryFee: 1000, minimumOrder: 19900, deliveryTime: { min: 20, max: 35 } } }, 1)}
                          className="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Charges</span>
                  <span className="font-medium">{formatPrice(taxes)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount (SAVE10)</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-semibold text-gray-800">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Have a coupon?</label>
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g., SAVE10)"
                    className="flex-1 rounded-md border-gray-300 focus:border-orange-500 focus:ring-orange-500 px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(coupon)}
                    className="rounded-md bg-orange-600 px-4 py-2 text-white font-semibold hover:bg-orange-700"
                  >
                    Apply
                  </button>
                </div>
                {appliedCoupon && appliedCoupon !== 'SAVE10' && (
                  <p className="mt-1 text-xs text-red-600">Invalid code. Try SAVE10.</p>
                )}
              </div>

              {/* Minimum Order Check */}
              {restaurant && subtotal < restaurant.minimumOrder && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-700">
                    Add items worth {formatPrice(restaurant.minimumOrder - subtotal)} more to meet the minimum order requirement of {formatPrice(restaurant.minimumOrder)}
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={restaurant && subtotal < restaurant.minimumOrder}
                className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isAuthenticated ? 'Proceed to Checkout' : 'Login to Checkout'}
              </button>

              {!isAuthenticated && (
                <p className="text-sm text-gray-600 text-center mt-3">
                  You'll be redirected to login before checkout
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
