-- Create chat tables for property chat functionality

-- Create chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_chats_property_id ON chats(property_id);
CREATE INDEX idx_chats_application_id ON chats(application_id);

-- Create chat_participants table
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_chat_participant UNIQUE (chat_id, user_id)
);

-- Create indexes for chat_participants
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);

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
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats
CREATE POLICY "Users can view chats they participate in" 
ON chats
FOR SELECT USING (
  EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_participants.chat_id = chats.id 
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create chats for their applications/properties"
ON chats
FOR INSERT WITH CHECK (
  -- Tenant creating chat for their application
  (application_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = chats.application_id 
    AND applications.tenant_id = auth.uid()
  ))
  OR
  -- Agent creating chat for properties they own
  (property_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM properties 
    WHERE properties.id = chats.property_id 
    AND properties.owner_id = auth.uid()
  ))
);

-- RLS Policies for chat_participants
CREATE POLICY "Users can view participants of chats they're in"
ON chat_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 
    FROM chat_participants cp2
    WHERE cp2.chat_id = chat_participants.chat_id 
    AND cp2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add participants to chats they're in"
ON chat_participants
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_participants.chat_id = chat_participants.chat_id 
    AND chat_participants.user_id = auth.uid()
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

-- RLS Policies for messages
CREATE POLICY "Users can view messages in chats they participate in"
ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_participants.chat_id = messages.chat_id 
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to chats they participate in"
ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM chat_participants 
    WHERE chat_participants.chat_id = messages.chat_id 
    AND chat_participants.user_id = auth.uid()
  )
);

-- Comments for documentation
COMMENT ON TABLE chats IS 'Chat conversations between tenants and property owners';
COMMENT ON TABLE chat_participants IS 'Users participating in chat conversations';
COMMENT ON TABLE messages IS 'Messages within chat conversations';

COMMENT ON COLUMN chats.property_id IS 'Reference to the property this chat is about';
COMMENT ON COLUMN chats.application_id IS 'Reference to the application that triggered this chat';
COMMENT ON COLUMN chat_participants.chat_id IS 'Reference to the chat conversation';
COMMENT ON COLUMN chat_participants.user_id IS 'Reference to the participating user';
COMMENT ON COLUMN messages.sender_id IS 'Reference to the user who sent the message';