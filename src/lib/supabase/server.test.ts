import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from './server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Mock the external dependencies
vi.mock('@supabase/ssr')
vi.mock('next/headers')

const mockCreateServerClient = vi.mocked(createServerClient)
const mockCookies = vi.mocked(cookies)

describe('Supabase Server Client', () => {
  // Mock implementations
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
  }

  const mockSupabaseClient = {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    channel: vi.fn(),
  }

  beforeEach(() => {
    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock the createServerClient to return our mock client
    mockCreateServerClient.mockReturnValue(mockSupabaseClient as any)
    
    // Mock cookies() to return a promise that resolves to our mock cookie store
    mockCookies.mockReturnValue(Promise.resolve(mockCookieStore as any))
  })

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  describe('createClient function', () => {
    it('should create a Supabase client with correct configuration', () => {
      const cookieStore = mockCookies()
      const client = createClient(cookieStore)

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test-project.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      )
      expect(client).toBe(mockSupabaseClient)
    })

    it('should return the client instance', () => {
      const cookieStore = mockCookies()
      const client = createClient(cookieStore)

      expect(client).toBeDefined()
      expect(typeof client).toBe('object')
    })

    it('should use environment variables for Supabase configuration', () => {
      const customUrl = 'https://custom-project.supabase.co'
      const customKey = 'custom-anon-key'
      
      process.env.NEXT_PUBLIC_SUPABASE_URL = customUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = customKey

      const cookieStore = mockCookies()
      createClient(cookieStore)

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        customUrl,
        customKey,
        expect.any(Object)
      )
    })
  })

  describe('Cookie operations', () => {
    let cookieOperations: any

    beforeEach(() => {
      const cookieStore = mockCookies()
      createClient(cookieStore)
      
      // Extract the cookie operations from the createServerClient call
      const callArgs = mockCreateServerClient.mock.calls[0]
      cookieOperations = callArgs[2].cookies
    })

    describe('get method', () => {
      it('should retrieve cookie value when cookie exists', async () => {
        const mockCookie = { value: 'test-session-token' }
        mockCookieStore.get.mockReturnValue(mockCookie)

        const result = await cookieOperations.get('sb-access-token')

        expect(mockCookieStore.get).toHaveBeenCalledWith('sb-access-token')
        expect(result).toBe('test-session-token')
      })

      it('should return undefined when cookie does not exist', async () => {
        mockCookieStore.get.mockReturnValue(undefined)

        const result = await cookieOperations.get('non-existent-cookie')

        expect(mockCookieStore.get).toHaveBeenCalledWith('non-existent-cookie')
        expect(result).toBeUndefined()
      })

      it('should return undefined when cookie value is null', async () => {
        mockCookieStore.get.mockReturnValue(null)

        const result = await cookieOperations.get('null-cookie')

        expect(result).toBeUndefined()
      })

      it('should handle cookie with undefined value property', async () => {
        const mockCookie = { value: undefined }
        mockCookieStore.get.mockReturnValue(mockCookie)

        const result = await cookieOperations.get('cookie-with-undefined-value')

        expect(result).toBeUndefined()
      })

      it('should handle empty string cookie values', async () => {
        const mockCookie = { value: '' }
        mockCookieStore.get.mockReturnValue(mockCookie)

        const result = await cookieOperations.get('empty-cookie')

        expect(result).toBe('')
      })

      it('should handle async cookie store operations', async () => {
        const asyncCookieStore = {
          get: vi.fn().mockResolvedValue({ value: 'async-token' }),
          set: vi.fn().mockResolvedValue(undefined),
        }
        mockCookies.mockReturnValue(Promise.resolve(asyncCookieStore as any))

        const cookieStore = mockCookies()
        createClient(cookieStore)
        
        const operations = mockCreateServerClient.mock.calls[0][2].cookies
        const result = await operations.get('async-cookie')

        expect(result).toBe('async-token')
      })
    })

    describe('set method', () => {
      it('should set cookie with name, value, and options', async () => {
        const options = { httpOnly: true, secure: true, maxAge: 3600 }

        await cookieOperations.set('sb-access-token', 'new-token-value', options)

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'sb-access-token',
          value: 'new-token-value',
          httpOnly: true,
          secure: true,
          maxAge: 3600,
        })
      })

      it('should set cookie with empty options object', async () => {
        await cookieOperations.set('simple-cookie', 'simple-value', {})

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'simple-cookie',
          value: 'simple-value',
        })
      })

      it('should handle cookie setting errors gracefully', async () => {
        mockCookieStore.set.mockImplementation(() => {
          throw new Error('Cannot set cookie in Server Component')
        })

        // Should not throw - errors are caught and ignored
        await expect(
          cookieOperations.set('test-cookie', 'test-value', {})
        ).resolves.not.toThrow()

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'test-cookie',
          value: 'test-value',
        })
      })

      it('should handle various cookie option types', async () => {
        const complexOptions = {
          maxAge: 86400,
          expires: new Date('2025-12-31T23:59:59Z'),
          path: '/dashboard',
          domain: '.example.com',
          secure: true,
          httpOnly: true,
          sameSite: 'strict' as const,
        }

        await cookieOperations.set('complex-cookie', 'complex-value', complexOptions)

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'complex-cookie',
          value: 'complex-value',
          ...complexOptions,
        })
      })

      it('should handle setting cookies with special characters in values', async () => {
        const specialValue = 'token=abc123&refresh=def456%20encoded'

        await cookieOperations.set('special-cookie', specialValue, {})

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'special-cookie',
          value: specialValue,
        })
      })

      it('should spread options correctly', async () => {
        const originalOptions = { secure: true, httpOnly: true }
        const optionsCopy = { ...originalOptions }

        await cookieOperations.set('spread-test', 'value', originalOptions)

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'spread-test',
          value: 'value',
          ...optionsCopy,
        })
      })
    })

    describe('remove method', () => {
      it('should remove cookie by setting empty value', async () => {
        const options = { path: '/auth', domain: '.example.com' }

        await cookieOperations.remove('sb-refresh-token', options)

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'sb-refresh-token',
          value: '',
          path: '/auth',
          domain: '.example.com',
        })
      })

      it('should remove cookie with empty options', async () => {
        await cookieOperations.remove('simple-cookie', {})

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'simple-cookie',
          value: '',
        })
      })

      it('should handle cookie removal errors gracefully', async () => {
        mockCookieStore.set.mockImplementation(() => {
          throw new Error('Cannot remove cookie in Server Component')
        })

        // Should not throw - errors are caught and ignored
        await expect(
          cookieOperations.remove('test-cookie', {})
        ).resolves.not.toThrow()

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'test-cookie',
          value: '',
        })
      })

      it('should handle removal with expiration-based options', async () => {
        const expirationOptions = {
          path: '/',
          expires: new Date(0), // Expire immediately
          maxAge: -1, // Negative maxAge to expire
        }

        await cookieOperations.remove('expired-cookie', expirationOptions)

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'expired-cookie',
          value: '',
          ...expirationOptions,
        })
      })

      it('should always set value to empty string regardless of options', async () => {
        const options = { value: 'should-be-ignored', secure: true }

        await cookieOperations.remove('override-test', options)

        expect(mockCookieStore.set).toHaveBeenCalledWith({
          name: 'override-test',
          value: '', // Should always be empty string
          secure: true,
        })
      })
    })
  })

  describe('Environment variable handling', () => {
    it('should fail when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      const cookieStore = mockCookies()

      expect(() => createClient(cookieStore)).toThrow()
    })

    it('should fail when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const cookieStore = mockCookies()

      expect(() => createClient(cookieStore)).toThrow()
    })

    it('should handle different Supabase URL formats', () => {
      const testUrls = [
        'https://abc123.supabase.co',
        'https://my-project.supabase.io',
        'https://custom-domain.com',
        'http://localhost:54321', // Local development
      ]

      testUrls.forEach((url) => {
        process.env.NEXT_PUBLIC_SUPABASE_URL = url
        const cookieStore = mockCookies()
        
        createClient(cookieStore)

        expect(mockCreateServerClient).toHaveBeenCalledWith(
          url,
          expect.any(String),
          expect.any(Object)
        )

        vi.clearAllMocks()
      })
    })

    it('should handle empty string environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''
      const cookieStore = mockCookies()

      expect(() => createClient(cookieStore)).toThrow()
    })
  })

  describe('Edge cases and error scenarios', () => {
    it('should handle cookie store that throws on await', async () => {
      const failingCookieStore = Promise.reject(new Error('Cookie store unavailable'))
      
      // The function should still work since errors are caught
      expect(() => createClient(failingCookieStore as any)).not.toThrow()
    })

    it('should handle concurrent cookie operations', async () => {
      const cookieStore = mockCookies()
      createClient(cookieStore)
      
      const cookieOperations = mockCreateServerClient.mock.calls[0][2].cookies
      mockCookieStore.get.mockResolvedValue({ value: 'concurrent-test' })
      
      // Simulate multiple concurrent operations
      const operations = await Promise.allSettled([
        cookieOperations.get('cookie1'),
        cookieOperations.set('cookie2', 'value2', {}),
        cookieOperations.remove('cookie3', {}),
        cookieOperations.get('cookie4'),
        cookieOperations.set('cookie5', 'value5', { secure: true }),
      ])

      // All operations should complete without throwing
      operations.forEach((result) => {
        expect(result.status).toBe('fulfilled')
      })

      expect(mockCookieStore.get).toHaveBeenCalledTimes(2)
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3) // 2 sets + 1 remove
    })

    it('should handle cookie names with special characters', async () => {
      const cookieStore = mockCookies()
      createClient(cookieStore)
      
      const cookieOperations = mockCreateServerClient.mock.calls[0][2].cookies
      const specialNames = [
        'sb-access-token',
        'sb_refresh_token',
        'cookie-with-dashes',
        'cookie.with.dots',
        'cookie123',
        'cookie@special!chars',
      ]

      for (const name of specialNames) {
        await cookieOperations.get(name)
        await cookieOperations.set(name, 'value', {})
        await cookieOperations.remove(name, {})
      }

      expect(mockCookieStore.get).toHaveBeenCalledTimes(specialNames.length)
      expect(mockCookieStore.set).toHaveBeenCalledTimes(specialNames.length * 2)
    })

    it('should handle very long cookie values', async () => {
      const cookieStore = mockCookies()
      createClient(cookieStore)
      
      const cookieOperations = mockCreateServerClient.mock.calls[0][2].cookies
      const longValue = 'x'.repeat(4000) // Very long cookie value
      
      await cookieOperations.set('long-value-cookie', longValue, {})
      
      expect(mockCookieStore.set).toHaveBeenCalledWith({
        name: 'long-value-cookie',
        value: longValue,
      })
    })

    it('should maintain cookie operation isolation', async () => {
      const cookieStore1 = mockCookies()
      const cookieStore2 = mockCookies()
      
      createClient(cookieStore1)
      createClient(cookieStore2)
      
      // Each client should have its own cookie operations
      expect(mockCreateServerClient).toHaveBeenCalledTimes(2)
      
      const operations1 = mockCreateServerClient.mock.calls[0][2].cookies
      const operations2 = mockCreateServerClient.mock.calls[1][2].cookies
      
      expect(operations1).toBeDefined()
      expect(operations2).toBeDefined()
      // They should be different function instances
      expect(operations1.get).not.toBe(operations2.get)
    })

    it('should handle null and undefined values in cookie operations', async () => {
      const cookieStore = mockCookies()
      createClient(cookieStore)
      
      const cookieOperations = mockCreateServerClient.mock.calls[0][2].cookies
      
      // Test with null values
      await cookieOperations.set('null-test', null as any, {})
      expect(mockCookieStore.set).toHaveBeenCalledWith({
        name: 'null-test',
        value: null,
      })

      // Test with undefined values
      await cookieOperations.set('undefined-test', undefined as any, {})
      expect(mockCookieStore.set).toHaveBeenCalledWith({
        name: 'undefined-test',
        value: undefined,
      })
    })
  })

  describe('TypeScript type compatibility', () => {
    it('should accept properly typed cookie store parameter', () => {
      const cookieStore = mockCookies()
      const client = createClient(cookieStore)
      
      expect(client).toBeDefined()
      expect(typeof client).toBe('object')
    })

    it('should work with different cookie option type combinations', async () => {
      const cookieStore = mockCookies()
      createClient(cookieStore)
      
      const cookieOperations = mockCreateServerClient.mock.calls[0][2].cookies
      
      // Test various valid option combinations
      const optionSets = [
        { httpOnly: true },
        { secure: true },
        { sameSite: 'lax' as const },
        { sameSite: 'strict' as const },
        { sameSite: 'none' as const },
        { maxAge: 86400 },
        { path: '/api' },
        { domain: 'example.com' },
        { httpOnly: true, secure: true, sameSite: 'strict' as const, maxAge: 3600 },
        { priority: 'high' as const },
      ]

      for (const options of optionSets) {
        await cookieOperations.set('test-cookie', 'test-value', options)
        await cookieOperations.remove('test-cookie', options)
      }

      expect(mockCookieStore.set).toHaveBeenCalledTimes(optionSets.length * 2)
    })
  })

  describe('Real-world usage patterns', () => {
    it('should handle typical Supabase auth cookie operations', async () => {
      const cookieStore = mockCookies()
      createClient(cookieStore)
      
      const cookieOperations = mockCreateServerClient.mock.calls[0][2].cookies
      
      // Simulate typical auth flow operations
      mockCookieStore.get.mockReturnValue({ value: 'existing-access-token' })
      
      const accessToken = await cookieOperations.get('sb-access-token')
      expect(accessToken).toBe('existing-access-token')
      
      await cookieOperations.set('sb-access-token', 'new-access-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 3600,
      })
      
      await cookieOperations.set('sb-refresh-token', 'new-refresh-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 604800, // 7 days
      })
      
      // Simulate logout - remove tokens
      await cookieOperations.remove('sb-access-token', { path: '/' })
      await cookieOperations.remove('sb-refresh-token', { path: '/' })
      
      expect(mockCookieStore.get).toHaveBeenCalledWith('sb-access-token')
      expect(mockCookieStore.set).toHaveBeenCalledTimes(4) // 2 sets + 2 removes
    })

    it('should handle middleware cookie refresh scenarios', async () => {
      const cookieStore = mockCookies()
      createClient(cookieStore)
      
      const cookieOperations = mockCreateServerClient.mock.calls[0][2].cookies
      
      // Simulate middleware trying to set cookies (which should fail gracefully)
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cannot set cookies in middleware')
      })
      
      // These operations should not throw despite the error
      await expect(cookieOperations.set('sb-access-token', 'token', {})).resolves.not.toThrow()
      await expect(cookieOperations.remove('sb-refresh-token', {})).resolves.not.toThrow()
      
      // But get operations should still work
      mockCookieStore.get.mockReturnValue({ value: 'readable-token' })
      const token = await cookieOperations.get('sb-access-token')
      expect(token).toBe('readable-token')
    })

    it('should handle session refresh flow', async () => {
      const cookieStore = mockCookies()
      createClient(cookieStore)
      
      const cookieOperations = mockCreateServerClient.mock.calls[0][2].cookies
      
      // Simulate session refresh
      mockCookieStore.get
        .mockReturnValueOnce({ value: 'expired-access-token' })
        .mockReturnValueOnce({ value: 'valid-refresh-token' })
      
      const accessToken = await cookieOperations.get('sb-access-token')
      const refreshToken = await cookieOperations.get('sb-refresh-token')
      
      expect(accessToken).toBe('expired-access-token')
      expect(refreshToken).toBe('valid-refresh-token')
      
      // Set new tokens after refresh
      await cookieOperations.set('sb-access-token', 'new-access-token', {
        httpOnly: true,
        secure: true,
        maxAge: 3600,
      })
      
      await cookieOperations.set('sb-refresh-token', 'new-refresh-token', {
        httpOnly: true,
        secure: true,
        maxAge: 604800,
      })
      
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2)
    })
  })

  describe('Integration scenarios', () => {
    it('should work with Next.js App Router server components', () => {
      // Simulate App Router server component context
      const cookieStore = mockCookies()
      const client = createClient(cookieStore)
      
      expect(client).toBeDefined()
      expect(mockCreateServerClient).toHaveBeenCalledOnce()
    })

    it('should wor