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
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
};
