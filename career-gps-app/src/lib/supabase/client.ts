// ============================================================
// lib/supabase/client.ts
// Browser-side Supabase client — uses NEXT_PUBLIC_ anon key only
// Safe for use in React components and client-side hooks
// ============================================================

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
