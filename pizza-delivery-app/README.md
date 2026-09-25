# 🍕 Pizza Hub — Full-Stack Pizza Delivery Platform

A production-structured MERN application: user + admin roles, a step-by-step
custom pizza builder, Razorpay payments (test mode), live order-status
tracking, and automated low-stock email alerts.

## Stack

- **Frontend:** React 18 (Vite), React Router, Axios
- **Backend:** Node.js, Express.js, JWT auth
- **Database:** MongoDB (Mongoose)
- **Payments:** Razorpay (test mode)
- **Email:** Nodemailer (SMTP — works great with a free Ethereal test inbox)
- **Scheduled jobs:** node-cron

## What's implemented

**User side**
- Registration with email verification (link expires in 24h)
- JWT login, forgot/reset password (link expires in 1h)
- Dashboard of signature pizzas + a live count of in-stock ingredients
- 4-step custom builder: base → sauce → cheese → vegetables (multi-select)
- Order summary page, then Razorpay checkout (test mode)
- Order tracking that polls every 5s: Order Received → In Kitchen → Sent to
  Delivery → Delivered

**Admin side**
- Separate `/admin/login` — never linked from the user signup/login flow
- Inventory dashboard (stock, price, low-stock threshold, availability — all
  editable inline) grouped by base/sauce/cheese/vegetable
- Stock is decremented automatically & atomically when an order is paid for
- Add new ingredients on the fly
- Hourly cron job (`node-cron`) emails the admin when any item drops below
  its threshold; the alert only fires once per dip (not every hour) until
  restocked
- Order management panel: filter by status, change status per order — the
  user's tracking page picks up the change on its next poll

## Design decisions worth knowing about

- **Pricing is never trusted from the client.** The pizza builder sends only
  ingredient IDs + quantity; the backend recomputes the price from the
  `Inventory` collection both when creating the Razorpay order *and* again
  when verifying payment, so a tampered request can't change what's charged.
- **Stock is checked and decremented server-side, atomically**, only after
  the Razorpay signature is verified — so a race between two people ordering
  the last of an ingredient can't oversell it.
- **Admin accounts are never created through public signup.** They're seeded
  directly into the database (see `npm run seed`) — exactly as the "separate
  admin login, not accessible from the user registration flow" requirement
  describes.

## Getting it running

### 1. Prerequisites
- Node.js 18+
- A MongoDB connection string — the easiest option is a free
  [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster
- A free [Razorpay](https://dashboard.razorpay.com/signup) account (test mode
  keys are generated automatically, no business verification needed for
  testing)
- Optional but recommended for trying email flows immediately: a free
  [Ethereal](https://ethereal.email) inbox (fake SMTP, emails show up in a
  web UI instead of a real inbox — perfect for demos)

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# now edit .env: MONGO_URI, JWT_SECRET, SMTP_*, RAZORPAY_*
npm run seed     # creates the first admin + starter inventory
npm run dev      # starts on http://localhost:5000
```
The admin credentials created by the seed script are whatever you set as
`ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (defaults: `admin@pizzahub.com` /
`Admin@12345` — change these before deploying anywhere real).

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173
```
The Vite dev server proxies `/api/*` to `http://localhost:5000`, so no CORS
setup is needed locally.

### 4. Try it out
- Register a user at `/register`, verify via the emailed link (check your
  Ethereal inbox if using test SMTP), then log in and build a pizza.
- At checkout, Razorpay's test-mode widget opens — use test card
  `4111 1111 1111 1111`, any future expiry date, and any CVV (or click
  "Success" if that's the flow Razorpay shows you) to complete the order
  without a real charge.
- Visit `/admin/login` and sign in with your seeded admin credentials to
  manage inventory and move orders through their statuses — watch the user's
  `/orders/:id` tracking page update automatically within a few seconds.

### 5. Production notes
- Set `NODE_ENV=production`, use a real SMTP provider (SendGrid, SES, etc.)
  and your live/test Razorpay keys as appropriate.
- Put the frontend behind a proper build (`npm run build` in `frontend/`)
  and serve `dist/` from a static host or CDN; point `CLIENT_URL` in the
  backend `.env` at that origin.
- Rotate `JWT_SECRET` to a long random value and never commit `.env`.

## Project structure
```
pizza-delivery-app/
├── backend/
│   ├── config/db.js
│   ├── models/          User, Admin, Order, Inventory
│   ├── middleware/       auth.js (user), adminAuth.js (admin), errorHandler.js
│   ├── controllers/      auth, adminAuth, pizza, inventory, order, payment
│   ├── routes/
│   ├── jobs/stockChecker.js   ← node-cron low-stock email job
│   ├── seed/seedData.js       ← creates first admin + starter inventory
│   └── server.js
└── frontend/
    └── src/
        ├── api/axios.js        ← separate user/admin token handling
        ├── context/AuthContext.jsx
        ├── components/         Navbar, route guards, StepIndicator
        └── pages/
            ├── Register, Login, ForgotPassword, ResetPassword, VerifyEmail
            ├── Dashboard, PizzaBuilder, OrderSummary, Checkout
            ├── MyOrders, OrderTracking
            └── admin/           AdminLogin, AdminDashboard, OrderManagement
```

## What I verified before handing this off
- Every backend file passed `node --check` and was required end-to-end with
  no missing-export or wiring errors.
- `npm install` succeeds cleanly for both backend and frontend.
- `npm run build` (Vite) compiles the entire frontend with zero errors.
- I could **not** run a live MongoDB connection or an actual Razorpay
  payment in this sandbox (no network access to MongoDB's servers or a real
  Razorpay account), so run through the flows above once you've got your own
  Atlas cluster and Razorpay test keys wired in — that's the one thing I
  can't test on your behalf.
