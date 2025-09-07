export const formatPrice = (priceInPaise) => {
  return `₹${(priceInPaise / 100).toFixed(2)}`;
};

export const parsePrice = (priceString) => {
  // Convert ₹XX.XX to paise
  const cleanPrice = priceString.replace(/[₹,]/g, '');
  return Math.round(parseFloat(cleanPrice) * 100);
};

export const calculateTax = (subtotal, taxRate = 0.05) => {
  // 5% GST by default
  return Math.round(subtotal * taxRate);
};

export const calculateOrderTotal = (items, deliveryFee, discount = 0) => {
  const subtotal = items.reduce((total, item) => total + item.itemTotal, 0);
  const taxes = calculateTax(subtotal);
  const total = subtotal + deliveryFee + taxes - discount;

  return {
    subtotal,
    deliveryFee,
    taxes,
    discount,
    total
  };
};

export const generateOrderReceipt = (orderId) => {
  return `rotino_order_${orderId}_${Date.now()}`;
};
