import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page() {
  const id = generateUUID();

  const supabase = await createClient();
  const {
    data: { session: supabaseSession },
  } = await supabase.auth.getSession();

  // Create session object - either from authenticated user or guest
  const session = supabaseSession
    ? {
        // Authenticated user session
        user: {
          id: supabaseSession.user.id,
          email: supabaseSession.user.email,
          name:
            supabaseSession.user.user_metadata?.full_name ||
            supabaseSession.user.email,
          image: supabaseSession.user.user_metadata?.avatar_url,
        },
        expires: supabaseSession.expires_at
          ? new Date(supabaseSession.expires_at * 1000).toISOString()
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    : {
        // Guest user session - use proper UUID for database compatibility
        user: {
          id: generateUUID(),
          email: `guest-${Date.now()}@guest.local`,
          name: 'Guest User',
          image: undefined,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
