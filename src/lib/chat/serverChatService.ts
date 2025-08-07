'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface ChatCreationContext {
  propertyId: string
  propertyTitle: string
  tenantId: string
  tenantName: string
  agentId: string
  agentName: string
  applicationId: string
}

export async function createPropertyChat(context: ChatCreationContext) {
  console.log('createPropertyChat: Starting chat creation with context:', JSON.stringify(context, null, 2))
  const supabase = createClient(cookies())

  // Check if chat already exists for this property-tenant combination
  const { data: existingChats, error: existingError } = await supabase
    .from('chats')
    .select('id')
    .eq('property_id', context.propertyId)
    .eq('application_id', context.applicationId)
  
  console.log('createPropertyChat: Existing chats check:', { existingChats, existingError })

  if (existingChats && existingChats.length > 0) {
    console.log('createPropertyChat: Chat already exists, returning existing ID:', existingChats[0].id)
    return existingChats[0].id
  }

  // Create new chat
  console.log('createPropertyChat: Creating new chat...')
  const { data: newChat, error: chatError } = await supabase
    .from('chats')
    .insert({
      title: `Property: ${context.propertyTitle} - ${context.tenantName}`,
      property_id: context.propertyId,
      application_id: context.applicationId,
      created_at: new Date().toISOString()
    })
    .select()

  console.log('createPropertyChat: Chat creation result:', { newChat, chatError })

  if (chatError || !newChat || newChat.length === 0) {
    console.error('createPropertyChat: Failed to create chat:', { chatError, newChat })
    throw new Error('Failed to create chat')
  }

  const chatId = newChat[0].id
  console.log('createPropertyChat: Created chat with ID:', chatId)

  // Add both participants
  console.log('createPropertyChat: Adding participants...')
  const { error: participantError } = await supabase
    .from('chat_participants')
    .insert([
      { chat_id: chatId, user_id: context.tenantId },
      { chat_id: chatId, user_id: context.agentId }
    ])

  console.log('createPropertyChat: Participant addition result:', { participantError })

  if (participantError) {
    console.error('createPropertyChat: Failed to add participants:', participantError)
    throw new Error('Failed to add chat participants')
  }

  // Send initial system message
  console.log('createPropertyChat: Sending initial message...')
  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: context.agentId, // Send from agent
      content: `Hi ${context.tenantName}! I'm ${context.agentName}, the property owner. Feel free to ask any questions about "${context.propertyTitle}".`,
      created_at: new Date().toISOString()
    })

  console.log('createPropertyChat: Message creation result:', { messageError })
  
  if (messageError) {
    console.error('createPropertyChat: Failed to send initial message:', messageError)
  }

  console.log('createPropertyChat: Chat creation completed successfully for chatId:', chatId)
  return chatId
}