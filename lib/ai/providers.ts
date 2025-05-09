import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
  openaiModel,
} from './models.test';

// Verify OpenAI API key is available
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
if (!hasOpenAIKey && !isTestEnvironment) {
  console.warn('Warning: OPENAI_API_KEY is not set in environment variables!');
}

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
        'openai-model': openaiModel,
        'gpt-4o-mini': openaiModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': xai('grok-2-vision-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: xai('grok-3-mini-beta'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': xai('grok-2-1212'),
        'artifact-model': xai('grok-2-1212'),
        'openai-model': openai('gpt-4o-mini'),
        'gpt-4o-mini': openai('gpt-4o-mini'),
      },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });


