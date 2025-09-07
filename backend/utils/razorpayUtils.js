import crypto from 'crypto';

const isMock = process.env.PAYMENTS_MODE === 'mock' || process.env.RAZORPAY_MOCK === 'true';
const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';

export const validateRazorpaySignature = (orderId, paymentId, signature) => {
  try {
    if (isMock) return true; // Always accept in mock mode
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
};

export const generateSignature = (orderId, paymentId) => {
  const body = orderId + '|' + paymentId;
  return crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');
};
