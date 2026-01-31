# Coursify - Deployment Checklist

## ✅ What's Already Complete

Your system is **fully implemented** with multi-program support and admin panel! Here's what's in place:

### Core Features
- ✅ UW email gated sign-in (magic link authentication)
- ✅ Course catalog search with ILIKE queries
- ✅ Term-by-term plan builder (1A → 4B)
- ✅ Save and load multiple plans per user
- ✅ Prerequisite validation engine
- ✅ Duplicate course warnings
- ✅ Unit overload warnings (>6 units per term)
- ✅ Editable plan names
- ✅ Course removal from terms
- ✅ Onboarding flow for program selection
- ✅ **Multi-program support**: EE, CE, SE templates
- ✅ **Admin panel**: Full CRUD for programs, courses, users

### Program Templates
- ✅ Electrical Engineering (ECE_ELECTRICAL) - 8 terms complete
- ✅ Computer Engineering (ECE_COMPUTER) - 8 terms complete
- ✅ Software Engineering (SE) - 8 terms complete
- ✅ All elective requirements defined (TEs, CSEs, NSEs, etc.)

### Admin System
- ✅ Role-based access control (4 levels)
- ✅ Admin dashboard with stats
- ✅ Program management interface
- ✅ Course management interface
- ✅ User management interface
- ✅ Validation testing tools
- ✅ Complete audit logging
- ✅ Automatic audit triggers

### Database
- ✅ All tables created (courses, profiles, plans, program_templates, admin_users, audit_log)
- ✅ Row Level Security (RLS) policies configured
- ✅ Database triggers for auto-updating timestamps
- ✅ Auto-create profile trigger on user signup
- ✅ Course seed data (ECE + common first-year courses)
- ✅ Admin helper functions and policies

### Testing & Quality
- ✅ Pre-commit test script (TypeScript + ESLint)
- ✅ All code type-safe with zero warnings
- ✅ Comprehensive testing guide
- ✅ Setup and deployment documentation

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

**Using Supabase CLI (Recommended)**:
```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
npm run sync-courses
npm run setup-admin your.email@uwaterloo.ca
```

**Manual Setup**:
1. Go to your Supabase project: https://cyrbrwehzgmsvkzcjnzq.supabase.co
2. Navigate to **SQL Editor**
3. Run the migrations in order:
   - Copy and paste contents of `supabase/migrations/001_initial_schema.sql`
   - Copy and paste contents of `supabase/migrations/002_seed_courses.sql`
   - Copy and paste contents of `supabase/migrations/003_add_active_courses.sql`
   - Copy and paste contents of `supabase/migrations/004_add_prerequisites_system.sql`
   - Copy and paste contents of `supabase/migrations/006_fix_ee_ce_se_programs.sql`
   - Copy and paste contents of `supabase/migrations/009_add_admin_system.sql`
4. Verify tables are created:
   - `courses` (should have courses after sync)
   - `profiles`, `plans`, `plan_terms`, `plan_term_courses`
   - `program_templates` (should have 3 programs: EE, CE, SE)
   - `admin_users`, `audit_log`

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

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
- [ ] Can create plans with program templates (EE, CE, SE)
- [ ] Can add courses to terms
- [ ] Can remove courses
- [ ] Prerequisite validation works
- [ ] Warnings display correctly
- [ ] Plans persist after refresh
- [ ] Logout works
- [ ] Admin panel accessible at `/admin`
- [ ] Admin can view programs, courses, users
- [ ] Audit log records admin actions

### 9. Create Production Admin Account

After deployment, set up your admin access:

```bash
npm run setup-admin your.email@uwaterloo.ca super_admin
```

Or manually in Supabase SQL Editor:
```sql
INSERT INTO public.admin_users (user_id, role, created_by)
SELECT id, 'super_admin', id
FROM auth.users
WHERE email = 'your.email@uwaterloo.ca';
```

### 10. Test Admin Features

- [ ] Access `/admin` dashboard
- [ ] View program templates (should show EE, CE, SE)
- [ ] View course catalog
- [ ] View registered users
- [ ] View audit log
- [ ] All pages load without errors

## 📝 Recent Improvements Made

1. **Multi-program support**: Added complete program templates for EE, CE, and SE
2. **Admin system**: Built comprehensive admin panel with role-based access control
3. **Audit logging**: All admin actions tracked with before/after data
4. **Pre-commit testing**: TypeScript and ESLint validation before commits
5. **Setup automation**: Admin account creation script
6. **Complete documentation**: DATABASE_SETUP.md, ADMIN_SYSTEM.md, TESTING_GUIDE.md
7. **Auto-create profile trigger**: Added database trigger to automatically create a profile when a user signs up
8. **Auth callback fix**: Updated to redirect to onboarding if user doesn't have a program
9. **Database schema**: All tables, indexes, and RLS policies are properly configured

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
