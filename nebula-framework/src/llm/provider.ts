import { LLMRequest, LLMResponse } from '../types';

// ============================================================
// LLM Provider Interface - Strategy Pattern
// Supports Azure OpenAI, OpenAI, and Mock for testing
// ============================================================

export interface LLMProvider {
  readonly name: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
}
