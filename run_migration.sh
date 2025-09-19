#!/bin/bash
# SIPOMA v2 - User Requests Table Migration Script
# Run this script to create the user_requests table for registration system

echo "SIPOMA v2 - User Requests Table Migration"
echo "=========================================="

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    supabase db push
else
    echo "Supabase CLI not found. Please run the following SQL manually in your Supabase SQL Editor:"
    echo ""
    cat create_user_requests_table.sql
    echo ""
    echo "Or copy the contents of create_user_requests_table.sql and paste it into your Supabase SQL Editor."
fi

echo "Migration completed successfully!"