import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateItemTotal, calculateCartTotal } from '../lib/utils';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('rotino-cart');
    const savedRestaurant = localStorage.getItem('rotino-cart-restaurant');

    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }

    if (savedRestaurant) {
      try {
        setRestaurant(JSON.parse(savedRestaurant));
      } catch (error) {
        console.error('Error loading restaurant:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('rotino-cart', JSON.stringify(items));
  }, [items]);

  // Save restaurant to localStorage whenever it changes
  useEffect(() => {
    if (restaurant) {
      localStorage.setItem('rotino-cart-restaurant', JSON.stringify(restaurant));
    } else {
      localStorage.removeItem('rotino-cart-restaurant');
    }
  }, [restaurant]);

  const addItem = (menuItem, quantity = 1, customizations = [], specialInstructions = '') => {
    // Check if this is from a different restaurant
    if (restaurant && restaurant._id !== menuItem.restaurant._id) {
      const proceed = window.confirm(
        `Your cart contains items from ${restaurant.name}. Adding items from ${menuItem.restaurant.name} will clear your current cart. Continue?`
      );

      if (!proceed) return false;

      // Clear cart and change restaurant
      setItems([]);
      setRestaurant(menuItem.restaurant);
    } else if (!restaurant) {
      setRestaurant(menuItem.restaurant);
    }

    const cartItem = {
      _id: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      image: menuItem.image,
      restaurant: menuItem.restaurant,
      quantity,
      customizations,
      specialInstructions,
      isVeg: menuItem.isVeg
    };

    // Check if item with same customizations already exists
    const existingItemIndex = items.findIndex(item =>
      item._id === menuItem._id &&
      JSON.stringify(item.customizations) === JSON.stringify(customizations)
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      setItems(updatedItems);
    } else {
      // Add new item
      setItems(prev => [...prev, cartItem]);
    }

    toast.success(`${menuItem.name} added to cart!`);
    return true;
  };

  const updateQuantity = (itemIndex, quantity) => {
    if (quantity <= 0) {
      removeItem(itemIndex);
      return;
    }

    const updatedItems = [...items];
    updatedItems[itemIndex].quantity = quantity;
    setItems(updatedItems);
  };

  const removeItem = (itemIndex) => {
    const updatedItems = items.filter((_, index) => index !== itemIndex);
    setItems(updatedItems);

    // If cart is empty, clear restaurant
    if (updatedItems.length === 0) {
      setRestaurant(null);
    }

    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    setItems([]);
    setRestaurant(null);
    localStorage.removeItem('rotino-cart');
    localStorage.removeItem('rotino-cart-restaurant');
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return calculateCartTotal(items);
  };

  const value = {
    items,
    restaurant,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getItemCount,
    getSubtotal,
    isEmpty: items.length === 0
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
