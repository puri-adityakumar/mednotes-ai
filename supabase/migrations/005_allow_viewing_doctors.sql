-- Allow patients to view doctor profiles for appointment booking
-- This policy enables patients to see available doctors when booking appointments

-- Policy: Users can view doctor profiles
-- This allows any authenticated user (patients) to view profiles where role = 'doctor'
-- This is necessary for the appointment booking flow where patients need to see available doctors

CREATE POLICY "Users can view doctor profiles"
    ON public.profiles FOR SELECT
    USING (
        role = 'doctor'
    );

-- Note: This policy works alongside the existing "Users can view own profile" policy
-- Users can now:
-- 1. View their own profile (existing policy)
-- 2. View any doctor profile (new policy)
-- But cannot view other patient profiles (no policy for that)

