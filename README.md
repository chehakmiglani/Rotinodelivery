# Rotino Delivery

Monorepo containing:
- `backend/` – Express API (orders, payments, restaurants); supports mock auth and mock payments for local testing.
- `frontend/` – React + Vite app.

## Dev notes
- Backend mock auth: set `AUTH_MODE=mock` and `JWT_SECRET=dev_secret`.
- Payments mock: either set `PAYMENTS_MODE=mock` or omit Razorpay keys; the server falls back to mock.
- API base URL: set `VITE_API_URL` in `frontend/.env` to `http://localhost:5000/api`.

## Deploy options

### Option A: Render (recommended free tier)
1) Push this repo to GitHub (already done).
2) On Render, create two services from this repo:
	 - Web Service: rootDir `backend/`
		 - Build: `npm ci`
		 - Start: `node server.js`
		 - Environment:
			 - `PORT=10000`
			 - `AUTH_MODE=mock`
			 - `PAYMENTS_MODE=mock`
			 - `JWT_SECRET` (generate random)
			 - `FRONTEND_URL=https://<your-frontend>.onrender.com` (set after deploying frontend)
			 - Optional `MONGODB_URI` for live DB
	 - Static Site: rootDir `frontend/`
		 - Build: `npm ci && npm run build`
		 - Publish dir: `dist`
		 - Environment:
			 - `VITE_API_URL=https://<your-backend>.onrender.com/api`
3) After both deploy, set `FRONTEND_URL` on backend to the final frontend URL and redeploy backend.

### Option B: Vercel (frontend) + Render/railway (backend)
- Deploy frontend to Vercel with `VITE_API_URL` env pointing at your backend `/api`.
- Deploy backend to Render/railway with the envs above.

### Option C: Docker compose (self-host)
Create a docker-compose with two services (node backend, nginx serving frontend build). Let me know and I’ll add it.
