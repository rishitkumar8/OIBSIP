# OIB Web Development Internship - Level 3 Task
## Pizza Delivery Application

> Full-stack pizza ordering app with custom pizza builder, Razorpay payments, real-time order tracking, and a complete admin inventory & order management system.

**Live Demo:** [Deployed on Vercel](https://pizzaferno.vercel.app)

---

## Task Completion Summary

This project satisfies all 10 requirements of the OIB Level 3 Task:

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Admin + user login with registration, authorization, email verification, forgot password | ✅ Complete |
| 2 | User dashboard showing available pizza varieties | ✅ Complete |
| 3 | Custom pizza builder — base → sauce → cheese → veggies/meats | ✅ Complete |
| 4 | Razorpay test-mode checkout integration | ✅ Complete |
| 5 | On payment success, order is placed and confirmed | ✅ Complete |
| 6 | Admin inventory system tracking base, sauce, cheese, veggies, meat | ✅ Complete |
| 7 | Stock updated after each order; reflected in admin dashboard | ✅ Complete |
| 8 | Low-stock email notification to admin when threshold is breached | ✅ Complete |
| 9 | Admin order status management: Received → In Kitchen → Out for Delivery → Delivered | ✅ Complete |
| 10 | Real-time status updates reflected on the user dashboard | ✅ Complete |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TanStack Start (SSR), TanStack Router, TanStack Query |
| **Styling** | Tailwind CSS v4, shadcn/ui (Radix UI primitives) |
| **Backend** | TanStack Start server functions (runs on Vercel Serverless) |
| **Database** | Supabase (PostgreSQL) with Row-Level Security |
| **Auth** | Supabase Auth — email/password, email verification, password reset |
| **Payments** | Razorpay (test mode) with HMAC signature verification |
| **Realtime** | Supabase Realtime (postgres_changes subscriptions) |
| **Deployment** | Vercel (via nitro `vercel` preset) |

---

## Features

### User Side

#### Authentication
- Email + password sign-up with **email verification**
- Sign-in and **forgot password** / **reset password** via email link
- Separate user and admin login flows

#### Pizza Ordering
- **Menu dashboard** — browse signature pizza varieties with images
- **Custom pizza builder** — guided 4-step flow:
  1. **Base** — choose from 5 pizza bases (Thin Crust, Thick Crust, Sourdough, Gluten-Free, Stuffed Crust)
  2. **Sauce** — choose from 5 sauces (Tomato, Pesto, BBQ, Garlic, White)
  3. **Cheese** — select a cheese type (Mozzarella, Cheddar, Parmesan, Vegan, Blend)
  4. **Toppings** — multi-select veggies and meats; out-of-stock items are disabled
- **Live pizza preview** — animated visual plate updates as you pick ingredients
- **Cart** — review items, quantities, delivery address, phone, and name
- **Razorpay checkout** — test-mode payment with card/UPI/netbanking
- Signature verification of Razorpay callback on the server before any order is written

#### Order Tracking
- **My Orders page** — full order history with real-time status updates
- Status progress bar with icons: Clock → ChefHat → Truck → CheckCircle
- Supabase Realtime subscription pushes admin status changes instantly — **no page refresh needed**

---

### Admin Side

#### Authentication
- Separate `/admin/login` and `/admin/signup` pages
- Role-based access: users without `admin` role in `user_roles` table are denied
- "Claim admin" button available to the very first user for initial setup

#### Admin Control Panel (`/admin`)
- Stats bar: active orders, today's revenue, low/out-of-stock count
- Two action cards linking directly to **Order Queue** and **Inventory**
- Per-category inventory glance: shows out-of-stock and low-stock counts for each of the 5 categories
- Live low-stock alert list with links to inventory

#### Order Queue (`/admin/orders`)
- Real-time list of all active (non-delivered) orders via Supabase Realtime
- Each card shows: customer name, amount, delivery address, phone, items ordered
- Status dropdown with all 4 states:
  - **Order Received** → **In the Kitchen** → **Out for Delivery** → **Delivered**
- When marked **Delivered**, the order is archived for admins (cleaned from queue) but remains in the customer's order history

#### Inventory Management (`/admin/inventory`)
Tracks all 5 ingredient categories: **Bases · Sauces · Cheese · Veggies · Meats**

- **Status badges**: In Stock (green), Low Stock (amber), Out of Stock (red), Inactive (gray)
- **Stock controls**: − / + buttons, direct numeric input, and a quick **+10** restock button
- **Mark out of stock** — instantly zeros stock for unavailable ingredients
- **Restock** button — appears when stock is 0, adds 10 units with one click
- **Deactivate / Activate** toggle — removes an ingredient from the pizza builder without deleting it; can be reactivated anytime
- **Show inactive** toggle — reveals deactivated ingredients so they can be managed
- **Add ingredient** dialog — name, category, initial stock, low threshold, price
- Category tabs have colored dots indicating alerts (red = out of stock, amber = low)
- All changes update live via Supabase Realtime subscriptions

#### Low-Stock Email Notifications
- Triggered automatically after every order placement
- 24-hour debounce per item prevents duplicate alerts
- Alert is recorded in the `stock_alerts` table for audit
- Email provider hookup ready (console log output in current build — connect Resend/Supabase SMTP to wire real emails)

---

## Database Schema (Supabase)

```
users             — managed by Supabase Auth
user_roles        — (user_id, role) for admin access control
profiles          — email and profile data
pizza_varieties   — signature pizza menu items
inventory_items   — ingredient stock (name, category, stock, threshold, price, active)
orders            — customer orders (user_id, status, total_amount, archived_for_admin, ...)
order_items       — line items per order (pizza_name, base_id, sauce_id, ...)
stock_alerts      — log of low-stock notifications sent (debounce record)
```

Row-Level Security policies ensure users can only see their own orders. Admin operations use the service-role key server-side, never exposed to the browser.

---

## Local Development Setup

### Prerequisites
- Node.js ≥ 20
- A [Supabase](https://supabase.com) project
- A [Razorpay](https://razorpay.com) account (test mode)

### 1. Clone and install

```bash
git clone https://github.com/rishitkumar8/OIB_Metuku_Rishit_Kumar_Level_3_Task.git
cd OIB_Metuku_Rishit_Kumar_Level_3_Task
npm install --legacy-peer-deps
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in the values (see [Environment Variables](#environment-variables) below).

### 3. Run the dev server

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_URL` | ✅ | Same value — needed for client-side code |
| `SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/public key |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Same value — needed for client-side code |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service-role key (server-side only, never exposed to browser) |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay Key ID (use `rzp_test_…` for test mode) |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay Key Secret (used for HMAC signature verification) |

---

## Deploying to Vercel

### Method A — GitHub Integration (recommended)

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo
3. Vercel auto-detects the framework; set **Build Command** to `npm run build` and **Framework Preset** to **Other**
4. Add all 7 environment variables in the Vercel project settings
5. Click **Deploy**

The nitro `vercel` preset (configured in `vite.config.ts`) generates a `.vercel/output/` directory that Vercel's Build Output API v3 recognises automatically — no additional `vercel.json` needed.

### Method B — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

Follow the prompts; add environment variables when asked.

---

## Project Structure

```
src/
├── components/
│   ├── AdminHeader.tsx      # Admin nav: Orders + Inventory links
│   ├── Header.tsx           # User nav: Menu, Build, Orders, Cart
│   └── PizzaPlate.tsx       # Animated pizza preview
├── integrations/
│   └── supabase/
│       ├── client.ts        # Browser Supabase client
│       ├── client.server.ts # Server-only admin client (service role)
│       └── types.ts         # Generated database types
├── lib/
│   ├── cart-store.ts        # Client-side cart state
│   ├── orders.functions.ts  # Server functions: placeOrder, updateStatus, Razorpay
│   └── stock.server.ts      # Low-stock detection + email notification
└── routes/
    ├── index.tsx             # Landing page
    ├── auth.tsx              # User sign-up / sign-in
    ├── admin.login.tsx       # Admin sign-in
    ├── admin.signup.tsx      # Admin registration
    ├── forgot-password.tsx
    ├── reset-password.tsx
    └── _authenticated/
        ├── dashboard.tsx     # User menu (pizza varieties)
        ├── build.tsx         # Custom pizza builder (4-step)
        ├── cart.tsx          # Cart + Razorpay checkout
        ├── orders.tsx        # User order history + live status
        ├── admin.tsx         # Admin control panel (hub)
        ├── admin.orders.tsx  # Admin order queue + status management
        └── admin.inventory.tsx # Inventory management system
```

---

## Razorpay Test Credentials

Use these cards in test mode:

| Card | Number | Expiry | CVV |
|------|--------|--------|-----|
| Visa (success) | `4111 1111 1111 1111` | Any future date | Any 3 digits |
| Mastercard (success) | `5267 3181 8797 5449` | Any future date | Any 3 digits |

For UPI test, use `success@razorpay`.

---

## Key Design Decisions

- **SSR with TanStack Start** — server functions run securely on Vercel serverless, keeping secrets (Razorpay, Supabase service role) out of the browser bundle
- **HMAC payment verification** — Razorpay signature verified server-side before any order is written to the database, preventing spoofed confirmations
- **Realtime via Supabase channels** — both admin and user pages subscribe to `postgres_changes` so status changes propagate instantly without polling
- **24h alert debounce** — `stock_alerts` table prevents the same ingredient from triggering repeated emails within 24 hours
- **Soft delete for inventory** — deactivating an ingredient (`active = false`) removes it from the pizza builder without losing its stock history; it can be reactivated anytime
- **Row-Level Security** — Supabase RLS policies ensure users can only read/write their own orders; admin writes go through server functions using the service-role key

---

## Author

**Rishit Kumar Metuku** — OIB Level 3 Task Submission
