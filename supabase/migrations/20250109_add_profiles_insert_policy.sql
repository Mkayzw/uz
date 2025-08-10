-- Add INSERT policy for profiles table to allow users to create their own profile
-- This fixes "Database error saving new user" during OAuth sign-in

-- Ensure RLS is enabled on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant INSERT to authenticated users (RLS will still filter)
GRANT INSERT ON profiles TO authenticated;

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create INSERT policy: users can only insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Also add UPDATE policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add SELECT policy for users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

COMMENT ON POLICY "Users can insert their own profile" ON profiles IS 'Allows users to create their own profile during signup/OAuth';
COMMENT ON POLICY "Users can update their own profile" ON profiles IS 'Allows users to update their own profile information';
COMMENT ON POLICY "Users can view their own profile" ON profiles IS 'Allows users to view their own profile';
