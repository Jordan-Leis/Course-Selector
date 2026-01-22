# Setting Up Environment Variables in Vercel

## The Problem

`.env.local` files are **NOT deployed** to Vercel - they're gitignored and only work locally. You need to set environment variables in Vercel's dashboard.

## Solution: Add Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard

1. Go to https://vercel.com
2. Select your project: **Course-Selector** (or whatever you named it)
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Environment Variables

Add these two variables:

**Variable 1:**
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://cyrbrwehzgmsvkzcjnzq.supabase.co`
- **Environment**: Select all (Production, Preview, Development)

**Variable 2:**
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `sb_publishable_S6K1CFJKt6GD5sB4LuKnhQ_zVrmsHAj`
- **Environment**: Select all (Production, Preview, Development)

### Step 3: Redeploy

After adding the variables:
1. Go to the **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Quick Copy-Paste Values

```
NEXT_PUBLIC_SUPABASE_URL=https://cyrbrwehzgmsvkzcjnzq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_S6K1CFJKt6GD5sB4LuKnhQ_zVrmsHAj
```

## Verify It's Working

After redeploying, check the build logs. You should see:
- ✅ Build completes successfully
- ✅ No "Missing Supabase environment variables" errors
- ✅ Pages render correctly

## Troubleshooting

If you still see errors:
1. Make sure variable names are **exactly** as shown (case-sensitive)
2. Make sure you selected **all environments** (Production, Preview, Development)
3. Make sure you **redeployed** after adding variables
4. Check that there are no extra spaces in the values

## Why This Happens

- `.env.local` is gitignored and never deployed
- Vercel needs environment variables set in their dashboard
- Next.js tries to analyze pages during build, which requires env vars to be available
