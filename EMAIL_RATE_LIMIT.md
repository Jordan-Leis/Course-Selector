# Email Rate Limit Guide

## What's Happening

Supabase has rate limits on magic link emails to prevent spam. You're hitting these limits because you've been testing the login flow multiple times.

## Supabase Rate Limits

**Free Tier:**
- **3 emails per hour** per email address
- **4 emails per day** per email address

**Pro Tier:**
- Higher limits (check your Supabase plan)

## Solutions

### Option 1: Wait for Rate Limit to Reset (Easiest)
- Wait **1 hour** for the hourly limit to reset
- Or wait **24 hours** for the daily limit to reset
- Check your email inbox - you might have received a magic link already!

### Option 2: Use a Different Email Address
- Try a different `@uwaterloo.ca` email address for testing
- Each email address has its own rate limit

### Option 3: Check Your Email Inbox
- Look for previous magic links - they're still valid!
- Magic links don't expire immediately
- Check spam/junk folder too

### Option 4: Increase Rate Limits (Pro/Paid Plans)
1. Go to Supabase Dashboard → Settings → Auth
2. Check your rate limit settings
3. Upgrade plan if needed for higher limits

### Option 5: Use Supabase Dashboard to Create Test User
For development/testing, you can create users directly in Supabase:
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email and set a password
4. Use password login instead of magic link (if you implement it)

## Better Error Messages

The login page now shows a helpful message when rate limited:
- "Too many emails sent. Please wait a few minutes before trying again, or check your email inbox for a previous magic link."

## For Production

Once deployed, users will naturally spread out their login attempts, so rate limits are less likely to be hit. The current limits are reasonable for production use.

## Testing Tips

1. **Use different email addresses** for each test
2. **Check your inbox** before requesting a new link
3. **Wait between tests** if using the same email
4. **Use Supabase Dashboard** to manually create test users during development
