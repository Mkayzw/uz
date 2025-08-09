'use client'

import { createBrowserClient } from '@supabase/ssr'

export interface ChatCreationContext {
  applicationId: string
}

export interface ChatDetails {
  id: string
  application_id: string
  property_id: string
  property_title: string
  tenant_id: string
  agent_id: string
  tenant_name: string | null
  agent_name: string | null
  tenant_role: string
  agent_role: string
  created_at: string
  updated_at: string
  last_message?: {
    content: string
    created_at: string
    sender_id: string
  } | null
}

export async function createPropertyChat(context: ChatCreationContext) {
  console.log('[DEBUG] createPropertyChat called with context:', context)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check current user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('[DEBUG] Current authenticated user:', user?.id, 'Auth error:', authError)
  
  if (!user) {
    console.error('[ERROR] No authenticated user found')
    throw new Error('User must be authenticated to create a chat')
  }

  // Validate context data
  if (!context.applicationId) {
    console.error('[ERROR] Missing required field: applicationId')
    throw new Error('Missing required field: applicationId')
  }

  try {
    // Use the database function to get or create chat
    console.log('[DEBUG] Calling get_or_create_chat function...')
    const { data: chatId, error: functionError } = await supabase
      .rpc('get_or_create_chat', {
        p_application_id: context.applicationId
      })
    
    if (functionError) {
      console.error('[ERROR] Database function error:', functionError)
      throw new Error(`Failed to create chat: ${functionError.message}`)
    }
    
    if (!chatId) {
      throw new Error('Failed to create chat: No chat ID returned')
    }
    
    console.log('[DEBUG] Successfully created/retrieved chat with ID:', chatId)
    
    // Get chat details to send initial message if needed
    const { data: chatDetails, error: detailsError } = await supabase
      .from('chat_details')
      .select('*')
      .eq('id', chatId)
      .single()
    
    if (!detailsError && chatDetails && !chatDetails.last_message) {
      // Send initial welcome message from agent
      const welcomeMessage = `Hi ${chatDetails.tenant_name}! I'm ${chatDetails.agent_name}, the property owner. Feel free to ask any questions about "${chatDetails.property_title}".`
      
      await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: chatDetails.agent_id,
          content: welcomeMessage,
          created_at: new Date().toISOString()
        })
    }
    
    return chatId
  } catch (error) {
    console.error('[ERROR] Failed to create/retrieve chat:', error)
    throw error
  }
}

export async function getUserChats(userId: string, userRole: 'tenant' | 'agent') {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    if (userRole === 'agent') {
      // For agents: Get all applications to their properties
      // Some may have chats, some may not yet
      console.log('[DEBUG] Fetching applications for agent:', userId)
      
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
        console.error('[ERROR] Failed to fetch applications:', error)
        throw new Error(`Failed to fetch applications: ${error.message}`)
      }

      if (!applications || applications.length === 0) {
        return []
      }

      // Get all existing chats for these applications
      const applicationIds = applications.map(app => app.id)
      const { data: existingChats } = await supabase
        .from('chat_details')
        .select('*')
        .in('application_id', applicationIds)

      // Create a map of application_id to chat details
      const chatMap = new Map<string, ChatDetails>()
      existingChats?.forEach(chat => {
        chatMap.set(chat.application_id, chat)
      })

      // Transform applications into chat items
      return applications.map(app => {
        const bed = Array.isArray(app.bed) ? app.bed[0] : app.bed
        const room = Array.isArray(bed?.room) ? bed.room[0] : bed?.room  
        const property = Array.isArray(room?.property) ? room.property[0] : room?.property
        const tenant = Array.isArray(app.tenant) ? app.tenant[0] : app.tenant
        const existingChat = chatMap.get(app.id)

        return {
          id: existingChat?.id || null,
          title: `Application: ${property?.title} - ${tenant?.full_name}`,
          property_id: property?.id,
          application_id: app.id,
          created_at: existingChat?.created_at || app.created_at,
          hasExistingChat: !!existingChat,
          lastMessage: existingChat?.last_message,
          otherParticipant: {
            id: tenant?.id,
            full_name: tenant?.full_name,
            role: tenant?.role
          }
        }
      })
    } else {
      // For tenants: Get all their chats
      console.log('[DEBUG] Fetching chats for tenant:', userId)
      
      const { data: chats, error } = await supabase
        .from('chat_details')
        .select('*')
        .eq('tenant_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[ERROR] Failed to fetch chats:', error)
        throw new Error(`Failed to fetch chats: ${error.message}`)
      }

      if (!chats || chats.length === 0) {
        return []
      }

      // Transform chats into the expected format
      return chats.map(chat => ({
        id: chat.id,
        title: `Property: ${chat.property_title} - ${chat.agent_name}`,
        property_id: chat.property_id,
        application_id: chat.application_id,
        created_at: chat.created_at,
        hasExistingChat: true,
        lastMessage: chat.last_message,
        otherParticipant: {
          id: chat.agent_id,
          full_name: chat.agent_name,
          role: chat.agent_role
        }
      }))
    }
  } catch (error) {
    console.error('[ERROR] Failed to get user chats:', error)
    throw error
  }
}

export async function getChatDetails(chatId: string): Promise<ChatDetails | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data, error } = await supabase
      .from('chat_details')
      .select('*')
      .eq('id', chatId)
      .single()

    if (error) {
      console.error('[ERROR] Failed to get chat details:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[ERROR] Failed to get chat details:', error)
    return null
  }
}
