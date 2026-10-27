# Nasir Mobile Dubai — Deployment & Operations Guide

## 1. Architecture Overview
Nasir Mobile is built as a full-stack e-commerce catalogue tailored for Dubai, UAE with:
- **Frontend**: React SPA with Tailwind CSS v4, custom brand theme, bilingual RTL (English & Arabic), circular angular NZ-inspired logo, and direct WhatsApp enquiry engines.
- **Backend**: Express server (`server.ts`) with Vite dev middleware in development and static/API routing in production.
- **Database**: Relational PostgreSQL provisioned with Drizzle ORM and connection pooling.
- **Persistent Image Storage**: Durable base64/binary image storage in PostgreSQL `images` table served via `/api/images/:id`.
- **Authentication**: Firebase Authentication (Google Sign-In) combined with secure session tokens and owner master credentials.
- **Privacy Enforcement**: Absolute public catalogue privacy. Private fields (`purchaseCost`, `stockQuantity`, `imeiSerialNumbers`, `privateNotes`) are never exposed across public APIs or frontend state.

---

## 2. Environment Variables (.env)
Configure the following in your deployment environment (Vercel, Cloud Run, or VPS):

```env
PORT=3000
APP_URL="https://nasirmobile.com"

# Authorized Owner
OWNER_EMAIL="shazzzbusiness@gmail.com"
OWNER_SETUP_KEY="NasirMobileDubai2026!"

# PostgreSQL Runtime Credentials (Object Method)
SQL_HOST="your-db-host"
SQL_DB_NAME="your-db-name"
SQL_USER="your-db-user"
SQL_PASSWORD="your-db-password"

# Drizzle Schema Admin Credentials
SQL_ADMIN_USER="your-admin-user"
SQL_ADMIN_PASSWORD="your-admin-password"
```

---

## 3. Initial Owner Setup
1. Launch the application and click the **Owner Portal** lock icon or navigate to `/admin`.
2. Sign in with either:
   - **Google Sign-In**: Click "Sign in with Google" using the authorized email `shazzzbusiness@gmail.com`.
   - **Owner Master Password**: Enter `shazzzbusiness@gmail.com` and your configured `OWNER_SETUP_KEY` (default initial key: `NasirMobileDubai2026!`).
3. Once logged in, you can manage products, categories, brands, WhatsApp numbers, website content, and view the audit log.

---

## 4. WhatsApp Configuration
The store features two editable business lines:
- **Primary Line**: `+971522523900`
- **Secondary Line**: `+971563903672`

In the **Owner Admin Panel > WhatsApp Settings**:
- Switch the active primary enquiry number.
- Toggle WhatsApp enquiry buttons globally.
- Customize the English and Arabic message templates with dynamic tokens:
  - `{productName}`
  - `{brand}`
  - `{sku}`
  - `{condition}`
  - `{variant}`
  - `{url}`

---

## 5. Hostinger Deployment & Why "Node.js" May Be Missing

### Why you cannot find "Node.js" in Search or Advanced Settings:
There are two reasons why "Node.js" does not appear in your Hostinger hPanel:

1. **Your Hostinger Plan Type (Most Common)**:
   - **Single Shared** or **Premium Shared Hosting**: These standard plans run LiteSpeed optimized for PHP/HTML/WordPress and **do not support native Node.js applications** in hPanel. The Node.js manager will simply not exist in your search or advanced settings.
   - **Business Web Hosting** or **Cloud Startup / Cloud Professional**: These plans DO have Node.js web app support. In new hPanel, it is located under **Websites > Manage > Deployments / Web Applications / Node.js** (or created as a "Node.js Web App" when adding the site).
   - **Hostinger VPS**: Managed via SSH terminal using `pm2 start server.js` (there is no hPanel button).

---

### Which solution to follow right now:

#### ✅ Solution A: Easiest & Works on ANY Hostinger Plan (Static SPA Deploy)
Nasir Mobile's customer storefront and admin interface are fully pre-built into a high-speed React web application inside the `dist/` folder!

1. Open **Hostinger hPanel** → Click **Websites** → Click **Manage** next to `nasirmobile.com`.
2. Click **File Manager** → Open the `public_html` folder.
3. If there are any default Hostinger placeholder files (e.g. `default.php`), delete them.
4. Upload all files from the `dist/` directory into `public_html`:
   - `index.html`
   - `assets/` (folder containing the JS and CSS bundles)
   - `.htaccess` (included in `/dist/.htaccess` for React route rewrites)
5. Visit `https://nasirmobile.com` — the **503 error will immediately disappear** and your store will load instantly with UAE 🇦🇪 branding, products, Arabic & English switching, and WhatsApp ordering!

---

#### 🚀 Solution B: If you have Hostinger Business or Cloud Hosting
If your plan is **Business** or **Cloud**, Node.js is located here:
1. In hPanel, go to **Websites** → click **Add Website** or **Create or Migrate Website**.
2. When asked for website type, choose **Node.js Web App** (or look under **Deployments** in your website's dashboard).
3. If your existing website slot was created as a standard PHP website, hPanel does not show the Node.js menu for that slot. You can create a new subdomain or re-add the site as a **Node.js application**.
4. Set:
   - **Node.js version**: `20.x` or `22.x`
   - **Startup file**: `server.js`

---

#### 🌐 Solution C: Free Dedicated Node.js Host (Vercel or Render) + Custom Domain
If you want the full Node.js dynamic server running with zero configuration:
1. Connect this repo to **Vercel** or **Render.com**.
2. In Hostinger DNS zone for `nasirmobile.com`, point the A record (`@`) and CNAME (`www`) to your deployment.

---

## 6. Vercel Alternative Setup
If you ever deploy frontend on Vercel:
1. Go to your project settings in Vercel > **Domains**.
2. Enter `nasirmobile.com` and `www.nasirmobile.com`.
3. In DNS records:
   - **Type A**: `@` -> `76.76.21.21`
   - **Type CNAME**: `www` -> `cname.vercel-dns.com`

---

## 6. Database Migrations, Backup & Restore
- **Pushing Schema Updates**:
  ```bash
  npx drizzle-kit push
  ```
- **Database Backup (pg_dump)**:
  ```bash
  pg_dump -h $SQL_HOST -U $SQL_USER -d $SQL_DB_NAME -F c -b -v -f nasir_mobile_backup.dump
  ```
- **Database Restore (pg_restore)**:
  ```bash
  pg_restore -h $SQL_HOST -U $SQL_USER -d $SQL_DB_NAME -v nasir_mobile_backup.dump
  ```

---

## 7. Future Expansion Readiness
The database and architecture are designed to seamlessly support:
- Individual IMEI and device tracking.
- Stock movements and replenishment tracking.
- Landed purchasing costs and target profit calculations.
- Bulk CSV/Excel inventory import and export.
- Customer order and receipt archives.
