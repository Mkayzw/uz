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

  try {
    // Use database function to get or create chat based on application
    console.log('createPropertyChat: Calling get_or_create_chat RPC...')
    const { data: chatId, error: functionError } = await supabase.rpc('get_or_create_chat', {
      p_application_id: context.applicationId,
    })

    if (functionError) {
      console.error('createPropertyChat: RPC error:', functionError)
      throw new Error(`Failed to create/retrieve chat: ${functionError.message}`)
    }

    if (!chatId) {
      throw new Error('Failed to create/retrieve chat: No chat ID returned')
    }

    console.log('createPropertyChat: Got chatId:', chatId)

    // Fetch chat details to decide whether to send a welcome message
    const { data: chatDetails, error: detailsError } = await supabase
      .from('chat_details')
      .select('*')
      .eq('id', chatId)
      .single()

    if (detailsError) {
      console.warn('createPropertyChat: Failed to load chat details (continuing):', detailsError)
    }

    if (chatDetails && !chatDetails.last_message) {
      const welcomeMessage = `Hi ${chatDetails.tenant_name}! I'm ${chatDetails.agent_name}, the property owner. Feel free to ask any questions about "${chatDetails.property_title}".`
      await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: chatDetails.agent_id,
        content: welcomeMessage,
        created_at: new Date().toISOString(),
      })
    }

    console.log('createPropertyChat: Chat ready with ID:', chatId)
    return chatId
  } catch (err) {
    console.error('createPropertyChat: Unexpected error:', err)
    throw err
  }
}