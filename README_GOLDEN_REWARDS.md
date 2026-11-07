# Golden Rewards integration

This patch adds a website-based loyalty wallet to the existing Create React App website. Customers continue ordering through WhatsApp, Instagram, phone, or in person. There is no online checkout.

## Added features

- Neon Auth email/password registration and login.
- A personal Golden Wallet at `/rewards`.
- 10 points per eligible $1 spent.
- 200 points can be exchanged for a $1 reward code, valid for 30 days.
- Vercel serverless API routes that verify Neon Auth JWTs with Neon's JWKS.
- Admin-only purchase entry and reward-code confirmation at `/admin/rewards`.
- A PostgreSQL schema in `database/golden-rewards.sql`, with UUID user references matching Neon Auth.

## Before running locally

1. Keep your existing `.env.local` private. Do not commit it or send it to anyone.
2. Add the public Auth URL to Create React App's environment. Run this once in PowerShell from the project root:

   ```powershell
   $lines = Get-Content .env.local
   $authLine = $lines | Where-Object { $_.StartsWith('NEON_AUTH_BASE_URL=') } | Select-Object -First 1
   if (-not $authLine) { throw 'NEON_AUTH_BASE_URL was not found in .env.local' }
   $authValue = $authLine.Substring('NEON_AUTH_BASE_URL='.Length)
   $lines = $lines | Where-Object { -not $_.StartsWith('REACT_APP_NEON_AUTH_BASE_URL=') }
   $lines += "REACT_APP_NEON_AUTH_BASE_URL=$authValue"
   Set-Content .env.local $lines
   ```

3. Add the following server-only variable to `.env.local`, replacing the example with the email address of the Golden Spreads admin account you will register:

   ```env
   GOLDEN_ADMIN_EMAILS=your-admin-email@example.com
   ```

   Do not prefix this with `REACT_APP_`.

4. Install the dependencies and update the lockfile:

   ```bash
   npm install
   ```

5. In Neon Console, open the SQL Editor for the `production` branch and run the complete contents of `database/golden-rewards.sql` once.

6. In Neon Console → Better Auth settings, make sure the trusted origins include `https://goldenspreads.vercel.app` and (for local development) `http://localhost:3000`. If you use a custom domain, add that origin too.

7. For local end-to-end testing of the Vercel API routes, use Vercel's local runtime rather than `npm start`:

   ```bash
   npx vercel dev
   ```

   `npm start` runs only the Create React App development server and does not execute the `/api` serverless functions.

## Vercel environment variables

In Vercel → Project → Settings → Environment Variables, add these variables for Production (and Preview if you intend to test there):

- `DATABASE_URL` — copy from the local `.env.local` value; server-side only.
- `NEON_AUTH_BASE_URL` — copy from `.env.local`; server-side only.
- `NEON_AUTH_JWKS_URL` — copy from `.env.local`; server-side only.
- `GOLDEN_ADMIN_EMAILS` — the verified email address allowed to use the admin dashboard; server-side only.
- `REACT_APP_NEON_AUTH_BASE_URL` — the same value as `NEON_AUTH_BASE_URL`; this is the public Auth endpoint used by the browser SDK.

Never create `REACT_APP_DATABASE_URL`, `REACT_APP_DATABASE_URL_UNPOOLED`, or `REACT_APP_NEON_AUTH_JWKS_URL`. Database credentials and the JWKS verification endpoint must remain server-side.

After setting the variables, redeploy the Vercel project.

## Admin security

- Admin access is granted only when the authenticated Neon Auth user has an email listed in `GOLDEN_ADMIN_EMAILS` and Neon Auth marks that email as verified.
- The server verifies the JWT signature and issuer using `NEON_AUTH_JWKS_URL` and `NEON_AUTH_BASE_URL`.
- The browser never receives `DATABASE_URL`.
- Purchase points are calculated on the server, not trusted from the browser.
- Each purchase requires a unique order reference. A duplicate reference cannot award points twice.
- Customer redemption deducts 200 points on the server and issues a one-time $1 code. Admin must mark the code used before applying it to an offline order.

## Verification checklist

After installing dependencies and applying the SQL schema:

1. Run `npm run build` and confirm it finishes successfully.
2. Run `npx vercel dev` and open `/api/loyalty/health`. It should report `database: "connected"`, `schemaReady: true`, and `authConfigured: true`.
3. Open `/rewards`, create a test account, sign out, and sign back in.
4. Confirm the account has a `GS-...` member code and a zero-point wallet.
5. Set `GOLDEN_ADMIN_EMAILS` to the verified email of the admin account in both local and Vercel server environments.
6. Open `/admin/rewards`, record a test purchase with a unique order reference, and confirm the wallet balance increases by 10 points per eligible dollar.
7. Redeem 200 points, confirm a $1 code appears, mark it used from the admin dashboard, and verify the same code cannot be used twice.
8. Test a normal customer account against `/api/loyalty/admin/status`; it must return 403.

## Important notes

- The current uploaded product data says 300 g per jar, while the business details provided separately say 350 g. This patch does not change product weights; confirm the correct size before editing the product listings.
- The current loyalty values are the proposed pilot rules: 10 points per eligible $1; 200 points = $1 off. Delivery charges are excluded from eligible spend.
- The code patch does not contain any `.env.local` values or database credentials.
- End-to-end testing still requires your Neon project credentials and your local/Vercel runtime. Do not report the integration as production-tested until sign-up, sign-in, wallet reads, admin awards, and one-time redemption have been exercised against the actual project.
