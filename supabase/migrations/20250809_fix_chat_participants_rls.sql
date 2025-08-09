-- Fix infinite recursion in chat_participants RLS policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can add participants to chats they're in" ON chat_participants;

-- Create a corrected policy
CREATE POLICY "Users can add participants to chats they're in"
ON chat_participants
FOR INSERT WITH CHECK (
  -- Allow users who are already participants to add others
  EXISTS (
    SELECT 1 
    FROM chat_participants existing
    WHERE existing.chat_id = chat_participants.chat_id 
    AND existing.user_id = auth.uid()
  )
  OR 
  -- Allow initial creation by application tenant or property owner
  EXISTS (
    SELECT 1 
    FROM chats c
    LEFT JOIN applications a ON c.application_id = a.id
    LEFT JOIN properties p ON c.property_id = p.id
    WHERE c.id = chat_participants.chat_id
    AND (a.tenant_id = auth.uid() OR p.owner_id = auth.uid())
  )
);