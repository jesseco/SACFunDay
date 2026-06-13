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
   - `SESSION_SECRET` (a long random string used to sign session cookies)

4. Deploy.

## Step 4: Create the First Admin

The admin area uses per-user accounts (username + password). Create the first
admin once, then add the rest of the committee from within the app at
`/admin/users`.

```bash
# Run against the same database the app uses (set DATABASE_URL / token first)
SEED_ADMIN_USER=jesse \
SEED_ADMIN_PASSWORD='a-strong-password' \
SEED_ADMIN_NAME='Jesse Co' \
npm run create-admin
```

This is idempotent — it does nothing if any user already exists.

## Environment Variables

| Variable                | Description                                      | Required |
|-------------------------|--------------------------------------------------|----------|
| `DATABASE_URL`          | Turso database URL                               | Yes      |
| `DATABASE_AUTH_TOKEN`   | Turso auth token                                 | Yes      |
| `SESSION_SECRET`        | Secret key that signs admin session cookies      | Yes      |
| `SEED_ADMIN_USER`       | Username for the first-admin bootstrap script    | Bootstrap only |
| `SEED_ADMIN_PASSWORD`   | Password for the first-admin bootstrap script    | Bootstrap only |
| `SEED_ADMIN_NAME`       | Display name for the first admin                 | Bootstrap only |

**Note on Admin Access:** Each OC member signs in at `/login` with their own
username and password. There are two roles — **Admin** (full access) and
**Marshal** (results entry + station check-in). Sessions are stored in a
signed, expiring cookie (HMAC-SHA256, keyed by `SESSION_SECRET`) carrying the
user id and role, so they cannot be forged. Results are attributed to the
logged-in user automatically.

## Notes

- Set `SESSION_SECRET` before deploying, then run the create-admin step, or the admin area will be inaccessible.
- Admins manage members at `/admin/users` — add, deactivate, change role, and reset passwords. Deactivating a member blocks them on their next request.
- Passwords are hashed with scrypt; only the hash is stored.

## Useful Commands

```bash
# Run migrations against production
npm run db:push

# Seed production (use with caution)
npm run db:seed
```