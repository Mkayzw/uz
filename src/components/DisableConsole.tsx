'use client'

import { useEffect } from 'react'

export default function DisableConsole() {
  useEffect(() => {
    // Disable all console output in production builds (client-side)
    if (process.env.NODE_ENV !== 'production') return

    const noop = () => {}
    const methods: (keyof Console)[] = ['log', 'info', 'warn', 'error', 'debug', 'trace']
    const originals: Partial<Record<keyof Console, Console[typeof methods[number]]>> = {}

    methods.forEach((m) => {
      originals[m] = console[m]
      try {
        // @ts-expect-error - overriding console methods intentionally
        console[m] = noop
      } catch {}
    })

    return () => {
      methods.forEach((m) => {
        try {
          if (originals[m]) {
            // @ts-expect-error - restoring console methods intentionally
            console[m] = originals[m]
          }
        } catch {}
      })
    }
  }, [])

  return null
}
