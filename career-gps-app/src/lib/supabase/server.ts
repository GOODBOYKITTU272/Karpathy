// ============================================================
// lib/supabase/server.ts
// Server-side Supabase client — uses service role key
// ONLY use in API routes, server components, and scripts
// NEVER expose or import this in browser/client components
// ============================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only client with service role privileges.
 * Bypasses RLS — use only for trusted server operations.
 * Never assign SUPABASE_SERVICE_ROLE_KEY to a NEXT_PUBLIC_ variable.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Check your .env.local file.'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
