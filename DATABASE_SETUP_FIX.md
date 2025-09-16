# 🚨 DATABASE SETUP REQUIRED

## Issue: Permission Management Not Working

You're seeing errors like:

- `Failed to load resource: the server responded with a status of 406`
- `ERR_NETWORK_CHANGED`
- Permission table queries failing

## Root Cause

The **permissions table** doesn't exist in your Supabase database.

## Quick Fix (2 minutes)

### Option 1: Run SQL in Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `sipoma-versi-2`
3. Go to **SQL Editor**
4. Copy and paste the entire content of `quick_db_setup.sql`
5. Click **Run**

### Option 2: Use the Setup Script

```bash
# Make script executable
chmod +x setup_database.sh

# Run the setup script
./setup_database.sh
```

## What Gets Created

✅ **users** table - User management
✅ **permissions** table - Permission definitions
✅ **user_permissions** table - User-permission relationships
✅ **plant_units** table - Plant operation units
✅ **Default admin user** - Username: `admin`, Password: `admin123`
✅ **Default permissions** - All modules with ADMIN access

## Test After Setup

1. Restart your development server:

   ```bash
   npm run dev
   ```

2. Go to User Management → User Roles

3. Try editing permissions - should work now! 🎉

## Generate TypeScript Types (Optional)

After database setup, generate proper types:

```bash
npx supabase gen types typescript --project-id ectjrbguwmlkqfyeyfvo --schema public > types/supabase.ts
```

## Troubleshooting

- **Still getting 406 errors?** Check if tables were created in Supabase Table Editor
- **Network errors?** Check your internet connection and Supabase status
- **Permission denied?** Make sure you're using the correct Supabase project

---

**Need help?** The database setup should take less than 2 minutes using Option 1!</content>
<parameter name="filePath">d:\Repository Github\sipoma-ver-2\sipoma-versi-2\DATABASE_SETUP_FIX.md
