'use client'

import { useState, useEffect } from 'react'

/**
 * ClientOnly — renders children only after hydration (on the client).
 * Prevents SSR/CSR hydration mismatches for components that use
 * browser-only APIs or generate dynamic IDs (e.g., Radix accordions
 * in certain SSR configurations).
 *
 * Shows a fallback (or nothing) during SSR and the first client render.
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])
  return mounted ? <>{children}</> : <>{fallback}</>
}
