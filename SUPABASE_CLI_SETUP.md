# Supabase CLI Setup Guide

This guide helps you set up Supabase CLI access for your Coursify project.

## Installation

1. **Install Supabase CLI globally** (recommended):
   ```bash
   npm install -g supabase
   ```

   Or install locally as a dev dependency (already added to package.json):
   ```bash
   npm install
   ```

## Linking Your Project

1. **Get your project reference ID**:
   - Go to your Supabase project dashboard
   - Settings → General → Reference ID
   - Or check your project URL: `https://[PROJECT_REF].supabase.co`

2. **Link your local project to Supabase**:
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   You'll be prompted to enter your database password (found in Settings → Database → Database password).

## Using Supabase CLI

### Push Migrations

Apply migrations to your remote database:
```bash
npx supabase db push
```

This will apply all migrations in `supabase/migrations/` that haven't been applied yet.

### Pull Database Schema

Generate TypeScript types from your database schema:
```bash
npx supabase gen types typescript --linked > lib/supabase/types.ts
```

**Note**: This will overwrite your existing types file. You may need to manually merge changes.

### View Migrations Status

Check which migrations have been applied:
```bash
npx supabase migration list
```

### Create New Migration

Create a new migration file:
```bash
npx supabase migration new migration_name
```

This creates a timestamped file in `supabase/migrations/`.

### Start Local Development

Run Supabase locally (requires Docker):
```bash
npx supabase start
```

This starts a local Supabase instance with:
- PostgreSQL database
- Supabase Studio (http://localhost:54323)
- API server (http://localhost:54321)

### Stop Local Development

Stop the local Supabase instance:
```bash
npx supabase stop
```

## Configuration

The `supabase/config.toml` file contains your local development configuration. This file is safe to commit to version control.

## Troubleshooting

### "Project not linked" error

Run `npx supabase link --project-ref YOUR_PROJECT_REF` again.

### "Database password" error

Find your database password in:
- Supabase Dashboard → Settings → Database → Database password
- Or reset it if needed

### Migration conflicts

If migrations conflict:
1. Check migration status: `npx supabase migration list`
2. Review applied migrations in Supabase Dashboard → Database → Migrations
3. Manually resolve conflicts or reset if needed

## Common Commands

```bash
# Link project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push

# Generate types
npx supabase gen types typescript --linked > lib/supabase/types.ts

# Start local dev
npx supabase start

# View status
npx supabase status
```

## Next Steps

1. ✅ Link your project: `npx supabase link --project-ref YOUR_PROJECT_REF`
2. ✅ Push migrations: `npx supabase db push`
3. ✅ Run course sync: `npm run sync-courses`
