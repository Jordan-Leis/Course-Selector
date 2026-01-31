# Course Sync Script

This script syncs courses from UW Open Data API and marks courses as active/inactive based on recent term offerings.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   Create a `.env.local` file (or add to existing one) with:
   ```bash
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   UW_API_KEY=your_uw_open_data_api_key  # Optional, if UW API requires auth
   ```

   You can find your Supabase credentials in your Supabase project dashboard:
   - Settings → API → Project URL
   - Settings → API → service_role key (secret)

3. **Run the migration first:**
   ```bash
   # Using Supabase CLI
   npx supabase db push
   
   # Or manually run the SQL in Supabase dashboard:
   # supabase/migrations/003_add_active_courses.sql
   ```

## Usage

Run the sync script:
```bash
npm run sync-courses
```

## How it works

1. **Fetches recent terms**: Checks the last 6 terms (approximately 2 years)
2. **Queries UW API**: For each term, fetches course data from UW Open Data API
3. **Tracks active courses**: Builds a set of courses that appeared in recent terms
4. **Updates database**:
   - Marks all courses as inactive initially
   - Sets `active=true` and `last_seen_term` for courses found in recent terms
   - Inserts new courses if they don't exist
   - Updates course metadata (title, description, units) from UW API

## UW Open Data API

The script uses UW's Open Data API v3. You may need to:
1. Register for an API key at https://openapi.data.uwaterloo.ca/
2. Set `UW_API_KEY` environment variable

If the API doesn't require authentication, the script will work without the key.

## Scheduling

You can run this script periodically (e.g., monthly) to keep your course list up to date:

- **Manual**: Run `npm run sync-courses` when needed
- **Cron**: Set up a cron job or scheduled task
- **CI/CD**: Add to your deployment pipeline
- **Vercel Cron**: Use Vercel's cron jobs feature

## Notes

- Courses are soft-deleted (marked inactive) rather than hard-deleted to preserve data in saved plans
- The script checks the last 6 terms by default (configurable in the script)
- Rate limiting: The script includes a 500ms delay between API calls to avoid rate limits
