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

4. Deploy.

## Environment Variables

| Variable                | Description                     | Required |
|-------------------------|----------------------------------|----------|
| `DATABASE_URL`          | Turso database URL               | Yes      |
| `DATABASE_AUTH_TOKEN`   | Turso auth token                 | Yes      |

## Notes

- The admin section currently has no authentication. Consider adding protection before making the site public.
- For production use, review and harden the "Current Operator" pattern used for audit trails.

## Useful Commands

```bash
# Run migrations against production
npm run db:push

# Seed production (use with caution)
npm run db:seed
```