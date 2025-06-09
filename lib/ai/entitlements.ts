import type { ChatModel } from './models';

export type UserType = 'guest' | 'regular';

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
    availableChatModelIds: ['gpt-4o-mini'],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 1000,
    availableChatModelIds: ['gpt-4o-mini'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
