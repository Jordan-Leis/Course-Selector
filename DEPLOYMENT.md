# Deployment Guide

## Pre-Deployment Checklist

- [ ] Database migrations have been run in Supabase
- [ ] Environment variables are ready
- [ ] Code is ready for production

## Step 1: Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Coursify MVP"
```

## Step 2: Push to GitHub

1. Create a new repository on GitHub: https://github.com/Jordan-Leis/Course-Selector
2. Add the remote and push:

```bash
git remote add origin https://github.com/Jordan-Leis/Course-Selector.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository: `Jordan-Leis/Course-Selector`
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `./`
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://cyrbrwehzgmsvkzcjnzq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_S6K1CFJKt6GD5sB4LuKnhQ_zVrmsHAj`
6. Click "Deploy"

## Step 4: Run Database Migrations

Before using the app, make sure to run the database migrations in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migrations in order:
   - Copy and paste contents of `supabase/migrations/001_initial_schema.sql`
   - Execute
   - Copy and paste contents of `supabase/migrations/002_seed_courses.sql`
   - Execute

Alternatively, if you have Supabase CLI installed:

```bash
supabase link --project-ref cyrbrwehzgmsvkzcjnzq
supabase db push
```

## Step 5: Configure Supabase Auth

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel deployment URL to "Site URL"
3. Add `https://your-vercel-url.vercel.app/api/auth/callback` to "Redirect URLs"

## Step 6: Test Production Deployment

1. Visit your Vercel deployment URL
2. Test the login flow with a @uwaterloo.ca email
3. Create a test plan
4. Verify all features work correctly

## Troubleshooting

### Database Connection Issues
- Verify environment variables are set correctly in Vercel
- Check Supabase project is active and accessible

### Authentication Issues
- Verify redirect URLs are configured in Supabase
- Check that magic link emails are being sent (check Supabase email settings)

### Migration Issues
- Ensure migrations are run in order
- Check Supabase logs for SQL errors
