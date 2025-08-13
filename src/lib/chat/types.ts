// Chat system type definitions

export interface Chat {
  id: string
  property_id: string
  property_title: string
  tenant_id: string
  agent_id: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: 'text'
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  property_id: string
  property_title: string
  tenant_id: string
  agent_id: string
  created_at: string
  updated_at: string
  tenant_name: string | null
  agent_name: string | null
  last_message: {
    content: string
    created_at: string
    sender_id: string
  } | null
  unread_count: number
}

export interface ChatParticipant {
  id: string
  full_name: string | null
  role: 'tenant' | 'agent'
}

export interface ChatDetails {
  id: string
  property_id: string
  property_title: string
  tenant_id: string
  agent_id: string
  tenant_name: string | null
  agent_name: string | null
  created_at: string
  updated_at: string
}

export interface SendMessageRequest {
  chatId: string
  content: string
}

export interface CreateChatRequest {
  propertyId: string
  tenantId?: string // Optional, defaults to current user
}

export interface ChatServiceError extends Error {
  code?: string
  details?: any
}