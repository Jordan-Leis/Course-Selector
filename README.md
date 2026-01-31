# Coursify - UW Engineering Course Planner

A production MVP for planning University of Waterloo Engineering courses term by term.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth + Postgres + RLS)
- **Deployment**: Vercel

## Setup

### Prerequisites

- Node.js 18+ installed
- Supabase project created
- GitHub account
- Vercel account

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set up database**:
   - Run the migrations in `supabase/migrations/` using Supabase CLI or SQL Editor
   - Or manually execute:
     - `001_initial_schema.sql` - Creates all tables and RLS policies
     - `002_seed_courses.sql` - Seeds initial course data
     - `003_add_active_courses.sql` - Adds active/last_seen_term columns

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

### Using Supabase CLI (Recommended)

1. Install Supabase CLI: `npm install -g supabase` (or use local: `npm install`)
2. Link your project: `npx supabase link --project-ref your-project-ref`
3. Run migrations: `npx supabase db push`
4. Generate types: `npx supabase gen types typescript --linked > lib/supabase/types.ts`
5. Sync courses: `npm run sync-courses`
6. Create admin user: `npm run setup-admin your.email@uwaterloo.ca`

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed setup instructions and troubleshooting.

See [SUPABASE_CLI_SETUP.md](./SUPABASE_CLI_SETUP.md) for detailed CLI setup instructions.

### Manual Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL files in `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_seed_courses.sql`
   - `003_add_active_courses.sql`

## Course Sync

Sync courses from UW Open Data API to keep your course list up-to-date:

```bash
npm run sync-courses
```

This script:
- Fetches courses from UW Open Data API for recent terms (last 6 terms ≈ 2 years)
- Marks courses as active/inactive based on recent offerings
- Updates course metadata (title, description, units)
- Inserts new courses automatically

**Setup**: Add to your `.env.local`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UW_API_KEY=your_uw_api_key  # Optional, if UW API requires auth
```

See [scripts/README.md](./scripts/README.md) for detailed sync script documentation.

## Features

- ✅ UW email gated sign-in (magic link authentication)
- ✅ Course catalog search (only shows active courses)
- ✅ Term-by-term plan builder (1A → 4B)
- ✅ Save and load multiple plans
- ✅ Prerequisite validation engine
- ✅ Duplicate course warnings
- ✅ Unit overload warnings (>6 units per term)
- ✅ Course sync from UW Open Data API
- ✅ Automatic inactive course filtering
- ✅ **Program Templates**: EE, CE, SE with full requirements
- ✅ **Admin System**: Role-based access control with audit logging
- ✅ **Pre-commit Testing**: TypeScript + ESLint validation

## Admin System

Coursify includes a comprehensive admin panel for managing the platform. See [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md) for full documentation.

**Admin Features**:
- Program template management
- Course catalog editing
- User management and analytics
- Plan validation tools
- Complete audit log of all changes
- Role-based permissions (super admin, program editor, course editor, viewer)

**Setup Admin Account**:
```bash
npm run setup-admin your.email@uwaterloo.ca super_admin
```

**Access**: Navigate to `/admin` after signing in as an admin user.

## Supported Programs

The following programs have complete term-by-term requirements:

| Program | Code | Degree | Units | Terms |
|---------|------|--------|-------|-------|
| Electrical Engineering | ECE_ELECTRICAL | BASc | 21.25 | 8 terms |
| Computer Engineering | ECE_COMPUTER | BASc | 21.25 | 8 terms |
| Software Engineering | SE | BSE | 21.50 | 8 terms |

Each program includes:
- Required courses for all 8 terms (1A-4B)
- Detailed elective requirements (TEs, CSEs, NSEs, etc.)
- Program-specific constraints and rules

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── onboarding/        # Program selection
│   ├── dashboard/         # Plans list
│   └── plan/[id]/         # Plan builder
├── components/            # React components
│   ├── CourseSearch.tsx
│   ├── CourseCard.tsx
│   └── TermColumn.tsx
├── lib/
│   ├── supabase/         # Supabase client utilities
│   └── utils.ts          # Utility functions
├── scripts/
│   ├── sync-courses.ts   # Course sync script from UW API
│   └── README.md         # Sync script documentation
└── supabase/
    ├── config.toml       # Supabase CLI configuration
    └── migrations/       # Database migrations
```

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Environment Variables

Make sure to set these in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## License

MIT
