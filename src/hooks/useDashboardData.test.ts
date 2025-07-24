import { renderHook, waitFor } from '@testing-library/react'
import { act } from '@testing-library/react-hooks'  
import { User } from '@supabase/supabase-js'
import { useDashboardData } from './useDashboardData'
import { useSupabaseClient } from './useSupabaseClient'
import {
  getAgentProperties,
  getAllActiveProperties,
  getTenantApplications,
  getSavedProperties,
  getAgentApplications,
} from '@/lib/utils/dashboard'
import { Property, Application, SavedProperty, UserProfile } from '@/types/dashboard'

// Mock console.error to prevent noise in test output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

// Mock the dependencies
jest.mock('./useSupabaseClient')
jest.mock('@/lib/utils/dashboard')

const mockUseSupabaseClient = useSupabaseClient as jest.MockedFunction<typeof useSupabaseClient>
const mockGetAgentProperties = getAgentProperties as jest.MockedFunction<typeof getAgentProperties>
const mockGetAllActiveProperties = getAllActiveProperties as jest.MockedFunction<typeof getAllActiveProperties>
const mockGetTenantApplications = getTenantApplications as jest.MockedFunction<typeof getTenantApplications>
const mockGetSavedProperties = getSavedProperties as jest.MockedFunction<typeof getSavedProperties>
const mockGetAgentApplications = getAgentApplications as jest.MockedFunction<typeof getAgentApplications>

describe('useDashboardData Hook Tests', () => {
  const mockSupabaseClient = {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn() }
  } as any

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    role: 'authenticated'
  }

  const mockAgentProfile: UserProfile = {
    id: 'user-123',
    full_name: 'John Agent',
    role: 'agent',
    agent_status: 'active',
    is_verified_agent: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }

  const mockTenantProfile: UserProfile = {
    id: 'user-456',
    full_name: 'Jane Tenant',
    role: 'tenant',
    agent_status: 'not_applicable',
    is_verified_agent: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }

  const mockProperties: Property[] = [
    {
      id: 'prop-1',
      title: 'Luxury Apartment Downtown',
      description: 'Beautiful 2-bedroom apartment in the heart of the city',
      location: '123 Main St, City Center',
      city: 'Harare',
      state: 'Harare Province',
      zip_code: '00263',
      property_type: 'apartment',
      price: 500,
      bedrooms: 2,
      bathrooms: 2,
      image_url: 'https://example.com/image1.jpg',
      image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      has_internet: true,
      has_parking: true,
      has_air_conditioning: true,
      is_furnished: true,
      has_pool: false,
      has_power: true,
      has_water: true,
      has_tv: true,
      has_laundry: false,
      has_security_system: true,
      view_count: 45,
      created_at: '2023-01-01T00:00:00Z',
      created_by: 'user-123',
      active: true,
      total_rooms: 4,
      full_rooms: 1,
      available_rooms: 3,
      total_beds: 8,
      available_beds: 6,
      occupancy_rate: 25
    }
  ]

  const mockApplications: Application[] = [
    {
      id: 'app-1',
      bed_id: 'bed-1',
      tenant_id: 'user-456',
      status: 'pending',
      message: 'Looking forward to renting this space',
      transaction_code: 'TXN123456',
      payment_verified: false,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      property: mockProperties[0],
      tenant: {
        id: 'user-456',
        full_name: 'Jane Tenant',
        ecocash_number: '+263771234567',
        registration_number: 'REG123',
        national_id: 'ID123456789',
        gender: 'female'
      },
      bed: {
        id: 'bed-1',
        bed_number: 1,
        room: {
          id: 'room-1',
          name: 'Room A',
          room_type: 'double',
          price_per_bed: 250
        }
      }
    }
  ]

  const mockSavedProperties: SavedProperty[] = [
    {
      id: 'saved-1',
      bed_id: 'bed-1',
      user_id: 'user-456',
      created_at: '2023-01-01T00:00:00Z',
      property: mockProperties[0]
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockConsoleError.mockClear()
    mockUseSupabaseClient.mockReturnValue(mockSupabaseClient)
    
    // Set up default successful mocks
    mockGetAllActiveProperties.mockResolvedValue(mockProperties)
    mockGetAgentProperties.mockResolvedValue(mockProperties)
    mockGetAgentApplications.mockResolvedValue(mockApplications)
    mockGetTenantApplications.mockResolvedValue(mockApplications)
    mockGetSavedProperties.mockResolvedValue(mockSavedProperties)
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('Initial State and Basic Functionality', () => {
    it('should initialize with correct default state values', () => {
      const { result } = renderHook(() => useDashboardData({ user: null, profile: null }))

      expect(result.current.properties).toEqual([])
      expect(result.current.allProperties).toEqual([])
      expect(result.current.applications).toEqual([])
      expect(result.current.agentApplications).toEqual([])
      expect(result.current.savedProperties).toEqual([])
      expect(result.current.loading).toBe(true)
      expect(result.current.error).toBe('')
    })

    it('should provide all expected interface methods and properties', () => {
      const { result } = renderHook(() => useDashboardData({ user: null, profile: null }))

      // Check data properties
      expect(result.current).toHaveProperty('properties')
      expect(result.current).toHaveProperty('allProperties')
      expect(result.current).toHaveProperty('applications')
      expect(result.current).toHaveProperty('agentApplications')
      expect(result.current).toHaveProperty('savedProperties')
      
      // Check state properties
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('error')
      
      // Check action methods
      expect(result.current).toHaveProperty('refreshData')
      expect(typeof result.current.refreshData).toBe('function')
      
      // Check setter methods
      expect(result.current).toHaveProperty('setProperties')
      expect(result.current).toHaveProperty('setAllProperties')
      expect(result.current).toHaveProperty('setApplications')
      expect(result.current).toHaveProperty('setAgentApplications')
      expect(result.current).toHaveProperty('setSavedProperties')
      
      // Ensure all setters are functions
      expect(typeof result.current.setProperties).toBe('function')
      expect(typeof result.current.setAllProperties).toBe('function')
      expect(typeof result.current.setApplications).toBe('function')
      expect(typeof result.current.setAgentApplications).toBe('function')
      expect(typeof result.current.setSavedProperties).toBe('function')
    })
  })

  describe('Data Loading Conditions', () => {
    it('should not load data when user is null', async () => {
      const { result } = renderHook(() => useDashboardData({ user: null, profile: mockAgentProfile }))

      // Wait a bit to ensure no async operations start
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockGetAllActiveProperties).not.toHaveBeenCalled()
      expect(mockGetAgentProperties).not.toHaveBeenCalled()
      expect(mockGetTenantApplications).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(true)
    })

    it('should not load data when profile is null', async () => {
      const { result } = renderHook(() => useDashboardData({ user: mockUser, profile: null }))

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockGetAllActiveProperties).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(true)
    })

    it('should not load data when both user and profile are null', async () => {
      const { result } = renderHook(() => useDashboardData({ user: null, profile: null }))

      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockGetAllActiveProperties).not.toHaveBeenCalled()
      expect(result.current.loading).toBe(true)
    })
  })

  describe('Agent Role Data Loading', () => {
    it('should load complete agent data when user is active agent', async () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verify all agent-specific API calls were made
      expect(mockGetAllActiveProperties).toHaveBeenCalledWith(mockSupabaseClient)
      expect(mockGetAgentProperties).toHaveBeenCalledWith(mockSupabaseClient, mockUser.id)
      expect(mockGetAgentApplications).toHaveBeenCalledWith(mockSupabaseClient, mockUser.id)
      
      // Verify tenant-specific calls were NOT made
      expect(mockGetTenantApplications).not.toHaveBeenCalled()
      expect(mockGetSavedProperties).not.toHaveBeenCalled()
      
      // Verify data was set correctly
      expect(result.current.allProperties).toEqual(mockProperties)
      expect(result.current.properties).toEqual(mockProperties)
      expect(result.current.agentApplications).toEqual(mockApplications)
      expect(result.current.applications).toEqual([])
      expect(result.current.savedProperties).toEqual([])
      expect(result.current.error).toBe('')
    })

    it('should not load agent-specific data when agent status is inactive', async () => {
      const inactiveAgentProfile = { ...mockAgentProfile, agent_status: 'pending_payment' as const }
      
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: inactiveAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should load all properties but not agent-specific data
      expect(mockGetAllActiveProperties).toHaveBeenCalledWith(mockSupabaseClient)
      expect(mockGetAgentProperties).not.toHaveBeenCalled()
      expect(mockGetAgentApplications).not.toHaveBeenCalled()
      
      expect(result.current.allProperties).toEqual(mockProperties)
      expect(result.current.properties).toEqual([])
      expect(result.current.agentApplications).toEqual([])
    })

    it('should handle different agent status values correctly', async () => {
      const statusTests = [
        { status: 'pending_verification' as const, shouldLoad: false },
        { status: 'pending_payment' as const, shouldLoad: false },
        { status: 'not_applicable' as const, shouldLoad: false },
        { status: 'active' as const, shouldLoad: true }
      ]

      for (const test of statusTests) {
        jest.clearAllMocks()
        const profile = { ...mockAgentProfile, agent_status: test.status }
        
        const { result, unmount } = renderHook(() => useDashboardData({ 
          user: mockUser, 
          profile 
        }))

        await waitFor(() => {
          expect(result.current.loading).toBe(false)
        })

        if (test.shouldLoad) {
          expect(mockGetAgentProperties).toHaveBeenCalled()
          expect(mockGetAgentApplications).toHaveBeenCalled()
        } else {
          expect(mockGetAgentProperties).not.toHaveBeenCalled()
          expect(mockGetAgentApplications).not.toHaveBeenCalled()
        }

        unmount()
      }
    })
  })

  describe('Tenant Role Data Loading', () => {
    it('should load complete tenant data when user is tenant', async () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockTenantProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Verify tenant-specific API calls were made
      expect(mockGetAllActiveProperties).toHaveBeenCalledWith(mockSupabaseClient)
      expect(mockGetTenantApplications).toHaveBeenCalledWith(mockSupabaseClient, mockUser.id)
      expect(mockGetSavedProperties).toHaveBeenCalledWith(mockSupabaseClient, mockUser.id)
      
      // Verify agent-specific calls were NOT made
      expect(mockGetAgentProperties).not.toHaveBeenCalled()
      expect(mockGetAgentApplications).not.toHaveBeenCalled()
      
      // Verify data was set correctly
      expect(result.current.allProperties).toEqual(mockProperties)
      expect(result.current.applications).toEqual(mockApplications)
      expect(result.current.savedProperties).toEqual(mockSavedProperties)
      expect(result.current.properties).toEqual([])
      expect(result.current.agentApplications).toEqual([])
      expect(result.current.error).toBe('')
    })

    it('should handle tenant with different agent_status values', async () => {
      const tenantWithDifferentStatus = { 
        ...mockTenantProfile, 
        agent_status: 'pending_payment' as const 
      }
      
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: tenantWithDifferentStatus 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should still load tenant data regardless of agent_status
      expect(mockGetTenantApplications).toHaveBeenCalled()
      expect(mockGetSavedProperties).toHaveBeenCalled()
      expect(mockGetAgentProperties).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling Scenarios', () => {
    it('should handle getAllActiveProperties error gracefully', async () => {
      const errorMessage = 'Failed to fetch active properties'
      mockGetAllActiveProperties.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe(errorMessage)
      expect(result.current.allProperties).toEqual([])
      expect(mockConsoleError).toHaveBeenCalledWith('Data loading error:', expect.any(Error))
    })

    it('should handle agent data loading errors', async () => {
      const errorMessage = 'Failed to fetch agent properties'
      mockGetAgentProperties.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe(errorMessage)
      expect(mockConsoleError).toHaveBeenCalledWith('Data loading error:', expect.any(Error))
    })

    it('should handle tenant data loading errors', async () => {
      const errorMessage = 'Failed to fetch tenant applications'
      mockGetTenantApplications.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockTenantProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe(errorMessage)
      expect(mockConsoleError).toHaveBeenCalledWith('Data loading error:', expect.any(Error))
    })

    it('should handle non-Error objects thrown as errors', async () => {
      mockGetAllActiveProperties.mockRejectedValue('String error message')

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Failed to load dashboard data')
      expect(mockConsoleError).toHaveBeenCalledWith('Data loading error:', 'String error message')
    })

    it('should handle Promise.all rejection in agent data loading', async () => {
      mockGetAgentProperties.mockResolvedValue(mockProperties)
      mockGetAgentApplications.mockRejectedValue(new Error('Agent applications failed'))

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Agent applications failed')
    })

    it('should handle Promise.all rejection in tenant data loading', async () => {
      mockGetTenantApplications.mockResolvedValue(mockApplications)
      mockGetSavedProperties.mockRejectedValue(new Error('Saved properties failed'))

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockTenantProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Saved properties failed')
    })
  })

  describe('Effect Dependencies and Re-rendering', () => {
    it('should reload data when user.id changes', async () => {
      const { rerender } = renderHook(
        ({ user, profile }) => useDashboardData({ user, profile }),
        { initialProps: { user: mockUser, profile: mockAgentProfile } }
      )

      await waitFor(() => {
        expect(mockGetAllActiveProperties).toHaveBeenCalledTimes(1)
      })

      const newUser = { ...mockUser, id: 'new-user-id' }
      rerender({ user: newUser, profile: mockAgentProfile })

      await waitFor(() => {
        expect(mockGetAllActiveProperties).toHaveBeenCalledTimes(2)
        expect(mockGetAgentProperties).toHaveBeenCalledWith(mockSupabaseClient, 'new-user-id')
      })
    })

    it('should reload data when profile.role changes', async () => {
      const { rerender } = renderHook(
        ({ user, profile }) => useDashboardData({ user, profile }),
        { initialProps: { user: mockUser, profile: mockAgentProfile } }
      )

      await waitFor(() => {
        expect(mockGetAgentProperties).toHaveBeenCalledTimes(1)
        expect(mockGetTenantApplications).not.toHaveBeenCalled()
      })

      rerender({ user: mockUser, profile: mockTenantProfile })

      await waitFor(() => {
        expect(mockGetTenantApplications).toHaveBeenCalledTimes(1)
        expect(mockGetSavedProperties).toHaveBeenCalledTimes(1)
      })
    })

    it('should reload data when profile.agent_status changes', async () => {
      const { rerender } = renderHook(
        ({ user, profile }) => useDashboardData({ user, profile }),
        { initialProps: { user: mockUser, profile: mockAgentProfile } }
      )

      await waitFor(() => {
        expect(mockGetAgentProperties).toHaveBeenCalledTimes(1)
      })

      const inactiveProfile = { ...mockAgentProfile, agent_status: 'pending_payment' as const }
      rerender({ user: mockUser, profile: inactiveProfile })

      await waitFor(() => {
        expect(mockGetAllActiveProperties).toHaveBeenCalledTimes(2)
      })
    })

    it('should not trigger unnecessary re-renders when dependencies do not change', async () => {
      const { rerender } = renderHook(
        ({ user, profile }) => useDashboardData({ user, profile }),
        { initialProps: { user: mockUser, profile: mockAgentProfile } }
      )

      await waitFor(() => {
        expect(mockGetAllActiveProperties).toHaveBeenCalledTimes(1)
      })

      // Re-render with same props
      rerender({ user: mockUser, profile: mockAgentProfile })

      // Should not trigger additional API calls
      expect(mockGetAllActiveProperties).toHaveBeenCalledTimes(1)
    })
  })

  describe('RefreshData Function', () => {
    it('should refresh agent data successfully', async () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Clear previous calls
      jest.clearAllMocks()

      await act(async () => {
        await result.current.refreshData()
      })

      expect(mockGetAllActiveProperties).toHaveBeenCalledWith(mockSupabaseClient)
      expect(mockGetAgentProperties).toHaveBeenCalledWith(mockSupabaseClient, mockUser.id)
      expect(mockGetAgentApplications).toHaveBeenCalledWith(mockSupabaseClient, mockUser.id)
      expect(mockGetTenantApplications).not.toHaveBeenCalled()
      expect(mockGetSavedProperties).not.toHaveBeenCalled()
    })

    it('should refresh tenant data successfully', async () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockTenantProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      jest.clearAllMocks()

      await act(async () => {
        await result.current.refreshData()
      })

      expect(mockGetAllActiveProperties).toHaveBeenCalledWith(mockSupabaseClient)
      expect(mockGetTenantApplications).toHaveBeenCalledWith(mockSupabaseClient, mockUser.id)
      expect(mockGetSavedProperties).toHaveBeenCalledWith(mockSupabaseClient, mockUser.id)
      expect(mockGetAgentProperties).not.toHaveBeenCalled()
      expect(mockGetAgentApplications).not.toHaveBeenCalled()
    })

    it('should handle refresh errors and set error state', async () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const errorMessage = 'Refresh operation failed'
      mockGetAllActiveProperties.mockRejectedValue(new Error(errorMessage))

      await act(async () => {
        await result.current.refreshData()
      })

      expect(result.current.error).toBe(errorMessage)
      expect(mockConsoleError).toHaveBeenCalledWith('Data refresh error:', expect.any(Error))
    })

    it('should not refresh when user is null', async () => {
      const { result, rerender } = renderHook(
        ({ user, profile }) => useDashboardData({ user, profile }),
        { initialProps: { user: mockUser, profile: mockAgentProfile } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      rerender({ user: null, profile: mockAgentProfile })
      jest.clearAllMocks()

      await act(async () => {
        await result.current.refreshData()
      })

      expect(mockGetAllActiveProperties).not.toHaveBeenCalled()
    })

    it('should not refresh when profile is null', async () => {
      const { result, rerender } = renderHook(
        ({ user, profile }) => useDashboardData({ user, profile }),
        { initialProps: { user: mockUser, profile: mockAgentProfile } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      rerender({ user: mockUser, profile: null })
      jest.clearAllMocks()

      await act(async () => {
        await result.current.refreshData()
      })

      expect(mockGetAllActiveProperties).not.toHaveBeenCalled()
    })
  })

  describe('State Setters and Manual State Management', () => {
    it('should provide working state setters for all data arrays', async () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newProperties = [{ ...mockProperties[0], id: 'new-prop', title: 'Updated Property' }]
      
      act(() => {
        result.current.setProperties(newProperties)
      })
      expect(result.current.properties).toEqual(newProperties)

      act(() => {
        result.current.setAllProperties(newProperties)
      })
      expect(result.current.allProperties).toEqual(newProperties)

      const newApplications = [{ ...mockApplications[0], id: 'new-app', status: 'approved' as const }]
      
      act(() => {
        result.current.setApplications(newApplications)
      })
      expect(result.current.applications).toEqual(newApplications)

      act(() => {
        result.current.setAgentApplications(newApplications)
      })
      expect(result.current.agentApplications).toEqual(newApplications)

      const newSavedProperties = [{ ...mockSavedProperties[0], id: 'new-saved' }]
      
      act(() => {
        result.current.setSavedProperties(newSavedProperties)
      })
      expect(result.current.savedProperties).toEqual(newSavedProperties)
    })

    it('should allow clearing arrays using setters', async () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // All arrays should be populated initially
      expect(result.current.properties.length).toBeGreaterThan(0)
      expect(result.current.allProperties.length).toBeGreaterThan(0)

      act(() => {
        result.current.setProperties([])
        result.current.setAllProperties([])
        result.current.setApplications([])
        result.current.setAgentApplications([])
        result.current.setSavedProperties([])
      })

      expect(result.current.properties).toEqual([])
      expect(result.current.allProperties).toEqual([])
      expect(result.current.applications).toEqual([])
      expect(result.current.agentApplications).toEqual([])
      expect(result.current.savedProperties).toEqual([])
    })
  })

  describe('Loading States and Transitions', () => {
    it('should set loading to true at start of data loading', () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      expect(result.current.loading).toBe(true)
    })

    it('should set loading to false after successful data loading', async () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should set loading to false after failed data loading', async () => {
      mockGetAllActiveProperties.mockRejectedValue(new Error('Test error'))

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should maintain loading state during refresh operations', async () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Mock slow API response
      let resolvePromise: () => void
      const slowPromise = new Promise<Property[]>((resolve) => {
        resolvePromise = () => resolve(mockProperties)
      })
      mockGetAllActiveProperties.mockReturnValue(slowPromise)

      // Start refresh operation
      act(() => {
        result.current.refreshData()
      })

      // Should not affect loading state (refresh doesn't set loading)
      expect(result.current.loading).toBe(false)

      // Resolve the promise
      act(() => {
        resolvePromise()
      })
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle empty arrays returned from API calls', async () => {
      mockGetAllActiveProperties.mockResolvedValue([])
      mockGetAgentProperties.mockResolvedValue([])
      mockGetAgentApplications.mockResolvedValue([])

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.allProperties).toEqual([])
      expect(result.current.properties).toEqual([])
      expect(result.current.agentApplications).toEqual([])
      expect(result.current.error).toBe('')
    })

    it('should handle undefined role gracefully', async () => {
      const undefinedRoleProfile = { ...mockAgentProfile, role: undefined as any }

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: undefinedRoleProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockGetAgentProperties).not.toHaveBeenCalled()
      expect(mockGetTenantApplications).not.toHaveBeenCalled()
      expect(result.current.allProperties).toEqual(mockProperties)
    })

    it('should handle admin role (not explicitly supported)', async () => {
      const adminProfile = { ...mockAgentProfile, role: 'admin' as const }

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: adminProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should only load all properties, no role-specific data
      expect(mockGetAllActiveProperties).toHaveBeenCalled()
      expect(mockGetAgentProperties).not.toHaveBeenCalled()
      expect(mockGetTenantApplications).not.toHaveBeenCalled()
      expect(result.current.allProperties).toEqual(mockProperties)
    })

    it('should handle malformed user ID gracefully', async () => {
      const userWithEmptyId = { ...mockUser, id: '' }

      const { result } = renderHook(() => useDashboardData({ 
        user: userWithEmptyId, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should still call getAllActiveProperties
      expect(mockGetAllActiveProperties).toHaveBeenCalled()
      // Should call agent methods with empty string ID
      expect(mockGetAgentProperties).toHaveBeenCalledWith(mockSupabaseClient, '')
    })

    it('should handle network timeout scenarios', async () => {
      const timeoutError = new Error('Network timeout')
      timeoutError.name = 'TimeoutError'
      mockGetAllActiveProperties.mockRejectedValue(timeoutError)

      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('Network timeout')
      expect(mockConsoleError).toHaveBeenCalledWith('Data loading error:', timeoutError)
    })
  })

  describe('Complex Integration Scenarios', () => {
    it('should handle rapid user/profile changes', async () => {
      const { rerender } = renderHook(
        ({ user, profile }) => useDashboardData({ user, profile }),
        { initialProps: { user: mockUser, profile: mockAgentProfile } }
      )

      await waitFor(() => {
        expect(mockGetAllActiveProperties).toHaveBeenCalledTimes(1)
      })

      // Rapid changes
      rerender({ user: mockUser, profile: mockTenantProfile })
      rerender({ user: { ...mockUser, id: 'new-id' }, profile: mockTenantProfile })
      rerender({ user: null, profile: null })

      // Should handle the changes gracefully
      await waitFor(() => {
        expect(mockGetAllActiveProperties).toHaveBeenCalledTimes(3)
      })
    })

    it('should maintain state consistency during concurrent operations', async () => {
      const { result } = renderHook(() => useDashboardData({ 
        user: mockUser, 
        profile: mockAgentProfile 
      }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simulate concurrent state updates and refresh
      await act(async () => {
        result.current.setProperties([])
        await result.current.refreshData()
        result.current.setAllProperties([{ ...mockProperties[0], id: 'manual-prop' }])
      })

      // Final state should reflect the last operations
      expect(result.current.properties).toEqual(mockProperties) // From refresh
      expect(result.current.allProperties[0].id).toBe('manual-prop') // From manual set
    })
  })
})