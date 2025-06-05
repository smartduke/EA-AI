import { adaptSupabaseSession, type AdaptedSession } from './session-adapter';
import { createClient } from './server';

export async function auth(): Promise<AdaptedSession> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }

  try {
    const supabase = await createClient();

    // Use getUser() for secure authentication instead of getSession()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Create a session-like object for the adapter
    const mockSession = {
      user,
      access_token: '', // Not needed for our use case
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: '', // Not needed for our use case
    };

    return adaptSupabaseSession(mockSession);
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}
