# Database Schema Notes

## Key Changes from Original Schema

### ✅ **Fixed for Supabase Auth**

1. **Removed `password_hash` fields**: Supabase handles authentication via `auth.users` table
2. **Unified user model**: Uses existing `profiles` table (from migration 001) instead of separate `patients` and `doctors` tables
3. **Foreign key references**: All tables reference `profiles(id)` which links to `auth.users(id)`
4. **Added Kestra tracking**: Added `kestra_execution_id` and `processing_status` fields for workflow orchestration

### 📋 **Schema Structure**

```
auth.users (Supabase managed)
    ↓
profiles (extends auth.users with role, phone, specialization, etc.)
    ↓
appointments (links patient_id and doctor_id to profiles)
    ↓
consultations (one-to-one with appointments)
    ↓
documents (links to patient_id and optionally consultation_id)
    ↓
chat_messages (links to consultation_id and user_id)
```

### 🔒 **Security Features**

- **Row Level Security (RLS)**: Enabled on all tables
- **Role-based access**: Policies ensure users can only access their own data
- **Cascade deletes**: Proper cleanup when users/appointments are deleted
- **Check constraints**: Validates status values and document types

### 🚀 **Additional Features**

- **Processing status tracking**: For async AI workflows (Kestra)
- **JSONB for AI data**: Flexible storage for extracted structured data
- **Automatic timestamps**: `created_at` and `updated_at` with triggers
- **Comprehensive indexes**: Optimized for common query patterns

### 📝 **Usage Notes**

1. **User Creation**: Users are created via Supabase Auth, which automatically creates a profile via trigger
2. **Role Assignment**: Set during signup via `user_metadata.role` or update `profiles.role` directly
3. **Doctor ID**: Optional `doctor_id` field for doctors (e.g., "DR001") - separate from UUID
4. **File Storage**: `audio_url` and `file_url` should point to Supabase Storage buckets

### 🔄 **Next Steps**

1. Run migration `002_create_core_tables.sql` in Supabase SQL Editor
2. Create Supabase Storage buckets for:
   - `consultations` (for audio files)
   - `documents` (for prescriptions, reports, etc.)
3. Set up Storage policies for secure file access
4. Configure Kestra webhooks to update `processing_status` and `kestra_execution_id`

