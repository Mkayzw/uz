-- Drop existing chat-related objects
DROP FUNCTION IF EXISTS create_chat_with_participants CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS chats CASCADE;

-- Create simplified chats table
-- Directly links chats to applications without a separate participants table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  property_title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one chat per application
  CONSTRAINT unique_chat_per_application UNIQUE (application_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_chats_application_id ON chats(application_id);
CREATE INDEX idx_chats_tenant_id ON chats(tenant_id);
CREATE INDEX idx_chats_agent_id ON chats(agent_id);
CREATE INDEX idx_chats_property_id ON chats(property_id);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies for chats
-- Users can view chats where they are either the tenant or agent
CREATE POLICY "Users can view their own chats" 
ON chats
FOR SELECT USING (
  auth.uid() = tenant_id OR auth.uid() = agent_id
);

-- Users can create chats for their applications or properties
CREATE POLICY "Users can create chats for their applications or properties"
ON chats
FOR INSERT WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  AND (
    -- Tenant creating chat for their application
    (auth.uid() = tenant_id AND EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = chats.application_id 
      AND applications.tenant_id = auth.uid()
    ))
    OR
    -- Agent creating chat for application to their property
    (auth.uid() = agent_id AND EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = chats.property_id 
      AND properties.owner_id = auth.uid()
    ))
  )
);

-- Simple RLS Policies for messages
-- Users can view messages in chats they participate in
CREATE POLICY "Users can view messages in their chats"
ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = messages.chat_id 
    AND (chats.tenant_id = auth.uid() OR chats.agent_id = auth.uid())
  )
);

-- Users can send messages to chats they participate in
CREATE POLICY "Users can send messages to their chats"
ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = messages.chat_id 
    AND (chats.tenant_id = auth.uid() OR chats.agent_id = auth.uid())
  )
);

-- Create a function to get or create a chat for an application
CREATE OR REPLACE FUNCTION get_or_create_chat(
  p_application_id UUID
) RETURNS UUID AS $$
DECLARE
  v_chat_id UUID;
  v_tenant_id UUID;
  v_agent_id UUID;
  v_property_id UUID;
  v_property_title TEXT;
BEGIN
  -- First check if chat already exists
  SELECT id INTO v_chat_id
  FROM chats
  WHERE application_id = p_application_id;
  
  IF v_chat_id IS NOT NULL THEN
    RETURN v_chat_id;
  END IF;
  
  -- Get application details with property info
  SELECT 
    a.tenant_id,
    p.owner_id,
    p.id,
    p.title
  INTO 
    v_tenant_id,
    v_agent_id,
    v_property_id,
    v_property_title
  FROM applications a
  JOIN beds b ON b.id = a.bed_id
  JOIN rooms r ON r.id = b.room_id
  JOIN properties p ON p.id = r.property_id
  WHERE a.id = p_application_id;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Verify the current user is either the tenant or agent
  IF auth.uid() != v_tenant_id AND auth.uid() != v_agent_id THEN
    RAISE EXCEPTION 'User must be either the tenant or agent to create this chat';
  END IF;
  
  -- Create the chat
  INSERT INTO chats (
    application_id,
    tenant_id,
    agent_id,
    property_id,
    property_title
  ) VALUES (
    p_application_id,
    v_tenant_id,
    v_agent_id,
    v_property_id,
    v_property_title
  ) RETURNING id INTO v_chat_id;
  
  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_chat TO authenticated;

-- Create a view for chat details with participant info
CREATE OR REPLACE VIEW chat_details AS
SELECT 
  c.id,
  c.application_id,
  c.property_id,
  c.property_title,
  c.created_at,
  c.updated_at,
  c.tenant_id,
  c.agent_id,
  t.full_name as tenant_name,
  t.role as tenant_role,
  a.full_name as agent_name,
  a.role as agent_role,
  -- Get last message info
  (
    SELECT json_build_object(
      'content', m.content,
      'created_at', m.created_at,
      'sender_id', m.sender_id
    )
    FROM messages m
    WHERE m.chat_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) as last_message
FROM chats c
JOIN profiles t ON t.id = c.tenant_id
JOIN profiles a ON a.id = c.agent_id;

-- Grant access to the view
GRANT SELECT ON chat_details TO authenticated;

-- Comments for documentation
COMMENT ON TABLE chats IS 'Simplified chat conversations between tenants and property agents';
COMMENT ON TABLE messages IS 'Messages within chat conversations';

COMMENT ON COLUMN chats.application_id IS 'The application that triggered this chat';
COMMENT ON COLUMN chats.tenant_id IS 'The tenant participating in the chat';
COMMENT ON COLUMN chats.agent_id IS 'The property agent participating in the chat';
COMMENT ON COLUMN chats.property_id IS 'The property being discussed';
COMMENT ON COLUMN chats.property_title IS 'Cached property title for display';