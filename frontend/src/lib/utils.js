export const formatPrice = (priceInPaise) => {
  return `₹${(priceInPaise / 100).toFixed(2)}`;
};

export const parsePrice = (priceString) => {
  const cleanPrice = priceString.replace(/[₹,]/g, '');
  return Math.round(parseFloat(cleanPrice) * 100);
};

export const calculateItemTotal = (item) => {
  let total = item.price * item.quantity;

  if (item.customizations) {
    item.customizations.forEach(customization => {
      customization.selectedOptions?.forEach(option => {
        total += (option.price || 0) * item.quantity;
      });
    });
  }

  return total;
};

export const calculateCartTotal = (cartItems) => {
  return cartItems.reduce((total, item) => total + calculateItemTotal(item), 0);
};
