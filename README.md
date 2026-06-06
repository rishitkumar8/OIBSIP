<div align="center">

# OIB - Web Development Internship - Level 3 Task
  
# 🍕 Pizza Delivering Aplication

### *A full-stack, production-ready pizza ordering web application built for the OIB Web Development Internship — Level 3 Task*

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20App-red?style=for-the-badge)](https://pizzaferno.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/rishitkumar8/OIB_Metuku_Rishit_Kumar_Level_3_Task)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-072654?style=flat-square&logo=razorpay&logoColor=white)

</div>

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Task Completion Checklist](#-task-completion-checklist)
3. [Live Demo & Test Credentials](#-live-demo--test-credentials)
4. [Key Features](#-key-features)
5. [Tech Stack](#-tech-stack)
6. [Application Architecture](#-application-architecture)
7. [Database Schema](#-database-schema)
8. [Project Structure](#-project-structure)
9. [Security Design](#-security-design)
10. [Local Development Setup](#-local-development-setup)
11. [Environment Variables](#-environment-variables)
12. [Deploying to Vercel](#-deploying-to-vercel)
13. [How Real-Time Updates Work](#-how-real-time-updates-work)
14. [Author](#-author)

---

## 🌟 Project Overview

**Forno** is a modern, full-stack pizza ordering web application built from scratch as part of the OIB Web Development Internship Level 3 Task. The app covers the complete lifecycle of a pizza business — from customer browsing to payment, all the way to kitchen management and delivery tracking.

The name *Forno* comes from the Italian word for "oven" — a fitting name for a premium pizza experience.

### What makes this project stand out?

- **Real payments** — Razorpay test-mode integration with server-side HMAC signature verification (the industry-standard security practice)
- **True real-time** — when the admin updates an order status, the customer's screen updates *instantly* without any refresh, powered by Supabase Realtime
- **Complete admin system** — a full inventory management system tracking 5 ingredient categories, not just a simple list
- **Production-grade architecture** — server-side functions, row-level security, JWT auth, and secrets kept safely away from the browser
- **Deployed and live** on Vercel, accessible by anyone with the link

---

## ✅ Task Completion Checklist

> Every single requirement from the OIB Level 3 Task description has been implemented and is live.

| # | Requirement | Implementation | Status |
|---|-------------|----------------|--------|
| **1** | Admin and user **login + registration**, email verification, forgot password | Supabase Auth — email/password signup, email verification link, password reset via email, separate admin and user flows | ✅ **Done** |
| **2** | **User dashboard** showing available pizza varieties | `/dashboard` — grid of all active pizza varieties with images, names, descriptions, and prices | ✅ **Done** |
| **3** | **Custom pizza builder** — choose base, sauce, cheese, veggies, meats | 4-step guided builder at `/build` with live pizza plate preview; out-of-stock items are automatically disabled | ✅ **Done** |
| **4** | **Razorpay test-mode** checkout integration | Full Razorpay SDK flow — order created on server, modal opened on client, signature verified server-side before saving | ✅ **Done** |
| **5** | Order is **placed and confirmed** after successful payment | Order + items written to Supabase only after HMAC verification passes; user redirected to order tracking | ✅ **Done** |
| **6** | **Admin inventory system** tracking base, sauce, cheese, veggies, meat | `/admin/inventory` — full CRUD with stock controls, status badges, add/deactivate/restock per ingredient across all 5 categories | ✅ **Done** |
| **7** | **Stock updated** after each order; reflected in admin dashboard | Stock deduction on order placement; admin dashboard refreshes live via Supabase Realtime | ✅ **Done** |
| **8** | **Low-stock email notification** to admin when threshold is crossed | `checkLowStockAndNotify()` fires after every order; 24-hour debounce per item via `stock_alerts` table; email provider hookup ready | ✅ **Done** |
| **9** | Admin **order status management**: Received → In Kitchen → Out for Delivery → Delivered | `/admin/orders` — status dropdown on each order card; delivered orders archive from queue automatically | ✅ **Done** |
| **10** | Status changes **reflected in real-time** on user dashboard | Supabase `postgres_changes` subscription on `/orders` — customer's screen updates the moment admin changes status | ✅ **Done** |

---

## 🚀 Live Demo & Test Credentials

### 🌐 Live Application
**URL:** [https://pizzaferno.vercel.app](https://pizzaferno.vercel.app)

---

### 👤 User Test Account
You can sign up with any email, or use these pre-created accounts:

| Field | Value |
|-------|-------|
| Email | `testuser@forno.com` |
| Password | `testuser123` |

---

### 🛡️ Admin Access
1. Go to [https://pizzaferno.vercel.app/admin/login](https://pizzaferno.vercel.app/admin/login)
2. Sign up with any email at `/admin/signup`
3. On the admin dashboard, click **"Claim admin (first user only)"** to grant yourself admin access

---

### 💳 Razorpay Test Payment Details

When you reach the checkout, use these test credentials — **do not use real card numbers**:

| Payment Method | Details |
|----------------|---------|
| **Card Number** | `4111 1111 1111 1111` |
| **Expiry Date** | Any future date (e.g. `12/28`) |
| **CVV** | Any 3 digits (e.g. `123`) |
| **OTP / 2FA** | `1234` |
| **UPI ID** | `success@razorpay` |

> These are official Razorpay test credentials. No real money is charged.

---

## ✨ Key Features

### For Customers (User Side)

#### 🔐 Authentication
- **Sign up** with email and password — a verification email is sent automatically
- **Log in** securely — JWT tokens managed by Supabase Auth
- **Forgot password** — sends a reset link to your email; click it to set a new password
- Sessions persist across page refreshes; secure logout clears all tokens

#### 🍕 Browsing the Menu
- A beautiful grid of all available signature pizzas with photos
- Each card shows the pizza name, description, and price
- One-click **Add to Cart** from the menu
- Sold-out items (from inventory) are automatically hidden

#### 🛠️ Custom Pizza Builder
A fun, interactive 4-step wizard where you build your perfect pizza:

| Step | What you choose |
|------|-----------------|
| 1 | **Base** — Thin Crust, Thick Crust, Sourdough, Gluten-Free, Stuffed Crust |
| 2 | **Sauce** — Tomato, Pesto, BBQ, Garlic, White Cream |
| 3 | **Cheese** — Mozzarella, Cheddar, Parmesan, Vegan, Four Cheese Blend |
| 4 | **Toppings** — any combination of veggies and meats |

- Live animated **pizza plate preview** updates in real time as you select ingredients
- Ingredients that are **out of stock** are greyed out and cannot be selected
- Price calculated dynamically as you add toppings

#### 🛒 Cart & Checkout
- Review all items with quantities and prices in ₹
- Enter delivery address, name, and phone number
- Real-time **step indicator** shows exactly where you are in the payment process
- If payment fails, a clear error message tells you exactly what went wrong (not a generic "error" message)

#### 📦 Order Tracking
- **My Orders** page shows complete order history
- Beautiful progress bar with icons showing the current stage:
  - 🕐 **Order Received** → 👨‍🍳 **In the Kitchen** → 🚚 **Out for Delivery** → ✅ **Delivered**
- Status updates the moment the admin changes it — **zero page refresh needed**

---

### For Admins (Admin Side)

#### 🎛️ Admin Control Panel (`/admin`)
The home screen gives a full business overview at a glance:

- **Active Orders** — live count of pending orders
- **Revenue Today** — total revenue from today's orders in ₹
- **Stock Alerts** — count of items running low or out of stock
- **Category Glance** — per-category status for all 5 ingredient types
- **Low Stock Alert List** — specific items needing attention, with a direct link to inventory

#### 📋 Order Queue (`/admin/orders`)
- All active (non-delivered) orders appear here in real time
- Each order card shows:
  - Customer name, phone, delivery address
  - Items ordered (pizza name, customizations)
  - Total amount
  - Current status
- **Status Dropdown** to move an order through its lifecycle:
  - `Order Received` → `In the Kitchen` → `Out for Delivery` → `Delivered`
- When marked **Delivered**, the order disappears from the queue (to keep it clean) but stays in the customer's order history forever

#### 📦 Inventory Management (`/admin/inventory`)
A complete ingredient stock management system across 5 categories:

**Bases · Sauces · Cheese · Veggies · Meats**

Every ingredient has:
- A **Status Badge**: 🟢 In Stock, 🟡 Low Stock, 🔴 Out of Stock, ⚫ Inactive
- **Stock Controls**: `−` and `+` buttons to adjust by 1, a direct number input field, and a **+10** quick restock button
- **Mark Out of Stock** — instantly sets stock to 0 for ingredients that ran out unexpectedly
- **Restock** button — appears when stock is 0; one click adds 10 units back
- **Deactivate / Activate** toggle — removes an ingredient from the customer's pizza builder without permanently deleting it. Reactivate anytime.
- **Show Inactive** toggle — reveals hidden ingredients so you can manage them
- **Add New Ingredient** dialog — add brand new ingredients with name, category, starting stock, low-stock threshold, and price
- Category tabs have **colored dot indicators** — red dot if any item is out of stock, amber if any is running low

#### 🔔 Low-Stock Notifications
- Automatically triggered after every successful order
- The system checks if any ingredient's stock has dropped below its configured threshold
- **24-hour debounce** per ingredient — the same alert is not sent more than once per day, preventing notification spam
- Alert logged to `stock_alerts` table for audit trail
- Email provider ready to be wired in (Resend, SendGrid, or Supabase SMTP)

---

## 🛠️ Tech Stack

| Layer | Technology | Why This Was Chosen |
|-------|-----------|---------------------|
| **UI Framework** | React 19 + TypeScript | Industry standard, component-based, type-safe |
| **SSR Framework** | TanStack Start | Server functions run on Vercel, keeping secrets secure |
| **Routing** | TanStack Router | File-based routing with full TypeScript support |
| **Server State** | TanStack Query | Caching, background refresh, and real-time syncing |
| **Styling** | Tailwind CSS v4 | Utility-first, fast, consistent design system |
| **UI Components** | shadcn/ui + Radix UI | Accessible, unstyled primitives styled with Tailwind |
| **Database** | Supabase (PostgreSQL) | Managed Postgres with Row-Level Security built in |
| **Authentication** | Supabase Auth | Email/password, JWT, email verification, password reset |
| **Realtime** | Supabase Realtime | WebSocket subscriptions to database change events |
| **Payments** | Razorpay | Leading Indian payment gateway, test mode available |
| **Deployment** | Vercel | Zero-config deployment, serverless functions, global CDN |
| **Build Tool** | Vite 7 + Nitro | Fast builds, Vercel Build Output API v3 output |

---

## 🏗️ Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                      │
│                                                          │
│  React 19 + TanStack Router + TanStack Query             │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  User Pages  │  │  Admin Pages │  │  Auth Pages   │  │
│  │  /dashboard  │  │  /admin      │  │  /auth        │  │
│  │  /build      │  │  /admin/orders│  │  /admin/login │  │
│  │  /cart       │  │  /admin/inv.. │  │  /forgot-..   │  │
│  │  /orders     │  │              │  │               │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│          │                │                              │
│  Supabase Realtime  Server Functions (HTTP POST)         │
└──────────┼────────────────┼──────────────────────────────┘
           │ WebSocket      │ HTTPS
           ▼                ▼
┌─────────────────────────────────────────────────────────┐
│               VERCEL SERVERLESS (Server)                 │
│                                                          │
│  TanStack Start Server Functions (Nitro/Node.js)         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  placeOrder()     — verify Razorpay HMAC,        │    │
│  │                     insert order + items         │    │
│  │  createRazorpayOrder() — call Razorpay REST API  │    │
│  │  updateOrderStatus()  — admin-only status change │    │
│  │  promoteSelfToAdmin() — first-user admin setup   │    │
│  └─────────────────────────────────────────────────┘    │
│          │ Service Role Key          │ API Key+Secret    │
└──────────┼───────────────────────────┼───────────────────┘
           ▼                           ▼
┌──────────────────────┐   ┌──────────────────────────────┐
│  Supabase (Postgres) │   │      Razorpay API            │
│  ─────────────────── │   │  ─────────────────────────── │
│  orders              │   │  Creates order with amount   │
│  order_items         │   │  Returns order_id + signature│
│  inventory_items     │   │  Test mode: no real charges  │
│  user_roles          │   └──────────────────────────────┘
│  profiles            │
│  stock_alerts        │
│  pizza_varieties     │
└──────────────────────┘
```

---

## 🗄️ Database Schema

```sql
-- Managed by Supabase Auth
auth.users              (id, email, created_at, ...)

-- Role-based access control
user_roles              (id, user_id, role)           -- role = 'admin' | 'user'

-- Extended user profile
profiles                (id, full_name, phone, address)

-- Signature pizza varieties on the menu
pizza_varieties         (id, name, description, base_price, image_url, active)

-- Ingredient stock for all 5 categories
inventory_items         (
  id, name,
  category,             -- 'base' | 'sauce' | 'cheese' | 'veggie' | 'meat'
  stock,                -- current units available
  threshold,            -- units below which a low-stock alert fires
  price,                -- price added to pizza when selected
  active                -- false = hidden from pizza builder
)

-- Customer orders
orders                  (
  id, user_id, status,
  total_amount, delivery_address, phone, customer_name,
  payment_id,           -- Razorpay payment ID (proof of payment)
  archived_for_admin,   -- true after delivered (cleans admin queue)
  created_at
)

-- Items within each order
order_items             (
  id, order_id, pizza_name,
  base_id, sauce_id, cheese_id,
  veggie_ids[],         -- array of ingredient IDs
  meat_ids[],           -- array of ingredient IDs
  quantity, price
)

-- Debounce log for low-stock alerts
stock_alerts            (id, item_id, alerted_at)
```

**Row-Level Security (RLS) Policies:**
- Users can only `SELECT` their own rows from `orders` and `order_items`
- Users cannot modify inventory or other users' data
- Admin operations run through server functions using the **service-role key**, which bypasses RLS safely on the server (never exposed to the browser)

---

## 📁 Project Structure

```
OIB_Metuku_Rishit_Kumar_Level_3_Task/
│
├── src/
│   ├── assets/
│   │   └── hero-pizza.jpg              # Hero image for landing page
│   │
│   ├── components/
│   │   ├── AdminHeader.tsx             # Admin navigation bar
│   │   ├── Header.tsx                  # User navigation bar
│   │   └── PizzaPlate.tsx              # Animated live pizza preview
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts               # Supabase browser client
│   │       ├── client.server.ts        # Supabase server client (service role key)
│   │       ├── auth-attacher.ts        # Middleware: attach JWT to server requests
│   │       ├── auth-middleware.ts      # Middleware: validate JWT on server functions
│   │       └── types.ts                # Auto-generated TypeScript database types
│   │
│   ├── lib/
│   │   ├── cart-store.ts               # Client-side cart state management
│   │   ├── orders.functions.ts         # Server functions: Razorpay, placeOrder, updateStatus
│   │   └── stock.server.ts             # Low-stock detection + email notification logic
│   │
│   └── routes/
│       ├── index.tsx                   # Landing page
│       ├── auth.tsx                    # User sign-up / sign-in
│       ├── admin.login.tsx             # Admin sign-in page
│       ├── admin.signup.tsx            # Admin registration page
│       ├── forgot-password.tsx         # Forgot password page
│       ├── reset-password.tsx          # Reset password (email link target)
│       └── _authenticated/             # Protected routes (require login)
│           ├── dashboard.tsx           # Menu — browse pizza varieties
│           ├── build.tsx               # Custom pizza builder (4 steps)
│           ├── cart.tsx                # Cart + Razorpay checkout
│           ├── orders.tsx              # User order history + live tracking
│           ├── admin.tsx               # Admin hub (stats + navigation)
│           ├── admin.orders.tsx        # Admin order queue + status management
│           └── admin.inventory.tsx     # Admin inventory management system
│
├── .env.example                        # Template for all required environment variables
├── .npmrc                              # legacy-peer-deps=true (for Vercel compatibility)
├── vite.config.ts                      # Vite + TanStack Start + Nitro Vercel preset
├── package.json
└── README.md
```

---

## 🔒 Security Design

Security was a priority throughout the build, not an afterthought.

### 1. Payment Security — HMAC Signature Verification
When Razorpay processes a payment, it calls our `handler` function with three values: `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. Before saving any order to the database, the server recomputes the expected signature using the secret key and compares it with what Razorpay sent.

```
Expected = HMAC_SHA256( order_id + "|" + payment_id , RAZORPAY_KEY_SECRET )
```

If the signatures don't match, the order is rejected. This prevents anyone from faking a payment success by calling the API directly.

### 2. Secrets Never Touch the Browser
The `RAZORPAY_KEY_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are only ever used inside **server functions** — code that runs on Vercel's serverless infrastructure. The browser receives only the Razorpay Key ID (which is public) and the Supabase anon key (which is intentionally public, guarded by RLS).

### 3. Row-Level Security (RLS)
Every Supabase table has RLS policies. For example:
- A user querying `orders` only gets back their own orders — even if they tried to request someone else's
- Inventory writes are blocked for regular users at the database level
- Admin mutations go through server functions using the service-role key which bypasses RLS, but only after role verification

### 4. JWT Authentication on Server Functions
Every protected server function validates the caller's JWT using `supabase.auth.getClaims(token)` — a zero-network-round-trip JWT decode. If the token is missing, expired, or tampered with, the function throws `401 Unauthorized` before executing any logic.

### 5. Admin Role Verification
The `updateOrderStatus` server function not only requires a valid JWT but also checks the `user_roles` table to confirm `role = 'admin'` before allowing any status change. A logged-in user without the admin role gets `403 Forbidden`.

---

## 💻 Local Development Setup

### Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** version 20 or higher — [Download here](https://nodejs.org)
- **npm** version 10 or higher (comes with Node.js)
- A free **[Supabase](https://supabase.com)** account and project
- A free **[Razorpay](https://razorpay.com)** account (test mode)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/rishitkumar8/OIB_Metuku_Rishit_Kumar_Level_3_Task.git
cd OIB_Metuku_Rishit_Kumar_Level_3_Task
```

### Step 2 — Install Dependencies

```bash
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is required because the project uses a beta version of Nitro that has a peer dependency version mismatch. The `.npmrc` file handles this automatically in CI/Vercel.

### Step 3 — Set Up Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values. See the [Environment Variables](#-environment-variables) section below for what each value means and where to find it.

### Step 4 — Start the Dev Server

```bash
npm run dev
```

The application will be running at **[http://localhost:3000](http://localhost:3000)**.

### Step 5 — Set Up the Database

In your Supabase project, run the following SQL to create the required tables. You can do this in the **Supabase Dashboard → SQL Editor**:

```sql
-- Profiles table (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  phone text,
  address text
);

-- Role-based access control
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  role text not null,
  unique (user_id, role)
);

-- Pizza varieties (menu items)
create table pizza_varieties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  base_price numeric not null default 0,
  image_url text,
  active boolean default true
);

-- Ingredient inventory
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('base','sauce','cheese','veggie','meat')),
  stock integer not null default 0,
  threshold integer not null default 5,
  price numeric not null default 0,
  active boolean default true
);

-- Customer orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  status text not null default 'received',
  total_amount numeric not null,
  delivery_address text,
  phone text,
  customer_name text,
  payment_id text,
  archived_for_admin boolean default false,
  created_at timestamptz default now()
);

-- Order line items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  pizza_name text not null,
  base_id uuid references inventory_items(id),
  sauce_id uuid references inventory_items(id),
  cheese_id uuid references inventory_items(id),
  veggie_ids uuid[] default '{}',
  meat_ids uuid[] default '{}',
  quantity integer not null default 1,
  price numeric not null
);

-- Low-stock notification debounce log
create table stock_alerts (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references inventory_items(id),
  alerted_at timestamptz default now()
);

-- Enable RLS on user-facing tables
alter table orders enable row level security;
alter table order_items enable row level security;

-- Users can only see their own orders
create policy "Users see own orders" on orders for select using (auth.uid() = user_id);
create policy "Users see own order items" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and o.user_id = auth.uid()));
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in each value. Here's exactly where to find each one:

| Variable | Where to Find It | Description |
|----------|-----------------|-------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | Your Supabase project URL |
| `VITE_SUPABASE_URL` | Same as above | Same URL — needed by client-side Vite code |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Settings → API → `anon` / `public` key | Safe to expose publicly; guarded by RLS |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as above | Same key — needed by client-side Vite code |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` key | **Keep secret!** Only used in server functions |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys → Key ID | Must start with `rzp_test_` for test mode |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys → Key Secret | **Keep secret!** Used to verify payment signatures |

> ⚠️ **Important:** Never commit your `.env` file to Git. It is already listed in `.gitignore`.

---

## 🚢 Deploying to Vercel

### Method A — GitHub Integration (Recommended, Easiest)

1. **Push** this repository to your GitHub account
2. Go to [vercel.com](https://vercel.com) → click **"Add New Project"**
3. **Import** your GitHub repository
4. In the configuration screen:
   - **Framework Preset**: select **"Other"**
   - **Build Command**: `npm run build`
   - **Output Directory**: leave blank (Nitro generates `.vercel/output/` automatically)
5. **Add all 7 environment variables** (from the table above) in the "Environment Variables" section
6. Click **Deploy**

Vercel will build and deploy automatically. Every future push to `main` triggers a new deployment.

### Method B — Vercel CLI

```bash
# Install the Vercel CLI globally
npm install -g vercel

# Log in to your Vercel account
vercel login

# Deploy from the project directory
vercel --prod
```

Follow the interactive prompts. When asked for environment variables, add all 7.

### How the Vercel Build Works

The `vite.config.ts` includes `nitro: { preset: "vercel" }`. This tells Nitro (the server bundler) to generate a `.vercel/output/` directory in the Vercel **Build Output API v3** format. Vercel detects this automatically and deploys the SSR app + serverless functions without needing a `vercel.json` config file.

---

## ⚡ How Real-Time Updates Work

This is one of the most interesting technical aspects of the project.

### The Problem
When an admin changes an order status from "In the Kitchen" to "Out for Delivery", how does the customer's screen update without them refreshing the page?

### The Solution — Supabase Realtime

Supabase provides a feature called **Realtime** — it uses WebSockets to stream database change events to connected browsers.

Here is a simplified view of the flow:

```
1. Admin clicks "Out for Delivery" on the orders page
        ↓
2. updateOrderStatus() server function runs
   → Supabase UPDATE: orders SET status = 'sent_to_delivery' WHERE id = '...'
        ↓
3. Supabase detects the row changed
   → Sends a "postgres_changes" event over WebSocket to all subscribers
        ↓
4. Customer's browser receives the event
   → TanStack Query cache is invalidated
   → UI re-renders with the new status instantly
        ↓
5. Customer sees "Out for Delivery" with the truck icon — no page refresh
```

Both the admin order queue and the customer order tracking page use this subscription pattern. The admin also sees new orders appear in real time as they come in.

---

## 👨‍💻 Author

<div align="center">

### Rishit Kumar Metuku

**OIB Web Development Internship — Level 3 Task Submission**

[![GitHub](https://img.shields.io/badge/GitHub-rishitkumar8-black?style=flat-square&logo=github)](https://github.com/rishitkumar8)

*Built with passion, precision, and a love for good pizza 🍕*

</div>

---

<div align="center">

**If you have any questions about this project, feel free to reach out.**

*Thank you for reviewing this submission!*

</div>
