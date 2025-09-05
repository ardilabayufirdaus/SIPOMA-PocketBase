<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SIPOMA - Production Management Information System

This contains everything you need to run your SIPOMA app locally.

## Latest Updates 🆕

### Profile Photo Upload Feature ✨

- Users can now upload and change their profile photos
- Photos are stored securely in Supabase Storage
- File validation (5MB max, image formats only)
- Real-time preview and loading states
- Available in Settings > Edit Profile

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set up environment variables in [.env](.env):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   ```
3. Run the app:
   `npm run dev`

## Setup Supabase Storage

For profile photo uploads to work, you need to create the storage bucket:

1. Go to your Supabase Dashboard
2. Navigate to Storage section
3. Run the SQL commands from `supabase-setup.sql`
4. Or use the setup script: `setup-storage.js`
