export const DEFAULT_CHAT_MODEL: string = 'gpt-4o-mini';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o-mini',
    description:
      'Smaller, faster version of GPT-4o with excellent capabilities',
  },
];
