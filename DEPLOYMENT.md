# Deployment Guide

## Recommended Stack

- **Hosting**: [Vercel](https://vercel.com)
- **Database**: [Turso](https://turso.tech) (LibSQL / hosted SQLite)

This combination offers excellent developer experience and is production-capable for this type of application.

## Prerequisites

1. A [Turso](https://turso.tech) account
2. A [Vercel](https://vercel.com) account

## Step 1: Create a Turso Database

```bash
turso db create sacfunday-prod

# Get connection details
turso db show sacfunday-prod

# Create an auth token
turso db tokens create sacfunday-prod
```

You will need:
- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`
- `ADMIN_PIN` (a simple code the Organizing Committee will use to access the admin area)
- `SESSION_SECRET` (a long random string used to sign admin session cookies — generate with `openssl rand -hex 32`)

## Step 2: Push Schema and Seed

```bash
export DATABASE_URL=libsql://your-db.turso.io
export DATABASE_AUTH_TOKEN=your-token

npm run db:push
npm run db:seed
```

## Step 3: Deploy to Vercel

1. Push your code to GitHub.
2. Import the repository on Vercel.
3. Add the following Environment Variables:
   - `DATABASE_URL`
   - `DATABASE_AUTH_TOKEN`
   - `ADMIN_PIN` (the PIN the OC will use to log into the admin area)
   - `SESSION_SECRET` (a long random string used to sign session cookies)

4. Deploy.

## Environment Variables

| Variable                | Description                                      | Required |
|-------------------------|--------------------------------------------------|----------|
| `DATABASE_URL`          | Turso database URL                               | Yes      |
| `DATABASE_AUTH_TOKEN`   | Turso auth token                                 | Yes      |
| `ADMIN_PIN`             | PIN used to log into the OC Admin Area (/admin)  | Yes      |
| `SESSION_SECRET`        | Secret key that signs admin session cookies      | Yes      |

**Note on Admin Access:** After deployment, visit `/login` and enter the `ADMIN_PIN` value to access the protected admin tools. Sessions are stored in a signed, expiring cookie (HMAC-SHA256, keyed by `SESSION_SECRET`) so they cannot be forged.

## Notes

- The admin section (`/admin`) is protected by a PIN login at `/login`. Set both `ADMIN_PIN` and `SESSION_SECRET` before deploying, or the admin area will be inaccessible.
- For production use, review and harden the "Current Operator" pattern used for audit trails.
- The PIN system is intentionally lightweight (no user accounts). It is suitable for a small trusted Organizing Committee.

## Useful Commands

```bash
# Run migrations against production
npm run db:push

# Seed production (use with caution)
npm run db:seed
```