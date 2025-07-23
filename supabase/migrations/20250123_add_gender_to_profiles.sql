-- Add gender field to profiles table
ALTER TABLE profiles 
ADD COLUMN gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

COMMENT ON COLUMN profiles.gender IS 'Gender information for tenant profiles displayed to agents';
