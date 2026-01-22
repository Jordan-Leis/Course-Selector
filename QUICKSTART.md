# Quick Start Guide

## Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create `.env.local` in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://cyrbrwehzgmsvkzcjnzq.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_S6K1CFJKt6GD5sB4LuKnhQ_zVrmsHAj
   ```

3. **Set up database** (choose one method):

   **Option A: Using Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project (Coursify)
   - Navigate to SQL Editor
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_seed_courses.sql`

   **Option B: Using Supabase CLI**
   ```bash
   npm install -g supabase
   supabase link --project-ref cyrbrwehzgmsvkzcjnzq
   supabase db push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open** http://localhost:3000

## First Time Setup

1. Visit http://localhost:3000
2. Click "Get Started"
3. Enter your @uwaterloo.ca email
4. Check your email for the magic link
5. Click the magic link to sign in
6. Select your engineering program
7. Create your first plan!

## Testing the App

1. **Create a plan**: Click "+ New Plan" on the dashboard
2. **Add courses**: 
   - Select a term (1A, 1B, etc.)
   - Search for a course (e.g., "ECE 150" or "MATH 117")
   - Click a course to add it to the selected term
3. **Remove courses**: Click the "×" button on any course card
4. **Edit plan name**: Click the plan name in the plan builder to edit
5. **View warnings**: Warnings appear at the top if you have duplicate courses or unit overload

## Common Issues

### "No courses found" in search
- Make sure you've run the seed migration (`002_seed_courses.sql`)
- Try searching for "ECE" or "MATH" to see if courses exist

### Authentication not working
- Check that your Supabase project is active
- Verify environment variables are set correctly
- Make sure magic link emails are enabled in Supabase Auth settings

### Database errors
- Verify RLS policies are set up correctly
- Check that migrations ran successfully
- Ensure your user is authenticated

## Next Steps

- See `DEPLOYMENT.md` for production deployment instructions
- See `README.md` for full documentation
