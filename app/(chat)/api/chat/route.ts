import {
  appendClientMessage,
  appendResponseMessages,
  createDataStream,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/lib/supabase/auth';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  getStreamIdsByChatId,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import { generateUUID, getTrailingMessageId } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { webSearch, deepWebSearch } from '@/lib/ai/tools/web-search';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { entitlementsByUserType, type UserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import type { Chat } from '@/lib/db/schema';
import {
  canUserPerformAction,
  incrementUsage,
  getUserSubscription,
} from '@/lib/services/subscription';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

// Guest user limits (hardcoded as per requirements)
const GUEST_LIMITS = {
  searchesPerDay: 1,
  deepSearchesPerDay: 0,
};

// Track usage for guest users in memory (per browser session using IP + User-Agent)
const guestUsageTracker = new Map<
  string,
  { searches: number; deepSearches: number; timestamp: number }
>();

// Helper function to get guest identifier (more persistent than random ID)
function getGuestIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Create a simple hash to keep the key manageable
  const identifier = `${ip}_${userAgent}`;
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `guest_${Math.abs(hash)}`;
}

// Clean up old guest usage entries (older than 24 hours)
function cleanupGuestUsage() {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [key, value] of guestUsageTracker.entries()) {
    if (value.timestamp < oneDayAgo) {
      guestUsageTracker.delete(key);
    }
  }
}

export async function POST(request: Request) {
  // Clean up old guest usage entries
  cleanupGuestUsage();

  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (error) {
    console.error('Invalid request body:', error);
    return new Response('Invalid request body', { status: 400 });
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
      selectedSearchMode,
    } = requestBody;

    const session = await auth();

    // Create guest session if no authenticated session exists
    const effectiveSession = session || {
      user: {
        id: generateUUID(),
        email: `guest-${Date.now()}@guest.local`,
        name: 'Guest User',
        image: undefined,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // Determine user type based on email pattern (guest emails contain @guest.local)
    const userType: UserType = effectiveSession.user.email?.includes(
      '@guest.local',
    )
      ? 'guest'
      : 'regular';

    // Check usage limits BEFORE processing the request
    const isGuest =
      !session?.user || session.user.email?.includes('@guest.local');

    if (isGuest) {
      // Handle guest users
      const guestId = getGuestIdentifier(request);
      const guestUsage = guestUsageTracker.get(guestId) || {
        searches: 0,
        deepSearches: 0,
        timestamp: Date.now(),
      };

      if (selectedSearchMode === 'deep-search') {
        return new Response(
          JSON.stringify({
            error:
              'Deep search is not available for guest users. Please login to access this feature.',
            requiresLogin: true,
            userType: 'guest',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Check if guest has used their one search (only when using search tools)
      if (guestUsage.searches >= GUEST_LIMITS.searchesPerDay) {
        return new Response(
          JSON.stringify({
            error:
              'You have used your free search. Please login to continue searching.',
            requiresLogin: true,
            userType: 'guest',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Update guest usage immediately for search mode
      if (selectedSearchMode === 'search') {
        guestUsageTracker.set(guestId, {
          ...guestUsage,
          searches: guestUsage.searches + 1,
          timestamp: Date.now(),
        });
      }
    } else {
      // Handle authenticated users
      const userId = session.user.id;
      const actionType =
        selectedSearchMode === 'deep-search' ? 'deepSearch' : 'search';

      // Check if user can perform the action
      const canPerform = await canUserPerformAction(userId, actionType);

      if (!canPerform) {
        const subscription = await getUserSubscription(userId);
        const planType = subscription?.planType || 'free';

        const searchType =
          actionType === 'deepSearch' ? 'deep searches' : 'searches';

        let upgradeMessage: string;
        let requiresUpgrade = false;
        let requiresContact = false;

        if (planType === 'free') {
          upgradeMessage = ' Upgrade to Pro for higher limits.';
          requiresUpgrade = true;
        } else {
          upgradeMessage =
            ' Contact us for more usage or your limits will reset tomorrow.';
          requiresContact = true;
        }

        return new Response(
          JSON.stringify({
            error: `You have reached your daily limit of ${searchType}.${upgradeMessage}`,
            requiresUpgrade,
            requiresContact,
            userType: planType === 'pro' ? 'pro' : 'free',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Note: Usage tracking for authenticated users will happen in onFinish callback
      // after successful completion
    }

    const messageCount = await getMessageCountByUserId({
      id: effectiveSession.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new Response(
        'You have exceeded your maximum number of messages for the day! Please try again later.',
        {
          status: 429,
        },
      );
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: effectiveSession.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== effectiveSession.user.id) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    const previousMessages = await getMessagesByChatId({ id });

    const messages = appendClientMessage({
      // @ts-expect-error: todo add type conversion from DBMessage[] to UIMessage[]
      messages: previousMessages,
      message,
    });

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude: longitude ? Number.parseFloat(longitude) : undefined,
      latitude: latitude ? Number.parseFloat(latitude) : undefined,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: message.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const stream = createDataStream({
      execute: (dataStream) => {
        try {
          const result = streamText({
            model: myProvider.languageModel(selectedChatModel),
            system: systemPrompt({
              selectedChatModel,
              requestHints,
              selectedSearchMode,
            }),
            messages,
            maxSteps: 5,
            experimental_activeTools:
              selectedChatModel === 'chat-model-reasoning'
                ? []
                : selectedSearchMode === 'deep-search'
                  ? [
                      'getWeather',
                      'createDocument',
                      'updateDocument',
                      'requestSuggestions',
                      'deepWebSearch',
                    ]
                  : [
                      'getWeather',
                      'createDocument',
                      'updateDocument',
                      'requestSuggestions',
                      'webSearch',
                    ],
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            tools: {
              getWeather,
              createDocument: createDocument({
                session: effectiveSession,
                dataStream,
              }),
              updateDocument: updateDocument({
                session: effectiveSession,
                dataStream,
              }),
              requestSuggestions: requestSuggestions({
                session: effectiveSession,
                dataStream,
              }),
              webSearch: webSearch,
              deepWebSearch: deepWebSearch,
            },
            onFinish: async ({ response }) => {
              if (effectiveSession.user?.id) {
                try {
                  const assistantId = getTrailingMessageId({
                    messages: response.messages.filter(
                      (message) => message.role === 'assistant',
                    ),
                  });

                  if (!assistantId) {
                    throw new Error('No assistant message found!');
                  }

                  const [, assistantMessage] = appendResponseMessages({
                    messages: [message],
                    responseMessages: response.messages,
                  });

                  await saveMessages({
                    messages: [
                      {
                        id: assistantId,
                        chatId: id,
                        role: assistantMessage.role,
                        parts: assistantMessage.parts,
                        attachments:
                          assistantMessage.experimental_attachments ?? [],
                        createdAt: new Date(),
                      },
                    ],
                  });

                  // Track usage for authenticated users after successful completion
                  // Only track if this was not a guest user
                  if (!effectiveSession.user.email?.includes('@guest.local')) {
                    try {
                      // Track usage based on the selected search mode after successful completion
                      const actionType =
                        selectedSearchMode === 'deep-search'
                          ? 'deepSearch'
                          : 'search';
                      await incrementUsage(
                        effectiveSession.user.id,
                        actionType,
                      );
                      console.log(
                        `✅ Tracked ${actionType} usage for user ${effectiveSession.user.id}`,
                      );
                    } catch (usageError) {
                      console.error('❌ Failed to track usage:', usageError);
                      // Don't fail the entire request if usage tracking fails
                    }
                  }
                } catch (error) {
                  console.error('Failed to save chat:', error);
                }
              }
            },
            experimental_telemetry: {
              isEnabled: isProductionEnvironment,
              functionId: 'stream-text',
            },
          });

          result.consumeStream();

          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          });
        } catch (error: any) {
          console.error('Error in streamText execution:', error);
          // Using the correct format for dataStream.write
          dataStream.write(`e:${error.message || 'Unknown error'}\n`);
        }
      },
      onError: (error: any) => {
        console.error('DataStream error:', error);
        return `Error: ${error.message || 'An error occurred while processing your request'}`;
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      `Error: ${error.message || 'An error occurred while processing your request!'}`,
      {
        status: 500,
      },
    );
  }
}

export async function GET(request: Request) {
  const streamContext = getStreamContext();

  if (!streamContext) {
    return new Response(null, { status: 204 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('id is required', { status: 400 });
  }

  const session = await auth();

  // Create guest session if no authenticated session exists
  const effectiveSession = session || {
    user: {
      id: generateUUID(),
      email: `guest-${Date.now()}@guest.local`,
      name: 'Guest User',
      image: undefined,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  let chat: Chat;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new Response('Not found', { status: 404 });
  }

  if (!chat) {
    return new Response('Not found', { status: 404 });
  }

  // For guest users, allow access to any chat (they can't save anyway)
  // For authenticated users, enforce privacy rules
  if (
    chat.visibility === 'private' &&
    session &&
    chat.userId !== effectiveSession.user.id
  ) {
    return new Response('Forbidden', { status: 403 });
  }

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length) {
    return new Response('No streams found', { status: 404 });
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new Response('No recent stream found', { status: 404 });
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  return new Response(
    await streamContext.resumableStream(recentStreamId, () => emptyDataStream),
    {
      status: 200,
    },
  );
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  // Only authenticated users can delete chats
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while deleting the chat', {
      status: 500,
    });
  }
}
