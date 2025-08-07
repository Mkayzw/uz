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
    // Agents see applications to their properties - these can become chats
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        tenant_id,
        bed_id,
        tenant:profiles!applications_tenant_id_fkey(
          id,
          full_name,
          role
        ),
        bed:beds!applications_bed_id_fkey(
          id,
          bed_number,
          room:rooms!beds_room_id_fkey(
            id,
            name,
            property:properties!rooms_property_id_fkey(
              id,
              title,
              owner_id
            )
          )
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

    if (!applications) return []

    // For each application, check if a chat exists
    const chatsWithApplications = []
    
    for (const app of applications) {
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id, title, created_at')
        .eq('application_id', app.id)
        .single()

      const bed = Array.isArray(app.bed) ? app.bed[0] : app.bed
      const room = Array.isArray(bed?.room) ? bed.room[0] : bed?.room  
      const property = Array.isArray(room?.property) ? room.property[0] : room?.property
      const tenant = Array.isArray(app.tenant) ? app.tenant[0] : app.tenant

      chatsWithApplications.push({
        id: existingChat?.id || null,
        title: existingChat?.title || `Application: ${property?.title} - ${tenant?.full_name}`,
        property_id: property?.id,
        application_id: app.id,
        created_at: existingChat?.created_at || app.created_at,
        hasExistingChat: !!existingChat?.id,
        // Include participant info for the UI
        otherParticipant: {
          id: tenant?.id,
          full_name: tenant?.full_name,
          role: tenant?.role
        }
      })
    }

    return chatsWithApplications
  } else {
    // Tenants see chats they participate in
    console.log('getUserChats: Fetching chats for tenant:', userId)
    
    const { data: chatParticipants, error: participantsError } = await supabase
      .from('chat_participants')
      .select(`
        chat_id,
        chat:chats!chat_participants_chat_id_fkey(
          id,
          title,
          property_id,
          application_id,
          created_at
        )
      `)
      .eq('user_id', userId)

    if (participantsError) {
      console.error('Chat participants fetch error:', participantsError)
      throw new Error(`Failed to fetch chat participants: ${participantsError.message}`)
    }

    if (!chatParticipants || chatParticipants.length === 0) {
      return []
    }

    // For each chat, get the other participant (agent/property owner)
    const chatsWithParticipants = []
    
    for (const participant of chatParticipants) {
      const chat = Array.isArray(participant.chat) ? participant.chat[0] : participant.chat
      if (!chat) continue

      // Get the other participant (not the current user)
      const { data: otherParticipants, error: otherError } = await supabase
        .from('chat_participants')
        .select(`
          user_id,
          user:profiles!chat_participants_user_id_fkey(
            id,
            full_name,
            role
          )
        `)
        .eq('chat_id', chat.id)
        .neq('user_id', userId)

      if (otherError) {
        console.error('Other participants fetch error:', otherError)
        continue
      }

      const otherParticipantData = otherParticipants?.[0]
      const otherParticipant = Array.isArray(otherParticipantData?.user) 
        ? otherParticipantData.user[0] 
        : otherParticipantData?.user

      chatsWithParticipants.push({
        id: chat.id,
        title: chat.title,
        property_id: chat.property_id,
        application_id: chat.application_id,
        created_at: chat.created_at,
        hasExistingChat: true,
        // Include participant info for the UI
        otherParticipant: otherParticipant ? {
          id: otherParticipant.id,
          full_name: otherParticipant.full_name,
          role: otherParticipant.role
        } : null
      })
    }

    return chatsWithParticipants.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }
}
