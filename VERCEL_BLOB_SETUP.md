# Vercel Blob Storage Setup for Payment Proofs

## What Changed

Payment proof images are now stored in **Vercel Blob Storage** instead of the database. This is more efficient and scalable for handling 100-200 image uploads.

## Setup Instructions

### 1. Create a Vercel Blob Store

**Option A: Via Vercel Dashboard**
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database** → **Blob**
4. Name it (e.g., "sacfunday-payments")
5. Click **Create**

**Option B: Via CLI**
```bash
vercel blob create sacfunday-payments
```

### 2. Get Your Token

After creating the store:
- The `BLOB_READ_WRITE_TOKEN` will be automatically added to your Vercel project's environment variables
- To get it locally, run:
  ```bash
  vercel env pull .env.local
  ```

**OR** manually copy it:
1. Go to **Settings** → **Environment Variables**
2. Find `BLOB_READ_WRITE_TOKEN`
3. Copy the value

### 3. Add to Local Environment

Add to your `.env.local`:
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

### 4. Deploy

The token is already configured in Vercel's environment, so just deploy:
```bash
git add .
git commit -m "feat: migrate payment proofs to Vercel Blob Storage"
git push
```

Vercel will automatically deploy with the correct environment variables.

## How It Works

- **Upload**: When a parent submits the signup form with payment proof, the file is uploaded to Vercel Blob Storage
- **Storage**: Only the URL is stored in the database (not the entire image)
- **Access**: Images are publicly accessible via their URLs (needed for OC admin to verify payments)
- **Naming**: Files are organized as `payment-proof/{phone}-{timestamp}-{filename}`

## Cost

- **Free tier**: 10GB storage
- **Pricing**: $0.15/GB after that
- **Expected usage**: 100-200 images × ~500KB = ~50-100MB (well within free tier)

## Migration Notes

- Existing guardians with no payment proof will be prompted to upload one on their next signup
- Old base64 data (if any) in existing records will remain but won't be used
- New uploads always use Blob Storage

## Troubleshooting

**Error: "BLOB_READ_WRITE_TOKEN is not defined"**
- Make sure you've added the token to `.env.local` for local development
- For production, verify it's in Vercel's environment variables

**Files not uploading:**
- Check file size limits (Vercel Blob has a 5MB default limit per file)
- Verify the token has read/write permissions (not read-only)
