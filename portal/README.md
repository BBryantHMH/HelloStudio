# Hello Studio Portal

A real, working customer + admin portal for selling worksheets, webinars, and courses. Customers sign up, pay through Stripe, and access their content. You see every order in the admin dashboard.

**Stack:** Next.js 14 (App Router) · Supabase (database + auth) · Stripe (payments) · Vercel (hosting)

**Cost to run, after free tiers:** ~$0/month for low volume. Stripe takes their per-transaction cut (~2.9% + 30¢) only when you actually sell something. Supabase free tier is generous enough for thousands of users; Vercel free tier deploys this fine.

---

## ⚠️ Before you start

This is real software with real money flowing through it. You'll be responsible for:

- **Refunds and disputes** when they happen (process them in the Stripe dashboard)
- **Sales tax** if you sell to states/countries that require collection (Stripe Tax can automate this)
- **Privacy/terms** pages (a one-page Terms + Privacy is enough to start)
- **Keeping the code updated** — security patches once or twice a year via `npm update`

If any of that sounds like more than you want to take on, **a SaaS like Stan Store, Podia, ThriveCart, or Teachable** handles all of it for $30–100/month and you spend zero engineering time. Worth knowing the alternative exists.

---

## Setup (one-time, ~30 minutes)

### 1. Install Node.js

Download from <https://nodejs.org> — the LTS version. After installing, open Terminal and confirm:

```bash
node -v   # should print v18.x or higher
```

### 2. Set up Supabase (the database + auth)

1. Sign up at <https://supabase.com> (free)
2. Click **New project**. Pick any name. Save the database password somewhere — you won't need it for normal use, but you may need it later.
3. Once the project is ready (1–2 min), go to **SQL Editor** → **New query**
4. Open `supabase/schema.sql` from this folder. Copy the **entire** file contents. Paste into the SQL editor. Click **Run**.
5. Go to **Settings → API**. Copy these three values somewhere temporary (you'll paste them in Step 4):
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key
   - **service_role secret** key (⚠️ keep this private — never commit it, never put it in client code)
6. Go to **Authentication → Providers → Email** — make sure it's enabled. Decide whether you want email confirmation on (more secure, but customers must click a link) or off (instant access). For a coaching site, **on** is the right default.
7. Go to **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` for now (we'll change this in production)
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` and (later) `https://your-portal-domain/auth/callback`

### 3. Set up Stripe (the payments)

1. Sign up at <https://stripe.com> (free until you take payments)
2. Stay in **Test mode** for now (toggle in the top-right)
3. Go to **Developers → API keys**. Copy:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) — click "Reveal"
4. **Webhook setup** — leave this for Step 5 below. You can't get the webhook secret until you're running the app.

### 4. Configure the app

In Terminal, navigate to this folder, then:

```bash
cp .env.example .env.local
```

Open `.env.local` in any text editor and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=          # from Supabase Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # from Supabase Settings → API → anon public
SUPABASE_SERVICE_ROLE_KEY=         # from Supabase Settings → API → service_role
STRIPE_SECRET_KEY=                 # from Stripe Developers → API keys → Secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # from Stripe Developers → API keys → Publishable
STRIPE_WEBHOOK_SECRET=             # leave blank for now — fill in Step 5
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Save the file. **Never commit `.env.local` to GitHub.** It's already in `.gitignore`.

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open <http://localhost:3000> — you should see the storefront with no products yet. Sign up at `/signup` to create your account.

### 5. Make yourself an admin

After signing up, in the Supabase **SQL Editor**, run:

```sql
update public.profiles set role = 'admin' where email = 'YOUR-EMAIL-HERE';
```

Refresh the portal — you'll now see the **Admin** link in the nav. Visit `/admin/products` to add your first product.

### 6. Wire up the Stripe webhook

The webhook is what tells the portal "this customer paid; give them their stuff." For local development, use the Stripe CLI:

1. Install the CLI: <https://stripe.com/docs/stripe-cli>
2. In a NEW terminal window (leave `npm run dev` running):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will print a **webhook signing secret** that starts with `whsec_`. Copy it.

3. Paste it into `.env.local` as `STRIPE_WEBHOOK_SECRET=whsec_...`
4. Stop and restart `npm run dev` so it picks up the new env var.

### 7. Test a purchase

1. Go to `/admin/products` and create a test product (any price)
2. Sign out, sign back in as a regular customer (use a different email)
3. Click "Buy now" on the product, click "Pay with card"
4. On the Stripe checkout page, use the test card **4242 4242 4242 4242**, any future date, any CVC, any ZIP
5. After paying, you should land back on `/account` with a green success banner
6. The webhook fires; the order shows up in `/admin/orders` and the entitlement appears in the customer's `/account/library`

If any step fails, look at:
- The terminal running `npm run dev` (errors print here)
- The terminal running `stripe listen` (it prints every event and whether the webhook accepted it)

---

## Going live (production deploy)

### 1. Push the code to GitHub

```bash
git init
git add .
git commit -m "Initial portal"
# create a new repo at github.com/new, then:
git remote add origin https://github.com/YOUR-USER/hello-studio-portal.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Sign up at <https://vercel.com> with your GitHub account (free)
2. Click **Add New → Project**, import the `hello-studio-portal` repo
3. In **Environment Variables**, paste in everything from `.env.local` **except** set `NEXT_PUBLIC_SITE_URL` to your real production URL (you can use Vercel's auto-generated URL like `https://hello-studio-portal.vercel.app` to start, or your custom domain)
4. Click **Deploy**
5. After it deploys, copy the production URL.

### 3. Switch Stripe to Live mode

1. In Stripe, toggle from **Test mode** to **Live mode**
2. Get the live versions of `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from Developers → API keys
3. Set up a real webhook: **Developers → Webhooks → Add endpoint**
   - Endpoint URL: `https://YOUR-PRODUCTION-URL/api/webhooks/stripe`
   - Events to send: `checkout.session.completed` and `charge.refunded`
   - After creating, click into it and copy the **Signing secret** (`whsec_...`)
4. In Vercel **Settings → Environment Variables**, replace the test keys with live keys, and set the new `STRIPE_WEBHOOK_SECRET`. Redeploy.

### 4. Update Supabase

In Supabase **Authentication → URL Configuration**:
- **Site URL**: `https://YOUR-PRODUCTION-URL`
- **Redirect URLs**: add `https://YOUR-PRODUCTION-URL/auth/callback`

### 5. Connect a custom domain (optional)

In Vercel **Settings → Domains**, add `portal.hellostudio.online` (or whatever you want). Vercel will tell you the DNS record to add. Once DNS propagates, add an HTTPS link from your marketing site to `https://portal.hellostudio.online/login`.

---

## How it all fits together

```
hello-studio-portal/
├── app/
│   ├── page.jsx                  ← Public storefront (/)
│   ├── login/, signup/, forgot-password/  ← Auth
│   ├── account/                  ← Customer area: dashboard, library, orders
│   ├── admin/                    ← Admin area: overview, orders, customers, products
│   ├── checkout/[productId]/     ← Pre-checkout review screen
│   ├── api/checkout/             ← Creates Stripe Checkout sessions
│   └── api/webhooks/stripe/      ← Receives Stripe events; fulfills orders
├── lib/
│   ├── supabase/                 ← Supabase client helpers (browser + server + admin)
│   └── stripe.js                 ← Stripe SDK helper + price formatter
├── supabase/
│   └── schema.sql                ← Database tables, RLS policies, triggers
└── middleware.js                 ← Gates /account and /admin routes by auth
```

**The data model:**

- `profiles` extends Supabase's auth users with `role` (customer/admin) and display name. Auto-created via trigger on signup.
- `products` — your shop inventory (type: worksheet/webinar/course, price, delivery URL).
- `orders` + `order_items` — every transaction. The webhook creates these when a payment succeeds.
- `entitlements` — the bridge between users and the products they own. The library page reads from here.

Row Level Security is on, so customers can only see their own orders and entitlements. Admins (anyone with `role = 'admin'` on their profile) see everything. The webhook uses the service-role key, which bypasses RLS, so it can write across users.

---

## What's done · what's not yet

**Done:**
- Customer signup, login, password reset (email confirmation supported)
- Public storefront with type filters
- Per-product checkout via Stripe Checkout (hosted, PCI-compliant)
- Webhook fulfillment with idempotency (re-sends won't double-grant access)
- Customer account: overview, library (with download links), order history
- Admin: KPI dashboard, orders table with filters, customer list with lifetime spend, product CRUD with archive
- Refunds tracked when Stripe fires `charge.refunded`
- Auth gates on `/account` and `/admin` via middleware
- Hello Studio brand styling throughout

**What I'd add next** (each is a focused day of work):
- Cart for multi-item purchases (currently one product per checkout)
- Subscriptions for recurring courses (uses Stripe `mode: subscription`)
- Coupon codes (Stripe handles these natively — just pass `discounts` to checkout)
- Email receipts (Stripe sends one automatically; customize via Stripe dashboard)
- Sales tax (turn on Stripe Tax in dashboard, add `automatic_tax: { enabled: true }` to checkout session)
- Course-progress tracking for multi-module courses (add `course_modules` and `course_progress` tables)
- Customer-facing refund-request form
- File uploads from admin → Supabase Storage instead of pasting external URLs

---

## Troubleshooting

**"Webhook signature verification failed"** — your `STRIPE_WEBHOOK_SECRET` doesn't match what Stripe is signing with. In test mode, the CLI gives you the secret each time you run `stripe listen`; in production, copy the secret from the webhook endpoint detail page in the Stripe dashboard.

**Customer paid but their library is empty** — the webhook didn't fire or didn't succeed. Check the `Events` tab on the webhook in the Stripe dashboard for failure details. You can manually replay any event from there.

**"Not authorized" when visiting `/admin`** — your profile's `role` is still `customer`. Run the SQL update from Step 5 again with your email.

**`Module not found` errors after `npm install`** — delete `node_modules/` and `.next/`, then run `npm install` again.

**Locally, the database queries fail with "JWT expired"** — sign out and sign back in. Sessions refresh automatically once cookies are set; first-time sign-in occasionally hiccups.

---

## Support

This codebase is yours. If you want changes — new features, bug fixes, redesigns — bring it to any developer comfortable with Next.js (which is most of them) and they'll be productive in an hour. The code is heavily commented, the file structure is conventional, and the database schema is documented inline.

Built for Hello Studio · 2026
