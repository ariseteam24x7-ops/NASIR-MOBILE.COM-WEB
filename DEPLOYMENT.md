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

## 5. Hostinger (hPanel) Deployment & 503 Error Resolution

`nasirmobile.com` is hosted on **Hostinger with LiteSpeed and Node.js**.
If Hostinger displays:
`503 Service Unavailable — The server is temporarily busy, try again later!`
it means the Hostinger Node.js process is stopped, crashed, or needs to restart with the compiled `server.js` and `dist` assets.

### Quick Fix Steps in Hostinger hPanel:
1. Log into **Hostinger hPanel** -> Go to **Websites** -> Select **nasirmobile.com**.
2. Under the left menu, search for or click **Node.js**:
   - **Node.js version**: Choose **Node 20.x** or **Node 22.x** (LTS).
   - **Application mode**: `Production`
   - **Application root**: Leave as default or `/home/u.../domains/nasirmobile.com/public_html`
   - **Application startup file**: `server.js` (Must be `server.js`, NOT `server.ts`).
3. Click **Run NPM Install** to ensure all required dependencies are installed.
4. Click **Restart Application** (or if status is "Stopped", click **Start Application**).
5. Ensure your `.env` contains the required database and owner configuration:
   ```env
   PORT=3000
   NODE_ENV=production
   OWNER_EMAIL="shazzzbusiness@gmail.com"
   OWNER_SETUP_KEY="NasirMobileDubai2026!"
   SQL_HOST="your-db-host"
   SQL_DB_NAME="your-db-name"
   SQL_USER="your-db-user"
   SQL_PASSWORD="your-db-password"
   SQL_SSL="false"
   ```
6. Visit `https://nasirmobile.com` or `https://nasirmobile.com/api/health` to confirm the green `200 OK` status!

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
