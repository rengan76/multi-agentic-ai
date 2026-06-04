import OpenAI from 'openai';
import { LLMProvider } from './provider';
import { LLMRequest, LLMResponse } from '../types';
import { logger } from '../utils/logger';

// ============================================================
// Azure OpenAI Provider
// Production LLM integration with proper error handling
// ============================================================

export class AzureOpenAIProvider implements LLMProvider {
  readonly name = 'azure-openai';
  private client: OpenAI;
  private deployment: string;

  constructor() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    this.deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

    if (!endpoint || !apiKey) {
      throw new Error('Azure OpenAI credentials not configured');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: `${endpoint}/openai/deployments/${this.deployment}`,
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview' },
      defaultHeaders: { 'api-key': apiKey },
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.deployment,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      });
      return true;
    } catch {
      return false;
    }
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model: this.deployment,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
    });

    const durationMs = Date.now() - start;
    const choice = response.choices[0];

    if (!choice?.message?.content) {
      throw new Error('Empty response from Azure OpenAI');
    }

    logger.info({ provider: this.name, durationMs, tokens: response.usage?.total_tokens }, 'LLM call completed');

    return {
      content: choice.message.content,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      model: this.deployment,
      durationMs,
    };
  }
}
