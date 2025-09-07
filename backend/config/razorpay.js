import Razorpay from 'razorpay';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

let isMock = process.env.PAYMENTS_MODE === 'mock' || process.env.RAZORPAY_MOCK === 'true';

let instance;

const createMockInstance = () => ({
  orders: {
    async create({ amount, currency = 'INR', receipt, notes }) {
      const now = Date.now();
      return {
        id: `order_mock_${now}`,
        amount,
        currency,
        receipt: receipt || `mock_receipt_${now}`,
        notes: notes || {},
        status: 'created',
        created_at: Math.floor(now / 1000),
      };
    },
  },
});

if (isMock) {
  // Lightweight mock for Razorpay API shape we use
  instance = createMockInstance();
} else {
  // Validate required environment variables
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('⚠️ Razorpay keys missing. Falling back to mock mode.');
    isMock = true;
    instance = createMockInstance();
  } else {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
}

export const razorpayInstance = instance;

export const razorpayConfig = {
  currency: 'INR',
  receipt_prefix: 'rotino_order_',
  isMock,
};
