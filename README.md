# Rotino Delivery

Monorepo containing:
- `backend/` – Express API (orders, payments, restaurants); supports mock auth and mock payments for local testing.
- `frontend/` – React + Vite app.

## Dev notes
- Backend mock auth: set `AUTH_MODE=mock` and `JWT_SECRET=dev_secret`.
- Payments mock: either set `PAYMENTS_MODE=mock` or omit Razorpay keys; the server falls back to mock.
- API base URL: set `VITE_API_URL` in `frontend/.env` to `http://localhost:5000/api`.
