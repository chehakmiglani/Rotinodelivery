import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, getSubtotal, clearCart } = useCart();
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState('');

  const total = useMemo(() => getSubtotal(), [items]);

  const handlePayNow = async () => {
    try {
      setPaying(true);
      setMessage('Creating payment order...');

      // Create order in mock mode (backend returns mock Razorpay order)
      const createRes = await api.post('/payments/create-order', {
        orderId: `mock_${Date.now()}`,
        amount: total,
      });

      if (!createRes.data?.success) throw new Error('Failed to create order');

      setMessage('Verifying payment...');
      // Immediately verify (mock mode will accept)
      await api.post('/payments/verify-payment', {
        orderId: createRes.data.order._id,
        razorpay_order_id: createRes.data.razorpayOrder.id,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature'
      });

      setMessage('Payment successful! Redirecting to orders...');
      clearCart();
      setTimeout(() => navigate('/orders'), 800);
    } catch (err) {
      setMessage(err?.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Checkout</h1>
          <p className="text-gray-600 mb-6">Complete your order using our secure payment.</p>

          <div className="border rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total payable</span>
              <span className="text-xl font-semibold">₹{(total / 100).toFixed(2)}</span>
            </div>
          </div>

          <button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            onClick={handlePayNow}
            disabled={paying || !isAuthenticated}
          >
            {paying ? 'Processing...' : (isAuthenticated ? 'Pay Now' : 'Login to Pay')}
          </button>

          {message && (
            <div className="mt-4 text-sm text-gray-700">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
