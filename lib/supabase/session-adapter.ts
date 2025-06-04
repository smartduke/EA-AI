import type { Session as SupabaseSession } from '@supabase/supabase-js';

// Adapter to convert Supabase session to NextAuth-compatible session
export function adaptSupabaseSession(supabaseSession: SupabaseSession | null) {
  if (!supabaseSession) return null;

  const expiresAt = supabaseSession.expires_at
    ? new Date(supabaseSession.expires_at * 1000).toISOString()
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Default to 24 hours from now

  return {
    user: {
      id: supabaseSession.user.id,
      email: supabaseSession.user.email,
      name:
        supabaseSession.user.user_metadata?.full_name ||
        supabaseSession.user.email,
      image: supabaseSession.user.user_metadata?.avatar_url,
    },
    expires: expiresAt,
  };
}

export type AdaptedSession = {
  user: {
    id: string;
    email?: string;
    name?: string;
    image?: string;
  };
  expires: string;
} | null;
