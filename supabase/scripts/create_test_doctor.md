# Create Test Doctor - Quick Guide

## Method 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** > **Users**

2. **Create a new user**
   - Click **"Add user"** > **"Create new user"**
   - Enter:
     - **Email**: `doctor@test.com`
     - **Password**: `test123456` (or any password you prefer)
     - **Auto Confirm User**: ✅ Yes
   - Click **"Create user"**

3. **Run the SQL function**
   - Go to **SQL Editor** in Supabase Dashboard
   - Run this command:
   ```sql
   SELECT public.create_test_doctor(
     'doctor@test.com',
     'John',
     'Smith',
     'General Practitioner',
     'DR001',
     '+1-555-0123'
   );
   ```

4. **Verify the doctor was created**
   ```sql
   SELECT * FROM public.profiles WHERE email = 'doctor@test.com';
   ```

## Method 2: Using Supabase CLI (If you have it set up)

```bash
# Create user via Supabase CLI
supabase auth users create doctor@test.com --password test123456 --email-confirm

# Then run the SQL function in SQL Editor
```

## Method 3: Manual SQL Update

If you already have a user account you want to convert to a doctor:

```sql
-- Replace 'user@example.com' with the actual email
UPDATE public.profiles
SET 
  role = 'doctor',
  first_name = 'John',
  last_name = 'Smith',
  specialization = 'General Practitioner',
  doctor_id = 'DR001',
  phone = '+1-555-0123'
WHERE email = 'user@example.com';
```

## Test Doctor Credentials

After setup, you can use these credentials to login as a doctor:

- **Email**: `doctor@test.com`
- **Password**: `test123456` (or whatever you set)

## Multiple Test Doctors

You can create multiple test doctors by repeating the process with different emails:

```sql
-- Create second doctor
SELECT public.create_test_doctor(
  'doctor2@test.com',
  'Sarah',
  'Johnson',
  'Cardiologist',
  'DR002',
  '+1-555-0124'
);

-- Create third doctor
SELECT public.create_test_doctor(
  'doctor3@test.com',
  'Michael',
  'Brown',
  'Pediatrician',
  'DR003',
  '+1-555-0125'
);
```

## Verify Doctors are Available

Check that doctors are available for booking:

```sql
SELECT 
  id,
  email,
  first_name,
  last_name,
  specialization,
  doctor_id
FROM public.profiles
WHERE role = 'doctor';
```

