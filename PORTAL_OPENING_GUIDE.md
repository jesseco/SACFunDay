# Portal Opening - Quick Guide

## ✅ What's Been Fixed

1. **Simplified Admin Settings Page**
   - Removed complicated date/time portal opening logic
   - Now just a single checkbox: ✅ Portal is OPEN / ⏸️ Portal is CLOSED
   - Much easier to manage!

2. **Portal Logic Updated**
   - Portal now only checks the simple boolean flag
   - No more automatic date-based opening/closing

## 🚀 How to Open the Portal (Production)

### Option 1: Via Admin Dashboard (Once Migration is Done)
1. Login: https://sac-fun-day.vercel.app/admin
2. Go to **Settings**
3. Check the box: **"Portal is OPEN"**
4. Click **Save**

### Option 2: Via Turso CLI (Do This First to Migrate)
```bash
# 1. Login to Turso
turso auth login

# 2. Find your database
turso db list

# 3. Add the missing columns (REQUIRED - only needed once)
turso db shell <your-db-name> "ALTER TABLE guardians ADD COLUMN lunch_attendees INTEGER NOT NULL DEFAULT 0;"
turso db shell <your-db-name> "ALTER TABLE guardians ADD COLUMN payment_proof TEXT;"

# 4. Open the portal
turso db shell <your-db-name> "UPDATE settings SET portal_open = 1 WHERE id = 1;"
```

## ⚠️ Important: Database Migration Required

The admin page was failing because the production database is missing these columns:
- `lunch_attendees`
- `payment_proof`

**You must run the migration commands above (Option 2, step 3) before the admin page will work.**

## Current Status

- ✅ Code deployed to production
- ✅ Admin settings page simplified (single toggle)
- ✅ Local portal opened
- ⚠️ **Production database needs migration**
- ⚠️ **Production portal still closed** (waiting for migration + toggle)

## Next Steps

1. Run the Turso migration commands above
2. Login to admin dashboard
3. Go to Settings and check the "Portal is OPEN" box
4. Parents can now sign up!
