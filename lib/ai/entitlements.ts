import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 10,
    availableChatModelIds: [
      'chat-model',
      'chat-model-reasoning',
      'gpt-4o-mini',
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      'chat-model',
      'chat-model-reasoning',
      'gpt-4o-mini',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
