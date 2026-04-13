// ============================================================
// CG 160 — Supabase Client Factory for Next.js App
// ============================================================

import { createBrowserClient as _createBrowserClient } from '@supabase/ssr';
import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DB } from '@cg160/db';

export function createBrowserSupabaseClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
          });
        },
      },
    }
  );
}

// Service-role client for API routes and workers
import { createClient } from '@supabase/supabase-js';

let _serviceClient: ReturnType<typeof createClient> | null = null;

export function getServiceClient() {
  if (!_serviceClient) {
    _serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return _serviceClient;
}

export function getDB(): DB {
  return new DB(getServiceClient() as Parameters<typeof DB>[0]);
}
