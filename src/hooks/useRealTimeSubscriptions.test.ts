// Testing Framework: Jest with React Testing Library
// This project uses Jest as the test runner and React Testing Library for hook testing
// Note: Using renderHook from @testing-library/react for testing React hooks

import { renderHook, act } from '@testing-library/react'
import { useRealTimeSubscriptions } from './useRealTimeSubscriptions'
import { useSupabaseClient } from './useSupabaseClient'
import { useToast } from '@/components/ToastManager'
import {
  getProfile,
  getAgentProperties,
  getAllActiveProperties,
  getTenantApplications,
  getSavedProperties,
  getAgentApplications,
} from '@/lib/utils/dashboard'
import { User } from '@supabase/supabase-js'
import { UserProfile, Property, Application, SavedProperty } from '@/types/dashboard'

// Mock all dependencies
jest.mock('./useSupabaseClient')
jest.mock('@/components/ToastManager')
jest.mock('@/lib/utils/dashboard')

const mockUseSupabaseClient = useSupabaseClient as jest.MockedFunction<typeof useSupabaseClient>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>
const mockGetProfile = getProfile as jest.MockedFunction<typeof getProfile>
const mockGetAgentProperties = getAgentProperties as jest.MockedFunction<typeof getAgentProperties>
const mockGetAllActiveProperties = getAllActiveProperties as jest.MockedFunction<typeof getAllActiveProperties>
const mockGetTenantApplications = getTenantApplications as jest.MockedFunction<typeof getTenantApplications>
const mockGetSavedProperties = getSavedProperties as jest.MockedFunction<typeof getSavedProperties>
const mockGetAgentApplications = getAgentApplications as jest.MockedFunction<typeof getAgentApplications>

// Mock Supabase channel
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
}

const mockSupabase = {
  channel: jest.fn().mockReturnValue(mockChannel),
  removeChannel: jest.fn(),
}

const mockAddToast = jest.fn()

// Test data with correct type structure
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  confirmation_sent_at: '2023-01-01T00:00:00Z',
} as User

const mockTenantProfile: UserProfile = {
  id: 'user-123',
  full_name: 'John Doe',
  role: 'tenant',
  agent_status: 'not_applicable',
  is_verified_agent: false,
  phone_number: '1234567890',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

const mockAgentProfile: UserProfile = {
  id: 'user-123',
  full_name: 'Jane Smith',
  role: 'agent',
  agent_status: 'active',
  is_verified_agent: true,
  phone_number: '0987654321',
  ecocash_number: '0987654321',
  registration_number: 'REG123',
  national_id: 'ID123',
  gender: 'female',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

const mockInactiveAgentProfile: UserProfile = {
  ...mockAgentProfile,
  agent_status: 'pending_verification',
}

const mockProperties: Property[] = [
  {
    id: 'prop-1',
    title: 'Test Property',
    description: 'A test property',
    location: 'Test City',
    city: 'Test City',
    state: 'Test State',
    zip_code: '12345',
    property_type: 'apartment',
    price: 1000,
    bedrooms: 2,
    bathrooms: 1,
    image_url: 'https://example.com/image.jpg',
    image_urls: ['https://example.com/image1.jpg'],
    has_internet: true,
    has_parking: true,
    has_air_conditioning: false,
    is_furnished: true,
    has_pool: false,
    has_power: true,
    has_water: true,
    has_tv: true,
    has_laundry: false,
    has_security_system: true,
    view_count: 0,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  } as Property,
]

const mockApplications: Application[] = [
  {
    id: 'app-1',
    tenant_id: 'user-123',
    bed_id: 'bed-1',
    status: 'pending',
    payment_verified: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  } as Application,
]

const mockSavedProperties: SavedProperty[] = [
  {
    id: 'saved-1',
    user_id: 'user-123',
    property_id: 'prop-1',
    created_at: '2023-01-01T00:00:00Z',
  } as SavedProperty,
]

describe('useRealTimeSubscriptions', () => {
  let mockSetProfile: jest.Mock
  let mockSetProperties: jest.Mock
  let mockSetAllProperties: jest.Mock
  let mockSetApplications: jest.Mock
  let mockSetAgentApplications: jest.Mock
  let mockSetSavedProperties: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mocks
    mockUseSupabaseClient.mockReturnValue(mockSupabase as any)
    mockUseToast.mockReturnValue({ addToast: mockAddToast })
    
    // Setup setter mocks
    mockSetProfile = jest.fn()
    mockSetProperties = jest.fn()
    mockSetAllProperties = jest.fn()
    mockSetApplications = jest.fn()
    mockSetAgentApplications = jest.fn()
    mockSetSavedProperties = jest.fn()
    
    // Setup API mocks
    mockGetProfile.mockResolvedValue(mockTenantProfile)
    mockGetAgentProperties.mockResolvedValue(mockProperties)
    mockGetAllActiveProperties.mockResolvedValue(mockProperties)
    mockGetTenantApplications.mockResolvedValue(mockApplications)
    mockGetSavedProperties.mockResolvedValue(mockSavedProperties)
    mockGetAgentApplications.mockResolvedValue(mockApplications)

    // Mock window.location and window.open
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
    global.open = jest.fn()
  })

  describe('Subscription Setup', () => {
    it('should not set up subscriptions when user is null', () => {
      renderHook(() => useRealTimeSubscriptions({
        user: null,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })

    it('should not set up subscriptions when profile is null', () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: null,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })

    it('should set up all subscriptions when user and profile are present', () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      // Should create 5 channels: profile, properties, applications, saved_properties, public:pads
      expect(mockSupabase.channel).toHaveBeenCalledTimes(5)
      expect(mockSupabase.channel).toHaveBeenCalledWith(`profile:${mockUser.id}`)
      expect(mockSupabase.channel).toHaveBeenCalledWith(`properties:${mockUser.id}`)
      expect(mockSupabase.channel).toHaveBeenCalledWith(`applications:${mockUser.id}`)
      expect(mockSupabase.channel).toHaveBeenCalledWith(`saved_properties:${mockUser.id}`)
      expect(mockSupabase.channel).toHaveBeenCalledWith('public:pads')
    })

    it('should configure correct postgres_changes filters', () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      // Verify profile subscription filter
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${mockUser.id}`
        },
        expect.any(Function)
      )

      // Verify properties subscription filter
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'properties',
          filter: `owner_id=eq.${mockUser.id}`
        },
        expect.any(Function)
      )

      // Verify saved properties subscription filter
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_properties',
          filter: `user_id=eq.${mockUser.id}`
        },
        expect.any(Function)
      )
    })
  })

  describe('Profile Subscription', () => {
    it('should update profile when profile changes', async () => {
      const updatedProfile = { ...mockTenantProfile, full_name: 'Updated Name' }
      mockGetProfile.mockResolvedValue(updatedProfile)

      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      // Get the profile subscription callback
      const profileCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'profiles'
      )[2]

      await act(async () => {
        await profileCallback()
      })

      expect(mockGetProfile).toHaveBeenCalledWith(mockSupabase, mockUser)
      expect(mockSetProfile).toHaveBeenCalledWith(updatedProfile)
    })

    it('should handle profile update errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockGetProfile.mockRejectedValue(new Error('Profile fetch failed'))

      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const profileCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'profiles'
      )[2]

      await act(async () => {
        await profileCallback()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error updating profile:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Properties Subscription', () => {
    it('should update agent properties when user is active agent', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockAgentProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const propertiesCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'properties'
      )[2]

      await act(async () => {
        await propertiesCallback()
      })

      expect(mockGetAgentProperties).toHaveBeenCalledWith(mockSupabase, mockUser.id)
      expect(mockSetProperties).toHaveBeenCalledWith(mockProperties)
    })

    it('should not update properties when agent status is not active', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockInactiveAgentProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const propertiesCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'properties'
      )[2]

      await act(async () => {
        await propertiesCallback()
      })

      expect(mockGetAgentProperties).not.toHaveBeenCalled()
      expect(mockSetProperties).not.toHaveBeenCalled()
    })

    it('should not update properties when user is tenant', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const propertiesCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'properties'
      )[2]

      await act(async () => {
        await propertiesCallback()
      })

      expect(mockGetAgentProperties).not.toHaveBeenCalled()
      expect(mockSetProperties).not.toHaveBeenCalled()
    })

    it('should handle properties update errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockGetAgentProperties.mockRejectedValue(new Error('Properties fetch failed'))

      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockAgentProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const propertiesCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'properties'
      )[2]

      await act(async () => {
        await propertiesCallback()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error updating properties:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should validate all agent statuses correctly', async () => {
      const testCases = [
        { status: 'active', shouldUpdate: true },
        { status: 'pending_payment', shouldUpdate: false },
        { status: 'pending_verification', shouldUpdate: false },
        { status: 'not_applicable', shouldUpdate: false },
      ]

      for (const { status, shouldUpdate } of testCases) {
        jest.clearAllMocks()
        const profileWithStatus = { ...mockAgentProfile, agent_status: status as any }

        renderHook(() => useRealTimeSubscriptions({
          user: mockUser,
          profile: profileWithStatus,
          setProfile: mockSetProfile,
          setProperties: mockSetProperties,
          setAllProperties: mockSetAllProperties,
          setApplications: mockSetApplications,
          setAgentApplications: mockSetAgentApplications,
          setSavedProperties: mockSetSavedProperties,
        }))

        const propertiesCallback = mockChannel.on.mock.calls.find(
          call => call[0] === 'postgres_changes' && call[1].table === 'properties'
        )[2]

        await act(async () => {
          await propertiesCallback()
        })

        if (shouldUpdate) {
          expect(mockGetAgentProperties).toHaveBeenCalledWith(mockSupabase, mockUser.id)
          expect(mockSetProperties).toHaveBeenCalledWith(mockProperties)
        } else {
          expect(mockGetAgentProperties).not.toHaveBeenCalled()
          expect(mockSetProperties).not.toHaveBeenCalled()
        }
      }
    })
  })

  describe('Applications Subscription - Tenant', () => {
    it('should update tenant applications', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      await act(async () => {
        await applicationsCallback({ eventType: 'INSERT' })
      })

      expect(mockGetTenantApplications).toHaveBeenCalledWith(mockSupabase, mockUser.id)
      expect(mockSetApplications).toHaveBeenCalledWith(mockApplications)
    })

    it('should show approval notification with payment link', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      const payload = {
        eventType: 'UPDATE',
        new: { id: 'app-1', status: 'approved', tenant_id: mockUser.id },
        old: { status: 'pending' }
      }

      await act(async () => {
        await applicationsCallback(payload)
      })

      expect(mockAddToast).toHaveBeenCalledWith({
        title: '🎉 Application Approved!',
        message: 'Your application has been approved. Complete your payment to secure your place.',
        type: 'success',
        duration: 10000,
        actionButton: {
          text: 'Pay Now',
          onClick: expect.any(Function)
        }
      })

      // Test the payment link functionality
      const toastCall = mockAddToast.mock.calls[0][0]
      toastCall.actionButton.onClick()
      expect(window.location.href).toBe('/dashboard/payment?application_id=app-1&type=rent')
    })

    it('should show rejection notification', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      const payload = {
        eventType: 'UPDATE',
        new: { id: 'app-1', status: 'rejected', tenant_id: mockUser.id },
        old: { status: 'pending' }
      }

      await act(async () => {
        await applicationsCallback(payload)
      })

      expect(mockAddToast).toHaveBeenCalledWith({
        title: 'Application Update',
        message: 'Your application has been rejected. You can apply to other properties.',
        type: 'error',
        duration: 8000
      })
    })

    it('should show payment verification notification', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      const payload = {
        eventType: 'UPDATE',
        new: { id: 'app-1', payment_verified: true, tenant_id: mockUser.id },
        old: { payment_verified: false }
      }

      await act(async () => {
        await applicationsCallback(payload)
      })

      expect(mockAddToast).toHaveBeenCalledWith({
        title: '✅ Payment Verified!',
        message: 'Your payment has been verified. You can now download your receipt.',
        type: 'success',
        duration: 8000,
        actionButton: {
          text: 'Download Receipt',
          onClick: expect.any(Function)
        }
      })

      // Test the receipt download functionality
      const toastCall = mockAddToast.mock.calls[0][0]
      toastCall.actionButton.onClick()
      expect(global.open).toHaveBeenCalledWith('/api/receipts/app-1')
    })

    it('should not show notifications for other users applications', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      const payload = {
        eventType: 'UPDATE',
        new: { id: 'app-1', status: 'approved', tenant_id: 'other-user' },
        old: { status: 'pending' }
      }

      await act(async () => {
        await applicationsCallback(payload)
      })

      expect(mockAddToast).not.toHaveBeenCalled()
    })

    it('should handle combined status and payment changes', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      const payload = {
        eventType: 'UPDATE',
        new: { id: 'app-1', status: 'approved', payment_verified: true, tenant_id: mockUser.id },
        old: { status: 'pending', payment_verified: false }
      }

      await act(async () => {
        await applicationsCallback(payload)
      })

      // Should show both notifications
      expect(mockAddToast).toHaveBeenCalledTimes(2)
      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({
        title: '🎉 Application Approved!'
      }))
      expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({
        title: '✅ Payment Verified!'
      }))
    })
  })

  describe('Applications Subscription - Agent', () => {
    it('should update agent applications when user is active agent', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockAgentProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      await act(async () => {
        await applicationsCallback({ eventType: 'INSERT' })
      })

      expect(mockGetAgentApplications).toHaveBeenCalledWith(mockSupabase, mockUser.id)
      expect(mockSetAgentApplications).toHaveBeenCalledWith(mockApplications)
    })

    it('should show payment verification notification for agent properties', async () => {
      const agentApplications = [
        { ...mockApplications[0], bed_id: 'bed-1' }
      ]
      mockGetAgentApplications.mockResolvedValue(agentApplications)

      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockAgentProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      const payload = {
        eventType: 'UPDATE',
        new: { id: 'app-1', payment_verified: true, bed_id: 'bed-1' },
        old: { payment_verified: false }
      }

      await act(async () => {
        await applicationsCallback(payload)
      })

      expect(mockAddToast).toHaveBeenCalledWith({
        title: '💰 Payment Verified!',
        message: 'A tenant payment has been successfully verified.',
        type: 'success',
        duration: 5000
      })
    })

    it('should not show payment notification for other agents properties', async () => {
      const agentApplications = [
        { ...mockApplications[0], bed_id: 'bed-1' }
      ]
      mockGetAgentApplications.mockResolvedValue(agentApplications)

      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockAgentProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      const payload = {
        eventType: 'UPDATE',
        new: { id: 'app-1', payment_verified: true, bed_id: 'bed-2' }, // Different bed_id
        old: { payment_verified: false }
      }

      await act(async () => {
        await applicationsCallback(payload)
      })

      expect(mockAddToast).not.toHaveBeenCalled()
    })

    it('should not update agent applications when agent status is not active', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockInactiveAgentProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      await act(async () => {
        await applicationsCallback({ eventType: 'INSERT' })
      })

      expect(mockGetAgentApplications).not.toHaveBeenCalled()
      expect(mockSetAgentApplications).not.toHaveBeenCalled()
    })

    it('should handle applications update errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockGetTenantApplications.mockRejectedValue(new Error('Applications fetch failed'))

      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      await act(async () => {
        await applicationsCallback({ eventType: 'INSERT' })
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error updating applications:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Saved Properties Subscription', () => {
    it('should update saved properties when user is tenant', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const savedPropertiesCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'saved_properties'
      )[2]

      await act(async () => {
        await savedPropertiesCallback()
      })

      expect(mockGetSavedProperties).toHaveBeenCalledWith(mockSupabase, mockUser.id)
      expect(mockSetSavedProperties).toHaveBeenCalledWith(mockSavedProperties)
    })

    it('should not update saved properties when user is agent', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockAgentProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const savedPropertiesCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'saved_properties'
      )[2]

      await act(async () => {
        await savedPropertiesCallback()
      })

      expect(mockGetSavedProperties).not.toHaveBeenCalled()
      expect(mockSetSavedProperties).not.toHaveBeenCalled()
    })

    it('should handle saved properties update errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockGetSavedProperties.mockRejectedValue(new Error('Saved properties fetch failed'))

      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const savedPropertiesCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'saved_properties'
      )[2]

      await act(async () => {
        await savedPropertiesCallback()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error updating saved properties:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Public Properties Subscription', () => {
    it('should update all properties when pads table changes', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const publicPropertiesCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'pads'
      )[2]

      await act(async () => {
        await publicPropertiesCallback()
      })

      expect(mockGetAllActiveProperties).toHaveBeenCalledWith(mockSupabase)
      expect(mockSetAllProperties).toHaveBeenCalledWith(mockProperties)
    })

    it('should handle public properties update errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockGetAllActiveProperties.mockRejectedValue(new Error('Public properties fetch failed'))

      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const publicPropertiesCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'pads'
      )[2]

      await act(async () => {
        await publicPropertiesCallback()
      })

      expect(consoleSpy).toHaveBeenCalledWith('Error updating public properties:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup all channels when component unmounts', () => {
      const { unmount } = renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      unmount()

      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(5)
    })
  })

  describe('Dependency Changes', () => {
    it('should reinitialize subscriptions when user changes', () => {
      const { rerender } = renderHook(
        ({ user }) => useRealTimeSubscriptions({
          user,
          profile: mockTenantProfile,
          setProfile: mockSetProfile,
          setProperties: mockSetProperties,
          setAllProperties: mockSetAllProperties,
          setApplications: mockSetApplications,
          setAgentApplications: mockSetAgentApplications,
          setSavedProperties: mockSetSavedProperties,
        }),
        { initialProps: { user: mockUser } }
      )

      const newUser = { ...mockUser, id: 'user-456' }
      rerender({ user: newUser })

      // Should cleanup old channels and create new ones
      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(5)
      expect(mockSupabase.channel).toHaveBeenCalledWith(`profile:${newUser.id}`)
    })

    it('should reinitialize subscriptions when profile role changes', () => {
      const { rerender } = renderHook(
        ({ profile }) => useRealTimeSubscriptions({
          user: mockUser,
          profile,
          setProfile: mockSetProfile,
          setProperties: mockSetProperties,
          setAllProperties: mockSetAllProperties,
          setApplications: mockSetApplications,
          setAgentApplications: mockSetAgentApplications,
          setSavedProperties: mockSetSavedProperties,
        }),
        { initialProps: { profile: mockTenantProfile } }
      )

      rerender({ profile: mockAgentProfile })

      // Should cleanup old channels and create new ones
      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(5)
    })

    it('should reinitialize subscriptions when agent status changes', () => {
      const { rerender } = renderHook(
        ({ profile }) => useRealTimeSubscriptions({
          user: mockUser,
          profile,
          setProfile: mockSetProfile,
          setProperties: mockSetProperties,
          setAllProperties: mockSetAllProperties,
          setApplications: mockSetApplications,
          setAgentApplications: mockSetAgentApplications,
          setSavedProperties: mockSetSavedProperties,
        }),
        { initialProps: { profile: mockAgentProfile } }
      )

      rerender({ profile: mockInactiveAgentProfile })

      // Should cleanup old channels and create new ones
      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(5)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing payload data gracefully', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      // Test with missing new/old data
      await act(async () => {
        await applicationsCallback({ eventType: 'UPDATE' })
      })

      // Should still update applications but not show notifications
      expect(mockGetTenantApplications).toHaveBeenCalled()
      expect(mockAddToast).not.toHaveBeenCalled()
    })

    it('should handle null status values gracefully', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      const payload = {
        eventType: 'UPDATE',
        new: { id: 'app-1', status: null, tenant_id: mockUser.id },
        old: { status: 'pending' }
      }

      await act(async () => {
        await applicationsCallback(payload)
      })

      // Should not show notification for null status
      expect(mockAddToast).not.toHaveBeenCalled()
    })

    it('should handle boolean payment_verified values correctly', async () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      // Test false to true transition
      const payload1 = {
        eventType: 'UPDATE',
        new: { id: 'app-1', payment_verified: true, tenant_id: mockUser.id },
        old: { payment_verified: false }
      }

      await act(async () => {
        await applicationsCallback(payload1)
      })

      expect(mockAddToast).toHaveBeenCalledTimes(1)

      // Clear mocks and test true to true (no change)
      mockAddToast.mockClear()
      const payload2 = {
        eventType: 'UPDATE',
        new: { id: 'app-1', payment_verified: true, tenant_id: mockUser.id },
        old: { payment_verified: true }
      }

      await act(async () => {
        await applicationsCallback(payload2)
      })

      // Should not trigger additional notification
      expect(mockAddToast).not.toHaveBeenCalled()
    })

    it('should handle empty agent applications list', async () => {
      mockGetAgentApplications.mockResolvedValue([])

      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockAgentProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      const applicationsCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'postgres_changes' && call[1].table === 'applications'
      )[2]

      const payload = {
        eventType: 'UPDATE',
        new: { id: 'app-1', payment_verified: true, bed_id: 'bed-1' },
        old: { payment_verified: false }
      }

      await act(async () => {
        await applicationsCallback(payload)
      })

      // Should not show notification when no agent applications
      expect(mockAddToast).not.toHaveBeenCalled()
    })

    it('should handle network failures gracefully for all subscriptions', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // Mock all API calls to fail
      mockGetProfile.mockRejectedValue(new Error('Network error'))
      mockGetAgentProperties.mockRejectedValue(new Error('Network error'))
      mockGetAllActiveProperties.mockRejectedValue(new Error('Network error'))
      mockGetTenantApplications.mockRejectedValue(new Error('Network error'))
      mockGetSavedProperties.mockRejectedValue(new Error('Network error'))

      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      // Execute all subscription callbacks
      for (let i = 0; i < mockChannel.on.mock.calls.length; i++) {
        const callback = mockChannel.on.mock.calls[i][2]
        await act(async () => {
          await callback()
        })
      }

      // Should log errors for all failed subscriptions
      expect(consoleSpy).toHaveBeenCalledWith('Error updating profile:', expect.any(Error))
      expect(consoleSpy).toHaveBeenCalledWith('Error updating applications:', expect.any(Error))
      expect(consoleSpy).toHaveBeenCalledWith('Error updating saved properties:', expect.any(Error))
      expect(consoleSpy).toHaveBeenCalledWith('Error updating public properties:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance and Memory', () => {
    it('should not create excessive subscriptions', () => {
      renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      // Should create exactly 5 channels, no more
      expect(mockSupabase.channel).toHaveBeenCalledTimes(5)
      expect(mockChannel.on).toHaveBeenCalledTimes(5)
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(5)
    })

    it('should properly cleanup on multiple unmounts', () => {
      const { unmount } = renderHook(() => useRealTimeSubscriptions({
        user: mockUser,
        profile: mockTenantProfile,
        setProfile: mockSetProfile,
        setProperties: mockSetProperties,
        setAllProperties: mockSetAllProperties,
        setApplications: mockSetApplications,
        setAgentApplications: mockSetAgentApplications,
        setSavedProperties: mockSetSavedProperties,
      }))

      unmount()
      unmount() // Multiple unmounts should not cause errors

      expect(mockSupabase.removeChannel).toHaveBeenCalledTimes(5)
    })
  })
})