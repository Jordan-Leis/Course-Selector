# Type Checking Guide

## Why Type Errors Happen on Vercel But Not Locally

Vercel's build environment runs **full type checking** during `next build`, which catches TypeScript errors that might not show up during `next dev`. The development server is more lenient and doesn't always catch all type inference issues.

## How to Check Types Locally

### Option 1: Run Type Check Script (Fastest)
```bash
npm run type-check
```

This runs TypeScript compiler in check-only mode (no emit) and will catch all type errors.

### Option 2: Run Full Build Locally
```bash
npm run build
```

This is what Vercel runs - it will catch the same errors. Takes longer but gives you the exact same check.

### Option 3: Use Your IDE
Most IDEs (VS Code, WebStorm, etc.) show TypeScript errors inline. Make sure your IDE is using the project's TypeScript version.

## Common Type Issues with Supabase

When using Supabase with TypeScript, partial selects (selecting only some fields) can cause type inference issues. Here's the pattern to fix them:

### Problem Pattern
```typescript
const { data } = await supabase
  .from('table')
  .select('id, name')  // Partial select
  .single()

// TypeScript infers as 'never' - can't access data.id
```

### Solution Pattern
```typescript
import { Database } from '@/lib/supabase/types'

// Define the partial type
type TablePartial = Pick<Database['public']['Tables']['table']['Row'], 'id' | 'name'>

// Type assert the result
const { data } = await supabase
  .from('table')
  .select('id, name')
  .single()

const typedData = data as TablePartial | null
// Now typedData.id works!
```

## Pre-Commit Checklist

Before pushing to GitHub/Vercel:

1. ✅ Run `npm run type-check` - catches type errors
2. ✅ Run `npm run lint` - catches linting issues  
3. ✅ Run `npm run build` - full production build check

## Quick Fix Script

Add this to your workflow:
```bash
# Check everything before pushing
npm run type-check && npm run lint && npm run build
```

This ensures you catch all issues before deployment!
