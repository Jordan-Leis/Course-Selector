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

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

### Using Supabase CLI

1. Install Supabase CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref your-project-ref`
3. Run migrations: `supabase db push`

### Manual Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL files in `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_seed_courses.sql`

## Features

- ✅ UW email gated sign-in (magic link authentication)
- ✅ Course catalog search
- ✅ Term-by-term plan builder (1A → 4B)
- ✅ Save and load multiple plans
- ✅ Duplicate course warnings
- ✅ Unit overload warnings (>6 units per term)

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
└── supabase/
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
