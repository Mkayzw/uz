import { renderHook, act, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/dashboard'
import { getProfile } from '@/lib/utils/dashboard'
import { useSupabaseClient } from './useSupabaseClient'
import { useDashboardAuth } from './useDashboardAuth'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@/lib/utils/dashboard')
jest.mock('./useSupabaseClient')

// Mock console methods to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

// Mock window.location
const mockLocation = {
  pathname: '/dashboard',
  search: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useDashboardAuth Hook', () => {
  const mockPush = jest.fn()
  const mockSupabase = {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
  }
  const mockGetProfile = getProfile as jest.MockedFunction<typeof getProfile>
  const mockUseSupabaseClient = useSupabaseClient as jest.MockedFunction<typeof useSupabaseClient>
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
  }

  const mockProfile: UserProfile = {
    id: '123',
    full_name: 'Test User',
    role: 'tenant',
    phone_number: '+1234567890',
    agent_status: 'not_applicable',
    is_verified_agent: false,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockConsoleError.mockClear()
    mockUseRouter.mockReturnValue({ push: mockPush } as any)
    mockUseSupabaseClient.mockReturnValue(mockSupabase as any)
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.getItem.mockClear()
    
    // Reset window.location
    mockLocation.pathname = '/dashboard'
    mockLocation.search = ''
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('Initial State and Setup', () => {
    it('should initialize with correct default state', () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
      expect(result.current.error).toBe('')
      expect(result.current.displayName).toBe('User')
      expect(typeof result.current.handleSignOut).toBe('function')
    })

    it('should call useSupabaseClient and useRouter on mount', () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      renderHook(() => useDashboardAuth())

      expect(mockUseSupabaseClient).toHaveBeenCalled()
      expect(mockUseRouter).toHaveBeenCalled()
    })
  })

  describe('Authentication Flow - No Session', () => {
    it('should redirect to login when no session exists', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockPush).toHaveBeenCalledWith('/auth/login')
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('should store redirect path when on protected page (not dashboard or auth)', async () => {
      mockLocation.pathname = '/some-protected-page'
      mockLocation.search = '?param=value'
      
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'redirect_after_auth',
          '/some-protected-page?param=value'
        )
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should NOT store redirect path for dashboard page', async () => {
      mockLocation.pathname = '/dashboard'
      
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should NOT store redirect path for auth pages', async () => {
      mockLocation.pathname = '/auth/register'
      
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should handle session without user', async () => {
      const mockSession = { user: null }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should handle empty session object', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: {} as any }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })
  })

  describe('Authentication Flow - With Session', () => {
    it('should set user and profile when valid session exists', async () => {
      const mockSession = { user: mockUser }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
      mockGetProfile.mockResolvedValue(mockProfile)

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.profile).toEqual(mockProfile)
        expect(result.current.error).toBe('')
      })

      expect(mockGetProfile).toHaveBeenCalledWith(mockSupabase, mockUser)
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle successful user authentication with null profile', async () => {
      const mockSession = { user: mockUser }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
      mockGetProfile.mockResolvedValue(null)

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.profile).toBe(null)
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle general authentication errors', async () => {
      const error = new Error('Authentication failed')
      mockSupabase.auth.getSession.mockRejectedValue(error)
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Authentication failed')
        expect(result.current.user).toBe(null)
        expect(result.current.profile).toBe(null)
      })

      expect(mockConsoleError).toHaveBeenCalledWith('Auth initialization error:', error)
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should redirect on Invalid JWT error', async () => {
      const error = new Error('Invalid JWT')
      mockSupabase.auth.getSession.mockRejectedValue(error)
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Invalid JWT')
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should handle non-Error exceptions', async () => {
      mockSupabase.auth.getSession.mockRejectedValue('String error')
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to initialize authentication')
        expect(result.current.loading).toBe(false)
      })
    })

    it('should handle profile fetch errors during initialization', async () => {
      const mockSession = { user: mockUser }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
      const profileError = new Error('Profile fetch failed')
      mockGetProfile.mockRejectedValue(profileError)

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.profile).toBe(null)
        expect(result.current.error).toBe('Profile fetch failed')
        expect(result.current.loading).toBe(false)
      })

      expect(mockConsoleError).toHaveBeenCalledWith('Auth initialization error:', profileError)
    })
  })

  describe('Auth State Changes', () => {
    it('should handle SIGNED_OUT event correctly', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      
      let authCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        authCallback('SIGNED_OUT', null)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('should handle SIGNED_IN event with successful profile fetch', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockGetProfile.mockResolvedValue(mockProfile)
      
      let authCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        authCallback('SIGNED_IN', { user: mockUser })
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.profile).toEqual(mockProfile)
      })

      expect(mockGetProfile).toHaveBeenCalledWith(mockSupabase, mockUser)
    })

    it('should handle SIGNED_IN event with profile fetch error', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      const profileError = new Error('Profile error')
      mockGetProfile.mockRejectedValue(profileError)
      
      let authCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        authCallback('SIGNED_IN', { user: mockUser })
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.profile).toBe(null)
        expect(result.current.error).toBe('Profile error')
      })

      expect(mockConsoleError).toHaveBeenCalledWith('Profile fetch error:', profileError)
    })

    it('should handle SIGNED_IN event without user', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      
      let authCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        authCallback('SIGNED_IN', { user: null })
      })

      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
      expect(mockGetProfile).not.toHaveBeenCalled()
    })

    it('should ignore other auth events', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      
      let authCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        authCallback('TOKEN_REFRESHED', { user: mockUser })
      })

      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
      expect(mockGetProfile).not.toHaveBeenCalled()
    })
  })

  describe('Sign Out Functionality', () => {
    it('should handle sign out successfully', async () => {
      const mockSession = { user: mockUser }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
      mockGetProfile.mockResolvedValue(mockProfile)
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      await act(async () => {
        await result.current.handleSignOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should handle sign out with error gracefully', async () => {
      const mockSession = { user: mockUser }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
      mockGetProfile.mockResolvedValue(mockProfile)
      mockSupabase.auth.signOut.mockRejectedValue(new Error('Sign out failed'))

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      await act(async () => {
        await result.current.handleSignOut()
      })

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('Display Name Logic', () => {
    it('should return full name when profile exists with full_name', async () => {
      const mockSession = { user: mockUser }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
      mockGetProfile.mockResolvedValue(mockProfile)

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.displayName).toBe('Test User')
      })
    })

    it('should return email username when profile exists but no full_name', async () => {
      const mockSession = { user: mockUser }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
      mockGetProfile.mockResolvedValue({ ...mockProfile, full_name: null })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.displayName).toBe('test')
      })
    })

    it('should return email username when no profile but user exists', async () => {
      const mockSession = { user: mockUser }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
      mockGetProfile.mockResolvedValue(null)

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.displayName).toBe('test')
      })
    })

    it('should return "User" when no user email exists', async () => {
      const userWithoutEmail = { ...mockUser, email: undefined }
      const mockSession = { user: userWithoutEmail }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
      mockGetProfile.mockResolvedValue({ ...mockProfile, full_name: null })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.displayName).toBe('User')
      })
    })

    it('should return "User" when no user exists', () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      expect(result.current.displayName).toBe('User')
    })

    it('should handle email with multiple @ symbols correctly', async () => {
      const userWithComplexEmail = { ...mockUser, email: 'test@subdomain@example.com' }
      const mockSession = { user: userWithComplexEmail }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
      mockGetProfile.mockResolvedValue({ ...mockProfile, full_name: null })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.displayName).toBe('test')
      })
    })
  })

  describe('Cleanup and Memory Management', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const mockUnsubscribe = jest.fn()
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      })

      const { unmount } = renderHook(() => useDashboardAuth())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Initialization Guard', () => {
    it('should prevent multiple initializations on re-renders', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      const { rerender } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1)
      })

      rerender()
      rerender()

      // Should still only be called once
      expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(1)
    })

    it('should reset initialization flag on SIGNED_OUT', async () => {
      const mockSession = { user: mockUser }
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })
      mockGetProfile.mockResolvedValue(mockProfile)
      
      let authCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      act(() => {
        authCallback('SIGNED_OUT', null)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
    })
  })

  describe('Edge Cases', () => {
    it('should handle complex redirect paths with query parameters and hash', async () => {
      mockLocation.pathname = '/protected-page'
      mockLocation.search = '?param1=value1&param2=value2#section'
      
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'redirect_after_auth',
          '/protected-page?param1=value1&param2=value2#section'
        )
      })
    })

    it('should handle JWT error with substring matching', async () => {
      const error = new Error('Token is invalid - Invalid JWT format')
      mockSupabase.auth.getSession.mockRejectedValue(error)
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.error).toBe('Token is invalid - Invalid JWT format')
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should handle network errors without redirecting', async () => {
      const error = new Error('Network error: Failed to fetch')
      mockSupabase.auth.getSession.mockRejectedValue(error)
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.error).toBe('Network error: Failed to fetch')
        expect(mockPush).not.toHaveBeenCalled()
      })
    })

    it('should handle SIGNED_IN event with non-Error profile fetch failure', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockGetProfile.mockRejectedValue('String error')
      
      let authCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        authCallback('SIGNED_IN', { user: mockUser })
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.error).toBe('Failed to load profile')
      })
    })

    it('should handle concurrent SIGNED_IN events gracefully', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockGetProfile.mockResolvedValue(mockProfile)
      
      let authCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Trigger multiple SIGNED_IN events quickly
      await act(async () => {
        authCallback('SIGNED_IN', { user: mockUser })
        authCallback('SIGNED_IN', { user: mockUser })
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.profile).toEqual(mockProfile)
      })
    })

    it('should handle rapid sign out and sign in sequence', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockGetProfile.mockResolvedValue(mockProfile)
      
      let authCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })

      const { result } = renderHook(() => useDashboardAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Sign in
      await act(async () => {
        authCallback('SIGNED_IN', { user: mockUser })
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      // Sign out
      act(() => {
        authCallback('SIGNED_OUT', null)
      })

      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)

      // Sign in again
      await act(async () => {
        authCallback('SIGNED_IN', { user: mockUser })
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.profile).toEqual(mockProfile)
      })
    })
  })
})