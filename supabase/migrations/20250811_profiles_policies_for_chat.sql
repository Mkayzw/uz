-- Allow chat participants and property owners to see minimal profile info for chats and applications
-- Safe to run multiple times: drops existing policies before creating

-- Ensure RLS is enabled on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant select to authenticated (RLS will still filter rows)
GRANT SELECT ON profiles TO authenticated;

-- Drop old policies if they exist to avoid duplicates
DROP POLICY IF EXISTS "Chat participants can view participant profiles" ON profiles;
DROP POLICY IF EXISTS "Property owners can view applicant profiles" ON profiles;

-- Policy 1: Users can view profiles of other users they share a chat with
CREATE POLICY "Chat participants can view participant profiles"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM chats c
    WHERE (c.tenant_id = profiles.id OR c.agent_id = profiles.id)
      AND (c.tenant_id = auth.uid() OR c.agent_id = auth.uid())
  )
);

-- Policy 2: Property owners can view applicant (tenant) profiles for applications to their properties
CREATE POLICY "Property owners can view applicant profiles"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM applications a
    JOIN beds b ON b.id = a.bed_id
    JOIN rooms r ON r.id = b.room_id
    JOIN properties p ON p.id = r.property_id
    WHERE a.tenant_id = profiles.id
      AND p.owner_id = auth.uid()
  )
);

COMMENT ON POLICY "Chat participants can view participant profiles" ON profiles IS 'Allows participants in a chat to view each other''s basic profile info (e.g., full_name).';
COMMENT ON POLICY "Property owners can view applicant profiles" ON profiles IS 'Allows property owners to view the profiles of tenants who applied to their properties.';
