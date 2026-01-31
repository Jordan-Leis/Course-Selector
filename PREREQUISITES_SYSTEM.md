# Course Prerequisites and Program Requirements System

## Overview

This system implements comprehensive course prerequisite validation and program requirement tracking for the Coursify academic planner. It pulls prerequisite data directly from the UW OpenAPI and validates course selections in real-time.

## Features Implemented

### 1. Database Schema (Migration 004)

**New Tables:**
- `course_prerequisites` - Structured prerequisite data for each course
- `program_templates` - Program-specific requirements (ECE Computer, ECE Electrical, etc.)
- `user_programs` - Links users to their selected program

**Course Table Updates:**
- `prerequisites_raw` - Original prerequisite text from API
- `has_prerequisites` - Boolean flag for quick filtering

### 2. Prerequisite Parser (`lib/prerequisite-parser.ts`)

Parses natural language prerequisite strings into structured data:

**Supported Patterns:**
- Course prerequisites: "Prereq: ECE 250"
- Multiple courses: "Prereq: One of ECE 250, CS 240"
- Antirequisites: "Antireq: SE 463"
- Corequisites: "Coreq: ECE 205"
- Level requirements: "Level at least 2A Computer Engineering"
- Complex logic: AND/OR operators

**Functions:**
- `parsePrerequisites()` - Parse text into structured data
- `isPrerequisiteSatisfied()` - Check if prerequisite is met
- `getPrerequisiteDescription()` - Human-readable description

### 3. Validation Engine (`lib/validation-engine.ts`)

Real-time validation when adding courses:

**Checks Performed:**
- **Prerequisites** - Required courses must be in earlier terms
- **Antirequisites** - Conflicting courses cannot both be in plan
- **Corequisites** - Must be taken same term or earlier
- **Level requirements** - Student must be at appropriate level
- **Duplicates** - Course cannot appear in multiple terms
- **Overload** - Warning if term has >3.0 units

**Functions:**
- `validateCourseAddition()` - Validate before adding course
- `validateEntirePlan()` - Validate complete plan

### 4. Course Sync Integration

The sync script (`scripts/sync-courses.ts`) now:
- Fetches `requirementsDescription` from UW API
- Parses prerequisites automatically
- Stores structured data in `course_prerequisites` table
- Updates `has_prerequisites` flag on courses

### 5. UI Integration

**Plan Builder (`app/plan/[id]/page.tsx`):**
- Real-time validation when adding courses
- Error alerts prevent adding courses with unmet prerequisites
- Warning alerts for duplicates, overload, etc.
- Comprehensive warnings panel showing all issues

**Course Cards (`components/CourseCard.tsx`):**
- "Prereqs" button shows prerequisite details
- Expandable view of all requirements
- Color-coded by type (course, level, antireq)

**Course Search (`components/CourseSearch.tsx`):**
- "Has Prereqs" badge on courses with requirements
- Preview of top 2 prerequisites in search results
- Full prerequisite list on hover/expand

### 6. Program Templates

**Seeded Programs:**
- ECE Computer Engineering
- ECE Electrical Engineering

**Template Structure:**
```json
{
  "program_code": "ECE_COMPUTER",
  "required_courses": {
    "1A": ["ECE 105", "ECE 150", ...],
    "1B": ["ECE 106", "ECE 108", ...]
  },
  "elective_requirements": {
    "CSE": {"required": 4, "description": "Complementary Studies Electives"},
    "TE": {"required": 5, "description": "Technical Electives"}
  }
}
```

**Utility Functions (`lib/program-templates.ts`):**
- `getProgramTemplates()` - Get all available programs
- `getUserProgram()` - Get user's selected program
- `setUserProgram()` - Set user's program
- `validateProgramRequirements()` - Check plan against program requirements

## Usage

### Running the Migration

Apply the new database schema:

```bash
# Using Supabase SQL Editor (recommended)
# Copy contents of supabase/migrations/004_add_prerequisites_system.sql
# Paste and execute in SQL Editor

# OR using Supabase CLI
npx supabase db push
```

### Syncing Course Data

Sync courses with prerequisite data:

```bash
npm run sync-courses
```

This will:
1. Fetch courses from UW API (last 3 terms)
2. Parse all prerequisite strings
3. Store structured data in database
4. Update course metadata

**Note:** Full sync takes 10-15 minutes for ~24,000 courses. Run during off-hours.

### Using Validation in Code

```typescript
import { validateCourseAddition } from '@/lib/validation-engine'

// Before adding a course
const result = await validateCourseAddition(
  planId,
  termIndex,
  course
)

if (!result.isValid) {
  // Show errors to user
  result.errors.forEach(error => {
    console.log(error.message)
  })
}
```

### Parsing Prerequisites

```typescript
import { parsePrerequisites } from '@/lib/prerequisite-parser'

const prereqData = parsePrerequisites(
  "Prereq: One of ECE 250, CS 240. Level at least 2A. Antireq: SE 463"
)

// Returns:
{
  prerequisites: [
    {
      type: 'course',
      operator: 'ONE_OF',
      courses: ['ECE 250', 'CS 240'],
      rawText: '...'
    },
    {
      type: 'level',
      level: '2A',
      rawText: '...'
    },
    {
      type: 'antirequisite',
      courses: ['SE 463'],
      rawText: '...'
    }
  ],
  hasPrerequisites: true,
  rawText: '...'
}
```

## Data Flow

```
UW OpenAPI
    ↓ (fetch)
Sync Script
    ↓ (parse)
Prerequisite Parser
    ↓ (store)
Supabase Database
    ↓ (query)
Frontend Components
    ↓ (validate)
Validation Engine
    ↓ (display)
User Interface
```

## Validation Severity Levels

**Error (Red):** Prevents action
- Missing prerequisites
- Antirequisite conflicts

**Warning (Yellow):** Allows action with confirmation
- Duplicate courses
- Term overload (>3.0 units)
- Corequisite warnings
- Level requirement warnings

**Info (Blue):** Informational only
- Course has prerequisites (display only)

## Future Enhancements

### Potential Additions:
1. **Smart recommendations** - Suggest courses based on completed prerequisites
2. **Program progress tracking** - Show % completion of program requirements
3. **Elective tracking** - Track CSE/TE requirements
4. **Prerequisite chains** - Visual graph of course dependencies
5. **Alternative prerequisites** - Handle "Either X or Y" patterns better
6. **Co-op term handling** - Special validation for co-op terms
7. **Transfer credits** - Mark external courses as completed
8. **What-if analysis** - Test different course selections

### API Enhancements:
- Cache frequently accessed prerequisite data
- Batch validation for performance
- Background validation on plan load
- Prerequisite change notifications

## Testing

### Manual Testing Checklist:

1. **Apply Migration**
   - [ ] Run migration 004
   - [ ] Verify tables created
   - [ ] Check program templates seeded

2. **Sync Courses**
   - [ ] Run sync script
   - [ ] Verify prerequisites parsed
   - [ ] Check `has_prerequisites` flags

3. **Add Course with Prerequisites**
   - [ ] Try adding ECE 250 to 1A (should fail - needs 2A level)
   - [ ] Add ECE 250 to 2A (should succeed)
   - [ ] Verify warning messages

4. **Add Duplicate Course**
   - [ ] Add same course to two terms
   - [ ] Verify duplicate warning

5. **Add Antirequisite**
   - [ ] Add ECE 451 and SE 463 (antirequisites)
   - [ ] Verify error message

6. **View Prerequisites**
   - [ ] Search for course with prerequisites
   - [ ] Click "Prereqs" button on course card
   - [ ] Verify prerequisite details display

## Troubleshooting

### Migration Issues

**Problem:** Migration fails on `user_programs` table

**Solution:** Ensure auth schema is available and users table exists

### Sync Issues

**Problem:** Sync marks all courses inactive

**Solution:** Check UW API key is valid and terms are correct (1251, 1249, etc.)

### Validation Not Working

**Problem:** Courses added without validation

**Solution:** 
1. Check migration 004 is applied
2. Verify `has_prerequisites` column exists
3. Check browser console for errors

### Prerequisites Not Showing

**Problem:** Prerequisite info not displaying in UI

**Solution:**
1. Verify sync completed successfully
2. Check `prerequisites_raw` column has data
3. Ensure `has_prerequisites` is true

## Performance Notes

- **Sync time:** 10-15 minutes for full database (24,000 courses)
- **Validation time:** <100ms per course (includes DB queries)
- **Parse time:** <1ms per prerequisite string
- **UI impact:** Minimal, validation runs async

## Database Indexes

The migration creates indexes on:
- `courses.has_prerequisites` - Fast filtering
- `course_prerequisites.course_id` - Fast lookup
- `course_prerequisites.prerequisite_type` - Type filtering
- `program_templates.program_code` - Program lookup

These ensure validation queries remain fast even with thousands of courses.

## Security

- Prerequisites are read-only for users
- Program templates are read-only for users
- User program selections use RLS policies
- Only service role can write prerequisite data (via sync)

## Support

For issues or questions about the prerequisite system:
1. Check migration is applied: Query `course_prerequisites` table
2. Verify sync ran: Check `prerequisites_raw` column populated
3. Test validation: Check browser console for errors
4. Review this README for usage patterns
