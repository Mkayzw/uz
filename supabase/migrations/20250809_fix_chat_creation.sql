-- Fix chat creation by creating a function that handles the entire process

-- Create a function to create a chat with participants
CREATE OR REPLACE FUNCTION create_chat_with_participants(
  p_title TEXT,
  p_property_id UUID,
  p_application_id UUID,
  p_tenant_id UUID,
  p_agent_id UUID
) RETURNS UUID AS $$
DECLARE
  v_chat_id UUID;
  v_current_user_id UUID;
BEGIN
  -- Get the current user
  v_current_user_id := auth.uid();
  
  -- Verify the current user is either the tenant or agent
  IF v_current_user_id != p_tenant_id AND v_current_user_id != p_agent_id THEN
    RAISE EXCEPTION 'User must be either the tenant or agent to create this chat';
  END IF;
  
  -- Verify the application exists and belongs to the tenant
  IF NOT EXISTS (
    SELECT 1 FROM applications 
    WHERE id = p_application_id 
    AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'Application not found or does not belong to the tenant';
  END IF;
  
  -- Verify the property exists and belongs to the agent
  IF NOT EXISTS (
    SELECT 1 FROM properties 
    WHERE id = p_property_id 
    AND owner_id = p_agent_id
  ) THEN
    RAISE EXCEPTION 'Property not found or does not belong to the agent';
  END IF;
  
  -- Create the chat
  INSERT INTO chats (title, property_id, application_id)
  VALUES (p_title, p_property_id, p_application_id)
  RETURNING id INTO v_chat_id;
  
  -- Add both participants (bypasses RLS as this runs with SECURITY DEFINER)
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES 
    (v_chat_id, p_tenant_id),
    (v_chat_id, p_agent_id);
  
  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_chat_with_participants TO authenticated;

-- Also fix the original RLS policy to prevent recursion
DROP POLICY IF EXISTS "Users can add participants to chats they're in" ON chat_participants;

CREATE POLICY "Users can add participants to chats"
ON chat_participants
FOR INSERT WITH CHECK (
  -- Only allow adding participants if the user is creating the chat
  -- (handled by the function above) or is already a participant
  EXISTS (
    SELECT 1 
    FROM chats c
    LEFT JOIN applications a ON c.application_id = a.id
    LEFT JOIN properties p ON c.property_id = p.id
    WHERE c.id = chat_participants.chat_id
    AND (a.tenant_id = auth.uid() OR p.owner_id = auth.uid())
  )
);