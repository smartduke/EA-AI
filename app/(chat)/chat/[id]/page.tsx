import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

import { auth } from '@/lib/supabase/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import type { DBMessage } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';
import { generateUUID } from '@/lib/utils';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

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

  // Check access permissions for private chats
  if (chat.visibility === 'private') {
    // If not authenticated, only allow if chat belongs to a guest user (email pattern)
    if (!supabaseSession) {
      // For guest users, allow access to any chat (they can't save anyway)
      // Or you could make this more restrictive based on your needs
    } else if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: '',
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  // Determine if the chat should be readonly for this user
  const isReadonly = supabaseSession
    ? session?.user?.id !== chat.userId
    : false;

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={convertToUIMessages(messagesFromDb)}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType={chat.visibility}
          isReadonly={isReadonly}
          session={session}
          autoResume={true}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType={chat.visibility}
        isReadonly={isReadonly}
        session={session}
        autoResume={true}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
