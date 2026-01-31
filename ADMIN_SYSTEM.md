# Admin System Documentation

## Overview

The Coursify admin system provides a comprehensive interface for managing program templates, courses, users, and system validation. Access is role-based with audit logging for all administrative actions.

## Admin Roles

### Super Admin
- Full system access
- Can create/edit/delete anything
- Can manage other admin users
- Access to all tools and reports

### Program Editor
- Can view and edit program templates
- Can modify course requirements and electives
- Cannot manage users or courses

### Course Editor
- Can view and edit course data
- Can update prerequisites and course information
- Cannot manage programs or users

### Viewer
- Read-only access to admin interface
- Can view all data but cannot make changes
- Useful for support staff

## Getting Started

### 1. Run Migrations

Run the admin system migration:

```bash
npx supabase db push
```

This creates:
- `admin_users` table
- `audit_log` table
- Admin helper functions (`is_admin()`, `get_admin_role()`, etc.)
- RLS policies for admin access
- Audit triggers on key tables

### 2. Create Your Admin Account

After signing in as a regular user, manually add yourself as a super admin in the Supabase SQL editor:

```sql
INSERT INTO public.admin_users (user_id, role, created_by)
SELECT id, 'super_admin', id
FROM auth.users
WHERE email = 'your.email@uwaterloo.ca';
```

### 3. Access Admin Panel

Navigate to `/admin` to access the admin dashboard.

## Admin Features

### Program Management (`/admin/programs`)
- View all program templates
- See course counts and elective requirements
- Click to view detailed program structure
- Shows term-by-term requirements

### Course Management (`/admin/courses`)
- Browse full course catalog
- View prerequisites for each course
- See course metadata (units, title, description)
- Sync courses using `npm run sync-courses`

### User Management (`/admin/users`)
- View all registered users
- See user programs and plan counts
- Track registration dates
- Monitor active vs inactive users

### Validation Tools (`/admin/validation`)
- View recent student plans
- Access plan validation reports
- Test prerequisite checking
- Monitor validation errors

### Audit Log (`/admin/audit`)
- Complete history of admin actions
- Filter by table, user, or date
- View before/after data for changes
- Immutable audit trail

## Architecture

### Database Schema

```
admin_users
├── id (UUID, primary key)
├── user_id (FK to auth.users)
├── role (enum: super_admin, program_editor, course_editor, viewer)
├── created_at
├── created_by (FK to auth.users)
└── updated_at

audit_log
├── id (UUID, primary key)
├── admin_user_id (FK to admin_users)
├── action_type (enum: insert, update, delete)
├── table_name
├── record_id
├── old_data (JSONB)
├── new_data (JSONB)
├── description
└── created_at
```

### Helper Functions

- `public.is_admin()` - Returns true if current user is admin
- `public.get_admin_role()` - Returns current user's admin role
- `public.is_super_admin()` - Returns true if user is super admin

### File Structure

```
app/admin/
├── layout.tsx                  # Admin layout with navigation
├── page.tsx                    # Admin dashboard
├── programs/
│   ├── page.tsx               # Programs list
│   └── [id]/page.tsx          # Program details
├── courses/page.tsx           # Course management
├── users/page.tsx             # User management
├── validation/page.tsx        # Validation tools
└── audit/page.tsx             # Audit log viewer

lib/admin/
├── auth.ts                    # Admin auth helpers
└── audit.ts                   # Audit logging utilities
```

## Security

### Row Level Security (RLS)
- All admin tables have RLS enabled
- Admin functions use `SECURITY DEFINER` for safe privilege escalation
- Regular users cannot access admin tables
- Admin access checked via `is_admin()` function

### Audit Logging
- All changes to programs, courses, and admin users are logged
- Stores both old and new data in JSONB format
- Immutable log (no updates or deletes allowed)
- Automatic triggers on key tables

## Usage Examples

### Check Admin Status (Server)
```typescript
import { isAdmin, getAdminRole } from '@/lib/admin/auth'

const admin = await isAdmin()
const role = await getAdminRole()
```

### Require Permission (Server)
```typescript
import { requirePermission } from '@/lib/admin/auth'

export default async function AdminPage() {
  // Throws error if user doesn't have permission
  await requirePermission(['super_admin', 'program_editor'])
  
  // ... rest of component
}
```

### Log Admin Action
```typescript
import { logAuditAction } from '@/lib/admin/audit'

await logAuditAction(
  'update',
  'program_templates',
  programId,
  'Updated EE program requirements',
  oldProgram,
  newProgram
)
```

## Testing

Before committing any changes, always run:

```bash
npm run test:pre-commit
```

This runs:
- TypeScript type checking (`tsc --noEmit`)
- ESLint with zero warnings allowed
- Ensures code quality and catches errors

## Deployment Notes

1. **Run migrations** on production Supabase instance
2. **Create admin accounts** for authorized users
3. **Verify RLS policies** are working correctly
4. **Test audit logging** by making a change

## Future Enhancements

- Visual program template editor (drag-and-drop courses)
- Course import from CSV/API
- Batch plan validation
- User impersonation for support
- Export reports (users, plans, validation errors)
- Rollback functionality for audit log entries
