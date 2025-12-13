-- Create a test doctor for development/testing purposes
-- This script creates a doctor user that can be used for testing appointment booking

-- Note: This requires Supabase Auth Admin API or manual user creation
-- Option 1: Use Supabase Dashboard to create user, then run the profile update below
-- Option 2: Use Supabase Management API to create user programmatically

-- After creating the auth user manually, update the profile with doctor details:
-- Replace 'DOCTOR_USER_ID_HERE' with the actual UUID from auth.users

-- Example: If you create a user with email 'doctor@test.com' and password 'test123456'
-- You can find the user ID in Supabase Dashboard > Authentication > Users
-- Then update the profile:

-- UPDATE public.profiles
-- SET 
--   role = 'doctor',
--   first_name = 'John',
--   last_name = 'Smith',
--   specialization = 'General Practitioner',
--   doctor_id = 'DR001',
--   phone = '+1-555-0123'
-- WHERE email = 'doctor@test.com';

-- OR use this function to create a test doctor profile (requires auth user to exist first):

-- Function to create/update test doctor profile
CREATE OR REPLACE FUNCTION public.create_test_doctor(
  p_email TEXT,
  p_first_name TEXT DEFAULT 'John',
  p_last_name TEXT DEFAULT 'Smith',
  p_specialization TEXT DEFAULT 'General Practitioner',
  p_doctor_id TEXT DEFAULT 'DR001',
  p_phone TEXT DEFAULT '+1-555-0123'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % does not exist. Please create the user in Supabase Dashboard first.', p_email;
  END IF;
  
  -- Update or insert profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    specialization,
    doctor_id,
    phone
  )
  VALUES (
    v_user_id,
    p_email,
    p_first_name,
    p_last_name,
    'doctor',
    p_specialization,
    p_doctor_id,
    p_phone
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'doctor',
    specialization = EXCLUDED.specialization,
    doctor_id = EXCLUDED.doctor_id,
    phone = EXCLUDED.phone,
    updated_at = now();
  
  RETURN v_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_test_doctor TO authenticated;

-- Instructions:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Enter:
--    - Email: doctor@test.com (or any email)
--    - Password: test123456 (or any password)
--    - Auto Confirm User: Yes
-- 4. Copy the user ID (UUID)
-- 5. Run this SQL to create the doctor profile:
--    SELECT public.create_test_doctor('doctor@test.com', 'John', 'Smith', 'General Practitioner', 'DR001', '+1-555-0123');

