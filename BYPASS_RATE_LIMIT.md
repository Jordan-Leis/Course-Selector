# How to Get Into the App When Rate Limited

## ✅ Password Login Added!

The login page now has a **password login option** for development/testing. Here's how to use it:

### Step 1: Create a User in Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **Coursify**
3. Go to **Authentication** → **Users**
4. Click **"Add User"** → **"Create new user"**
5. Enter:
   - **Email**: `yourname@uwaterloo.ca` (must be @uwaterloo.ca)
   - **Password**: Set any password you want (e.g., `test123`)
   - **Auto Confirm User**: ✅ **Check this box** (very important!)
6. Click **"Create User"**

### Step 2: Use Password Login

1. Go to your login page (local or Vercel)
2. Enter the email you just created
3. Click **"Use password login (for testing)"** link
4. Enter the password you set
5. Click **"Sign In"**
6. You're in! 🎉

## Other Options

### Option 1: Use a Different Email Address
- Use a **different** `@uwaterloo.ca` email address
- Each email has its own rate limit
- Then use magic link login

### Option 2: Check Your Email Inbox
- Look for **previous magic links** - they might still be valid!
- Check spam/junk folder
- Magic links don't expire immediately

### Option 3: Wait for Rate Limit to Reset
- Wait **24 hours** from your first email
- Then try the magic link again

## Notes

- Password login is great for **development/testing**
- For production, magic links are more secure
- The password login option is visible on the login page - just click the link to switch modes
