'use client'

import { createBrowserClient } from '@supabase/ssr'

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
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check if chat already exists for this property-tenant combination
  const { data: existingChats } = await supabase
    .from('chats')
    .select('id')
    .eq('property_id', context.propertyId)
    .eq('application_id', context.applicationId)

  if (existingChats && existingChats.length > 0) {
    return existingChats[0].id
  }

  // Create new chat
  const { data: newChat, error: chatError } = await supabase
    .from('chats')
    .insert({
      title: `Property: ${context.propertyTitle} - ${context.tenantName}`,
      property_id: context.propertyId,
      application_id: context.applicationId,
      created_at: new Date().toISOString()
    })
    .select()

  if (chatError || !newChat || newChat.length === 0) {
    throw new Error('Failed to create chat')
  }

  const chatId = newChat[0].id

  // Add both participants
  const { error: participantError } = await supabase
    .from('chat_participants')
    .insert([
      { chat_id: chatId, user_id: context.tenantId },
      { chat_id: chatId, user_id: context.agentId }
    ])

  if (participantError) {
    throw new Error('Failed to add chat participants')
  }

  // Send initial system message
  await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: context.agentId, // Send from agent
      content: `Hi ${context.tenantName}! I'm ${context.agentName}, the property owner. Feel free to ask any questions about "${context.propertyTitle}".`,
      created_at: new Date().toISOString()
    })

  return chatId
}

export async function getUserChats(userId: string, userRole: 'tenant' | 'agent') {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (userRole === 'agent') {
    // Agents see all applications to their properties (potential chats)
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        created_at,
        tenant:profiles!inner(
          id,
          full_name
        ),
        bed:beds!inner(
          room:rooms!inner(
            property:properties!inner(
              id,
              title,
              owner_id
            )
          )
        ),
        chats(
          id,
          title,
          created_at
        )
      `)
      .eq('bed.room.property.owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Applications fetch error:', {
        userId,
        userRole,
        error: error.message,
        code: error.code,
      })
      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    // Transform applications to chat-like format
    const chats = applications?.map(app => ({
      id: app.chats?.[0]?.id || null,
      title: app.chats?.[0]?.title || `Application: ${app.bed[0]?.room[0]?.property[0]?.title} - ${app.tenant[0]?.full_name}`,
      property_id: app.bed[0]?.room[0]?.property[0]?.id,
      application_id: app.id,
      created_at: app.chats?.[0]?.created_at || app.created_at,
      chat_participants: [],
      applications: [{
        tenant: app.tenant[0],
        bed: app.bed[0]
      }],
      hasExistingChat: !!app.chats?.[0]?.id
    })) || []

    return chats
  } else {
    // Tenants see chats they participate in
    console.log('getUserChats: Fetching chats for tenant:', userId)
    
    // First, let's check if the tenant has any applications
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('id, status, created_at')
      .eq('tenant_id', userId)
    
    console.log('getUserChats: Tenant applications:', JSON.stringify(applications, null, 2))
    console.log('getUserChats: Applications error:', appError)
    
    const { data: chats, error } = await supabase
      .from('chats')
      .select(`
        id,
        title,
        property_id,
        application_id,
        created_at,
        chat_participants (
          user_id
        ),
        applications!inner(
          tenant:profiles!inner(
            id,
            full_name
          ),
          bed:beds!inner(
            room:rooms!inner(
              property:properties!inner(owner_id)
            )
          )
        )
      `)
      .eq('chat_participants.user_id', userId)
      .order('created_at', { ascending: false })

    console.log('getUserChats: Tenant chats result:', chats)
    console.log('getUserChats: Tenant chats error:', error)

    if (error) {
      console.error('Chat fetch error:', {
        userId,
        userRole,
        error: error.message,
        code: error.code,
      })
      throw new Error(`Failed to fetch chats: ${error.message}`)
    }

    return chats || []
  }
}
