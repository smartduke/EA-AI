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
      'gpt-4.1',
      'gpt-4.1-mini',
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 1000,
    availableChatModelIds: [
      'chat-model',
      'chat-model-reasoning',
      'gpt-4o-mini',
      'gpt-4.1',
      'gpt-4.1-mini',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
