# 🚨 URGENT: Production Database Migration Required

## Problem

The admin page is failing with this error:
```
SQLite input error: no such column: lunch_attendees
```

The production Turso database needs to be migrated to add the new columns.

## Solution

Run these SQL commands on your production database:

```sql
ALTER TABLE guardians ADD COLUMN lunch_attendees INTEGER NOT NULL DEFAULT 0;
ALTER TABLE guardians ADD COLUMN payment_proof TEXT;
```

## Method 1: Via Turso CLI (Recommended)

```bash
# 1. Login to Turso
turso auth login

# 2. List your databases to find the name
turso db list

# 3. Run the migration (replace <db-name> with your actual database name)
turso db shell <db-name> "ALTER TABLE guardians ADD COLUMN lunch_attendees INTEGER NOT NULL DEFAULT 0;"
turso db shell <db-name> "ALTER TABLE guardians ADD COLUMN payment_proof TEXT;"

# 4. Verify the columns were added
turso db shell <db-name> "PRAGMA table_info(guardians);"
```

## Method 2: Via Turso Web Console

1. Go to https://turso.tech/app
2. Select your database
3. Open the SQL console
4. Run:
   ```sql
   ALTER TABLE guardians ADD COLUMN lunch_attendees INTEGER NOT NULL DEFAULT 0;
   ALTER TABLE guardians ADD COLUMN payment_proof TEXT;
   ```

## Method 3: Using our migration script

```bash
# 1. Get your database credentials from Vercel dashboard:
#    https://vercel.com/jesse-cos-projects/sac-fun-day/settings/environment-variables

# 2. Run the migration:
DATABASE_URL="libsql://your-db.turso.io" \
DATABASE_AUTH_TOKEN="your-token" \
npx tsx scripts/migrate-production.ts
```

## After Migration

Once the migration is complete:
1. The admin page should load immediately (no redeploy needed)
2. Test by visiting: https://sac-fun-day.vercel.app/admin
3. The errors should be gone

## Files Ready

- ✅ Migration script: `scripts/migrate-production.ts`
- ✅ All code changes deployed
- ⚠️ **Waiting for database migration**
