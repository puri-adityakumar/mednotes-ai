# Supabase Database Setup

## Prerequisites

1. Create a Supabase project at https://app.supabase.com
2. Get your project URL and anon key from Project Settings > API

## Environment Variables

Create a `.env.local` file in the `app` directory with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Migration

Run the SQL migration file in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_create_profiles_table.sql`
4. Execute the SQL

This will create:
- `profiles` table with role-based access (patient/doctor)
- Row Level Security (RLS) policies
- Trigger to automatically create profile on user signup

## Manual Setup (Alternative)

If you prefer to set up manually, you can run the SQL commands from `supabase/migrations/001_create_profiles_table.sql` directly in the Supabase SQL Editor.

