import OpenAI from 'openai';
import { LLMProvider } from './provider';
import { LLMRequest, LLMResponse } from '../types';
import { logger } from '../utils/logger';

// ============================================================
// OpenAI Provider (Direct - non-Azure)
// ============================================================

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    this.client = new OpenAI({ apiKey });
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.model,
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
      model: this.model,
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
      throw new Error('Empty response from OpenAI');
    }

    logger.info({ provider: this.name, durationMs, tokens: response.usage?.total_tokens }, 'LLM call completed');

    return {
      content: choice.message.content,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      model: this.model,
      durationMs,
    };
  }
}
