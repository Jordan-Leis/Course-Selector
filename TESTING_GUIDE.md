# End-to-End Testing Guide

This guide helps you test the complete Coursify system to ensure all features work correctly.

## Pre-Testing Setup

### 1. Ensure Database is Set Up
```bash
npx supabase db push
npm run sync-courses
npm run setup-admin your.email@uwaterloo.ca
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to `http://localhost:3000`

## Test Scenarios

### Test 1: User Authentication & Onboarding

**Steps**:
1. Navigate to `/login`
2. Enter your UWaterloo email
3. Check email for magic link
4. Click magic link to authenticate
5. Should redirect to `/onboarding`
6. Select a program (e.g., "Computer Engineering")
7. Click "Continue to Dashboard"
8. Should redirect to `/dashboard`

**Expected Results**:
- ✅ Email sent successfully
- ✅ Magic link authentication works
- ✅ Onboarding flow completed
- ✅ Dashboard displays with no plans

### Test 2: Create Plan with Program Template

**Steps**:
1. On dashboard, click "New Plan"
2. Enter plan name: "EE Test Plan"
3. Select program: "Electrical Engineering"
4. Click "Create Plan"
5. Should redirect to plan builder

**Expected Results**:
- ✅ Plan created successfully
- ✅ All 8 terms (1A-4B) displayed
- ✅ Required courses pre-populated in each term
- ✅ Courses match EE curriculum from migration 006

**Verify EE Required Courses**:
- 1A: ECE 105, ECE 150, ECE 190, ECE 198, MATH 115, MATH 117
- 1B: ECE 106, ECE 108, ECE 124, ECE 140, ECE 192, MATH 119
- 2A: ECE 109, ECE 204, ECE 222, ECE 240, ECE 250, MATH 211
- 2B: ECE 203, ECE 207, ECE 231, ECE 260, ECE 298, MATH 212
- 3A: ECE 318, ECE 340, ECE 375, ECE 380
- 3B: ECE 307
- 4A: ECE 498A
- 4B: ECE 498B

### Test 3: Course Search and Addition

**Steps**:
1. Click on 1A term to select it
2. Search for "ECE 100" in search bar
3. Should show course results
4. Try to add ECE 106 to 1A term (should warn - already exists or prerequisites)
5. Click on 2A term
6. Search for "ECE 300"
7. Add an elective course

**Expected Results**:
- ✅ Course search returns relevant results
- ✅ Can select terms
- ✅ Validation warnings appear for prerequisite violations
- ✅ Can add courses to terms
- ✅ Duplicate course warnings appear

### Test 4: Prerequisite Validation

**Steps**:
1. Create a blank plan (select "No program")
2. Try to add ECE 240 (Electronic Circuits 1) to 1A term
3. Should show prerequisite error
4. Add ECE 140 (Linear Circuits) to 1A term
5. Try to add ECE 240 to 2A term
6. Should succeed or show reduced warning

**Expected Results**:
- ✅ Prerequisites checked automatically
- ✅ Error shown for missing prerequisites
- ✅ Prerequisites satisfied after adding required courses
- ✅ Validation messages are clear and helpful

### Test 5: Create Plans for Each Program

**Test EE Plan**:
1. Create plan with Electrical Engineering template
2. Verify all required courses populated
3. Check 8 TE electives needed
4. Check 3 CSE, 2 NSE, 1 Ethics requirements shown

**Test CE Plan**:
1. Create plan with Computer Engineering template
2. Verify courses match CE curriculum
3. Note differences: ECE 208, ECE 224, ECE 252, ECE 327, ECE 350
4. Check same elective structure as EE

**Test SE Plan**:
1. Create plan with Software Engineering template
2. Verify CS/SE courses (not ECE)
3. Check: CS 137, CS 138, CS 240, CS 241, SE courses
4. Check 4 TE, 3 NSE, 2 CSE requirements

**Expected Results**:
- ✅ All three program templates work correctly
- ✅ Required courses populated accurately
- ✅ Elective requirements displayed correctly
- ✅ No TypeScript errors in console

### Test 6: Admin Access

**Steps**:
1. Ensure you've run `npm run setup-admin your.email@uwaterloo.ca`
2. Navigate to `/admin`
3. Should see admin dashboard
4. Check stats (Programs: 3, Courses: X, Users: 1+, Plans: Y)
5. Click "Programs" in nav
6. Should see all 3 programs (EE, CE, SE)
7. Click on "Electrical Engineering"
8. Should see complete program details

**Expected Results**:
- ✅ Admin dashboard loads successfully
- ✅ Stats display correctly
- ✅ Program list shows all templates
- ✅ Program details show all terms and electives
- ✅ Navigation works between admin pages

### Test 7: Admin Pages Navigation

**Steps**:
1. From admin dashboard, click each nav item:
   - Dashboard → shows stats and recent activity
   - Programs → shows EE, CE, SE templates
   - Courses → shows course catalog
   - Users → shows registered users
   - Validation → shows recent plans
   - Audit Log → shows admin actions
2. Return to app: click "Back to App"
3. Should redirect to `/dashboard`

**Expected Results**:
- ✅ All admin pages load without errors
- ✅ Navigation works smoothly
- ✅ Data displays correctly on each page
- ✅ Can return to regular app

### Test 8: Audit Logging

**Steps**:
1. Go to admin dashboard
2. Click "Audit Log"
3. Should see entry for creating your admin account
4. Check timestamps and action types
5. Verify immutable (no edit/delete buttons)

**Expected Results**:
- ✅ Audit log shows admin user creation
- ✅ Entries have proper timestamps
- ✅ Action types displayed (insert/update/delete)
- ✅ Read-only interface (no modifications)

### Test 9: TypeScript & Linting

**Steps**:
```bash
npm run test:pre-commit
```

**Expected Results**:
- ✅ TypeScript compilation succeeds
- ✅ No type errors
- ✅ ESLint passes with 0 warnings
- ✅ Exit code 0

### Test 10: Course Search Performance

**Steps**:
1. Open a plan
2. Search for "ECE" - should return many results quickly
3. Search for "MATH 1" - should filter correctly
4. Search for "Software Engineering" - should find SE courses
5. Try various search terms

**Expected Results**:
- ✅ Search is fast (<1 second)
- ✅ Results are relevant
- ✅ Active courses only (no old/inactive courses)
- ✅ Course details display correctly

## Checklist for Full System Test

Use this checklist before deploying or after major changes:

- [ ] User authentication (sign up, login, logout)
- [ ] Onboarding flow (program selection)
- [ ] Dashboard (create, view, delete plans)
- [ ] Plan builder (add courses, remove courses, rename)
- [ ] Course search (search, filter, display)
- [ ] Prerequisite validation (warnings, errors)
- [ ] EE program template (all terms, electives)
- [ ] CE program template (all terms, electives)
- [ ] SE program template (all terms, electives)
- [ ] Admin dashboard (stats, activity)
- [ ] Admin programs page (list, view details)
- [ ] Admin courses page (catalog browsing)
- [ ] Admin users page (user list)
- [ ] Admin validation page (plan list)
- [ ] Admin audit log (change history)
- [ ] TypeScript compilation passes
- [ ] ESLint passes with 0 warnings
- [ ] No console errors in browser

## Performance Benchmarks

Target performance for key operations:

| Operation | Target | Notes |
|-----------|--------|-------|
| Page load | <2s | Any page in app |
| Course search | <500ms | Typing to results |
| Add course to plan | <1s | Including validation |
| Load plan | <2s | With all courses |
| Admin dashboard | <2s | With stats |

## Known Issues / Limitations

1. **Program template editing**: Currently requires SQL migrations (UI editor planned)
2. **Course editing**: Currently requires sync script or SQL (UI editor planned)
3. **Bulk validation**: Not yet implemented (planned)
4. **User impersonation**: Not yet implemented (planned for support)

## Testing in Production

After deploying to production:

1. **Run migrations**: `npx supabase db push` (linked to production)
2. **Sync courses**: `npm run sync-courses` (with production env vars)
3. **Create admin**: `npm run setup-admin` (with production env vars)
4. **Test all flows**: Follow this guide on production URL
5. **Monitor logs**: Check Vercel logs for errors
6. **Check Supabase**: Verify RLS policies work correctly

## Troubleshooting

### Can't Access Admin Panel
- Check: User email in `admin_users` table
- Run: `npm run setup-admin your.email@uwaterloo.ca`
- Verify: RLS policies enabled on `admin_users`

### Plans Not Loading
- Check: Supabase environment variables set
- Verify: RLS policies on `plans` table
- Test: Run query in Supabase SQL editor

### Courses Not Appearing in Search
- Check: `active = true` in courses table
- Run: `npm run sync-courses` to refresh
- Verify: Course data exists

### TypeScript Errors
- Run: `npm run test:pre-commit`
- Check: All files have proper types
- Generate types: `npx supabase gen types typescript --linked > lib/supabase/types.ts`

## Next Steps

After completing E2E tests:

1. Deploy to production (Vercel)
2. Run production migrations
3. Set up production admin account
4. Test in production environment
5. Monitor for errors in first 24 hours
6. Gather user feedback
7. Plan next features (Mechatronics, more programs, etc.)
