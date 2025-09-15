import jwt from 'jsonwebtoken';

export const generateToken = (userId, extra = {}) => {
  const { name, email, role } = extra;
  const payload = { userId };
  if (name) payload.name = name;
  if (email) payload.email = email;
  if (role) payload.role = role;
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const setTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd, // Render sets NODE_ENV=production
    sameSite: isProd ? 'None' : 'Lax', // Allow cross-site cookie in production
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearTokenCookie = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    path: '/',
    expires: new Date(0),
  });
};
