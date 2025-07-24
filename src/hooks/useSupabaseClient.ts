import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Custom hook that returns a memoized Supabase client instance.
 * This prevents creating new client instances on every render,
 * which can cause infinite loops and performance issues.
 */
export function useSupabaseClient() {
  const supabase = useMemo(() => createClient(), [])
  return supabase
}
