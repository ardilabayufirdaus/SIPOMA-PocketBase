#!/bin/bash

# SIPOMA v2 Database Setup Script
# This script helps set up the database schema for SIPOMA v2

echo "🚀 SIPOMA v2 Database Setup"
echo "============================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Please install it first: npm install -g supabase"
    exit 1
fi

echo "📋 This script will help you set up the SIPOMA v2 database."
echo ""
echo "You have two options:"
echo "1. Use Supabase CLI (recommended for local development)"
echo "2. Manual setup via Supabase Dashboard"
echo ""
echo "Choose your preferred method:"
echo "1) Supabase CLI"
echo "2) Manual Dashboard"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🔧 Setting up with Supabase CLI..."
        echo ""
        echo "Make sure you're logged in to Supabase:"
        echo "supabase login"
        echo ""
        echo "Then link your project:"
        echo "supabase link --project-ref YOUR_PROJECT_REF"
        echo ""
        echo "Finally, push the schema:"
        echo "supabase db push"
        echo ""
        echo "After that, run the seed data:"
        echo "supabase db reset"
        ;;
    2)
        echo "🌐 Manual Setup via Supabase Dashboard"
        echo "======================================"
        echo ""
        echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
        echo "2. Select your project"
        echo "3. Go to SQL Editor"
        echo "4. Copy and paste the following SQL:"
        echo ""
        echo "📄 DATABASE SCHEMA SQL:"
        echo "----------------------"
        cat database_schema.sql
        echo ""
        echo "📄 DEFAULT ADMIN SQL:"
        echo "---------------------"
        cat create_default_admin.sql
        echo ""
        echo "5. Execute both SQL scripts in order"
        echo "6. Verify tables are created in Table Editor"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Database setup instructions provided!"
echo ""
echo "Next steps after database setup:"
echo "1. Generate TypeScript types: npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/supabase.ts"
echo "2. Test the application: npm run dev"
echo "3. Try the permission management feature"