# Database Setup Guide

This guide walks you through setting up and deploying the Coursify database with all program templates and admin system.

## Prerequisites

- Supabase project created and linked
- Node.js 18+ installed
- Supabase CLI installed (`npm install -g supabase`)

## Step-by-Step Setup

### 1. Link Supabase Project

```bash
npx supabase link --project-ref your-project-ref
```

Your project ref can be found in your Supabase dashboard URL or by running:
```bash
cat supabase/.temp/project-ref
```

### 2. Run All Migrations

Push all migrations to your Supabase database:

```bash
npx supabase db push
```

This will run migrations in order:
- `001_initial_schema.sql` - Core tables (courses, plans, profiles)
- `002_seed_courses.sql` - Initial course data
- `003_add_active_courses.sql` - Active course tracking
- `004_add_prerequisites_system.sql` - Prerequisites and program templates (EE, CE basic)
- `005_update_ee_program_template.sql` - Original EE update (superseded by 006)
- `006_fix_ee_ce_se_programs.sql` - Complete EE, CE, SE templates ✅
- `009_add_admin_system.sql` - Admin system with audit logging ✅

### 3. Verify Migrations

Check that all tables exist:

```bash
npx supabase db diff
```

You should see no pending changes if migrations ran successfully.

### 4. Generate TypeScript Types

Update the TypeScript types to match your database:

```bash
npx supabase gen types typescript --linked > lib/supabase/types.ts
```

### 5. Sync Course Data

Populate courses from UW Open Data API:

```bash
npm run sync-courses
```

This fetches all active courses from recent terms and populates the `courses` table.

### 6. Create Your Admin Account

**Option A: Using the script (recommended)**

```bash
npm run setup-admin your.email@uwaterloo.ca super_admin
```

**Option B: Manual SQL**

In Supabase SQL Editor:

```sql
INSERT INTO public.admin_users (user_id, role, created_by)
SELECT id, 'super_admin', id
FROM auth.users
WHERE email = 'your.email@uwaterloo.ca';
```

### 7. Test the System

1. Start dev server: `npm run dev`
2. Sign in with your email
3. Navigate to `/admin` to access admin panel
4. Verify you can see programs, courses, users

### 8. Deploy to Production

**Run migrations on production:**

```bash
# Link to production project
npx supabase link --project-ref production-project-ref

# Push migrations
npx supabase db push

# Sync courses
npm run sync-courses
```

**Set up production admin:**

```bash
npm run setup-admin your.email@uwaterloo.ca super_admin
```

## Available Programs

After running migrations, you'll have these programs configured:

### Electrical Engineering (ECE_ELECTRICAL)
- **Degree**: BASc
- **Required Units**: 21.25
- **Terms**: 8 terms (1A-4B) fully defined
- **Electives**: 8 TEs, 3 CSEs, 2 NSEs, 1 Ethics, 1 Communication

### Computer Engineering (ECE_COMPUTER)
- **Degree**: BASc
- **Required Units**: 21.25
- **Terms**: 8 terms (1A-4B) fully defined
- **Electives**: 8 TEs, 3 CSEs, 2 NSEs, 1 Ethics, 1 Communication

### Software Engineering (SE)
- **Degree**: BSE
- **Required Units**: 21.50
- **Terms**: 8 terms (1A-4B) fully defined
- **Electives**: 4 TEs, 3 NSEs, 2 CSEs, 2 Free, 1 Communication, 1 Sustainability

## Troubleshooting

### Migration Fails

If a migration fails, check:
1. Database connection (is Supabase running?)
2. Existing data conflicts (does data already exist?)
3. RLS policies (are they blocking the migration?)

To reset and retry:
```bash
npx supabase db reset
npx supabase db push
```

### Admin Access Not Working

Check that:
1. User exists in `auth.users` (sign up first)
2. User is in `admin_users` table
3. RLS policies are enabled
4. Admin helper functions exist

Query to verify:
```sql
SELECT u.email, a.role, a.created_at
FROM auth.users u
JOIN public.admin_users a ON a.user_id = u.id;
```

### TypeScript Errors

After schema changes, always regenerate types:
```bash
npx supabase gen types typescript --linked > lib/supabase/types.ts
npm run test:pre-commit
```

## Next Steps

1. **Add more programs**: Create migrations for other majors (Mechanical, Mechatronics, etc.)
2. **Import course prerequisites**: Populate `course_prerequisites` table
3. **Test with real data**: Create sample plans and validate
4. **Deploy to production**: Push to Vercel and run production migrations

## Quick Reference

```bash
# Local development
npm run dev                    # Start dev server
npm run test:pre-commit        # Run tests before committing

# Database operations  
npx supabase db push           # Run migrations
npx supabase db reset          # Reset database (WARNING: deletes all data)
npm run sync-courses           # Sync courses from UW API

# Admin operations
npm run setup-admin <email>    # Create admin user
```
