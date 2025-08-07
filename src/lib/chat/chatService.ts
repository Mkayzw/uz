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

  // Check if chat already exists for this application
  const { data: existingChat } = await supabase
    .from('chats')
    .select('id')
    .eq('application_id', context.applicationId)
    .single()

  if (existingChat) {
    return existingChat.id
  }

  // If chat doesn't exist, create it now
  const { data: newChat, error: createError } = await supabase
    .from('chats')
    .insert({
      application_id: context.applicationId,
      property_id: context.propertyId,
      title: `Chat for ${context.propertyTitle}`,
    })
    .select('id')
    .single()

  if (createError) {
    throw new Error(`Failed to create chat: ${createError.message}`)
  }

  // Also add participants to the chat
  const { error: participantError } = await supabase
    .from('chat_participants')
    .insert([
      { chat_id: newChat.id, user_id: context.tenantId },
      { chat_id: newChat.id, user_id: context.agentId },
    ])

  if (participantError) {
    // Note: This could leave an orphaned chat, but it's better than failing silently.
    // A cleanup process for chats without participants might be needed.
    throw new Error(`Failed to add participants to chat: ${participantError.message}`)
  }

  return newChat.id
}

export async function getUserChats(userId: string, userRole: 'tenant' | 'agent') {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (userRole === 'agent') {
    // Agents see applications to their properties - these can become chats
    console.log('getUserChats: Fetching applications for agent:', userId)
    
    // Get applications for properties owned by this agent using the new property_id column
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        tenant_id,
        bed_id,
        property_id,
        tenant:profiles!applications_tenant_id_fkey(
          id,
          full_name,
          role
        ),
        property:properties!applications_property_id_fkey(
          id,
          title,
          owner_id
        )
      `)
      .eq('property.owner_id', userId)
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

      const property = Array.isArray(app.property) ? app.property[0] : app.property
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
