import { LLMProvider } from './provider';
import { LLMRequest, LLMResponse } from '../types';
import { AzureOpenAIProvider } from './azure-provider';
import { OpenAIProvider } from './openai-provider';
import { MockLLMProvider } from './mock-provider';
import { logger } from '../utils/logger';

// ============================================================
// LLM Service - Factory + Fallback Chain
// Tries configured provider first, falls back gracefully
// ============================================================

export class LLMService {
  private providers: LLMProvider[] = [];
  private activeProvider: LLMProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const configuredProvider = process.env.LLM_PROVIDER || 'mock';

    switch (configuredProvider) {
      case 'azure':
        try {
          this.providers.push(new AzureOpenAIProvider());
          logger.info('Azure OpenAI provider initialized');
        } catch (e) {
          logger.warn('Azure OpenAI not available, adding to fallback chain');
        }
        this.providers.push(new MockLLMProvider());
        break;

      case 'openai':
        try {
          this.providers.push(new OpenAIProvider());
          logger.info('OpenAI provider initialized');
        } catch (e) {
          logger.warn('OpenAI not available, adding to fallback chain');
        }
        this.providers.push(new MockLLMProvider());
        break;

      case 'mock':
      default:
        this.providers.push(new MockLLMProvider());
        logger.info('Using mock LLM provider');
        break;
    }
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    for (const provider of this.providers) {
      try {
        const available = await provider.isAvailable();
        if (!available) {
          logger.warn({ provider: provider.name }, 'Provider not available, trying next');
          continue;
        }

        const response = await provider.complete(request);
        this.activeProvider = provider;
        return response;
      } catch (error) {
        logger.error({ provider: provider.name, error }, 'Provider failed, trying fallback');
        continue;
      }
    }

    throw new Error('All LLM providers failed');
  }

  getActiveProvider(): string {
    return this.activeProvider?.name || this.providers[0]?.name || 'none';
  }

  getProviderChain(): string[] {
    return this.providers.map(p => p.name);
  }
}

// Singleton
export const llmService = new LLMService();

export { LLMProvider } from './provider';
export { AzureOpenAIProvider } from './azure-provider';
export { OpenAIProvider } from './openai-provider';
export { MockLLMProvider } from './mock-provider';
