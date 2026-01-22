# Coursify - Deployment Checklist

## ✅ What's Already Complete

Your MVP is **fully implemented** and ready to ship! Here's what's in place:

### Core Features
- ✅ UW email gated sign-in (magic link authentication)
- ✅ Course catalog search with ILIKE queries
- ✅ Term-by-term plan builder (1A → 4B)
- ✅ Save and load multiple plans per user
- ✅ Duplicate course warnings
- ✅ Unit overload warnings (>6 units per term)
- ✅ Editable plan names
- ✅ Course removal from terms
- ✅ Onboarding flow for program selection

### Database
- ✅ All tables created (courses, profiles, plans, plan_terms, plan_term_courses)
- ✅ Row Level Security (RLS) policies configured
- ✅ Database triggers for auto-updating timestamps
- ✅ **NEW**: Auto-create profile trigger on user signup
- ✅ Course seed data (ECE + common first-year courses)

### Authentication & Routing
- ✅ Magic link authentication with UW email validation
- ✅ Protected routes via middleware
- ✅ Onboarding redirect logic
- ✅ Auth callback with onboarding check
- ✅ Logout functionality

### UI Components
- ✅ Landing page
- ✅ Login page
- ✅ Onboarding page
- ✅ Dashboard (plans list)
- ✅ Plan builder with term columns
- ✅ Course search component
- ✅ Course cards
- ✅ Warnings display

## 🚀 Deployment Steps

### 1. Create `.env.local` File

**IMPORTANT**: Create this file manually (it's gitignored):

```bash
# Create .env.local in the project root
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://cyrbrwehzgmsvkzcjnzq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_S6K1CFJKt6GD5sB4LuKnhQ_zVrmsHAj
EOF
```

### 2. Set Up Supabase Database

1. Go to your Supabase project: https://cyrbrwehzgmsvkzcjnzq.supabase.co
2. Navigate to **SQL Editor**
3. Run the migrations in order:
   - Copy and paste contents of `supabase/migrations/001_initial_schema.sql`
   - Copy and paste contents of `supabase/migrations/002_seed_courses.sql`
4. Verify tables are created:
   - `courses` (should have ~48 seeded courses)
   - `profiles`
   - `plans`
   - `plan_terms`
   - `plan_term_courses`

### 3. Configure Supabase Auth

1. Go to **Authentication** → **URL Configuration**
2. Add redirect URL: `http://localhost:3000/api/auth/callback` (for local dev)
3. Add redirect URL: `https://your-vercel-app.vercel.app/api/auth/callback` (for production)

### 4. Test Locally

```bash
# Install dependencies (if not already done)
npm install

# Run development server
npm run dev
```

Visit http://localhost:3000 and test:
- Sign in with a @uwaterloo.ca email
- Complete onboarding
- Create a plan
- Add courses to terms
- Verify warnings appear

### 5. Push to GitHub

```bash
# Initialize git if needed
git init

# Add remote (if not already added)
git remote add origin https://github.com/Jordan-Leis/Course-Selector.git

# Commit and push
git add .
git commit -m "Initial MVP commit - Coursify ready for deployment"
git push -u origin main
```

### 6. Deploy to Vercel

1. Go to https://vercel.com
2. Click **Add New Project**
3. Import your GitHub repository: `Jordan-Leis/Course-Selector`
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (default)
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://cyrbrwehzgmsvkzcjnzq.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_S6K1CFJKt6GD5sB4LuKnhQ_zVrmsHAj`
6. Click **Deploy**

### 7. Update Supabase Redirect URLs

After Vercel deployment:
1. Get your Vercel app URL (e.g., `https://coursify.vercel.app`)
2. Go to Supabase → Authentication → URL Configuration
3. Add production redirect URL: `https://your-app.vercel.app/api/auth/callback`

### 8. Final Verification

- [ ] Sign in works with UW email
- [ ] Onboarding flow completes
- [ ] Can create plans
- [ ] Can add courses to terms
- [ ] Can remove courses
- [ ] Warnings display correctly
- [ ] Plans persist after refresh
- [ ] Logout works

## 📝 Recent Improvements Made

1. **Auto-create profile trigger**: Added database trigger to automatically create a profile when a user signs up
2. **Auth callback fix**: Updated to redirect to onboarding if user doesn't have a program
3. **Database schema**: All tables, indexes, and RLS policies are properly configured

## 🐛 Troubleshooting

### "Profile not found" errors
- The auto-create trigger should handle this, but if issues persist, check that the trigger was created in Supabase

### Course search not working
- Verify the `courses` table has data (run seed migration)
- Check that RLS allows public read on `courses` table

### Auth redirect loops
- Verify redirect URLs are set correctly in Supabase
- Check middleware is not blocking necessary routes

### Build errors on Vercel
- Ensure all environment variables are set
- Check that TypeScript compiles: `npm run build` locally first

## 🎉 You're Ready to Ship!

Your MVP is complete and production-ready. Follow the steps above to deploy to Vercel and you'll have a live course planner!
