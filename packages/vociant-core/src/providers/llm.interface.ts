/**
 * Large Language Model Provider Interface
 *
 * All LLM providers must implement this interface to be compatible with Vociant.
 */

import { ChatMessage, LLMResponse, ToolDefinition, LLMRuntimeConfig } from '../types';

export interface ILLMProvider {
  /**
   * Provider identifier
   */
  readonly name: string;

  /**
   * Initialize the provider with credentials
   */
  initialize(config: LLMProviderConfig): Promise<void>;

  /**
   * Send chat completion request
   *
   * @param messages - Conversation history
   * @param tools - Available tools for function calling
   * @param config - Runtime configuration
   * @returns LLM response with content and/or tool calls
   */
  chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    config?: LLMRuntimeConfig
  ): Promise<LLMResponse>;

  /**
   * Send chat completion request with streaming
   *
   * @param messages - Conversation history
   * @param tools - Available tools for function calling
   * @param config - Runtime configuration
   * @returns Async generator yielding response chunks
   */
  chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    config?: LLMRuntimeConfig
  ): AsyncGenerator<LLMStreamChunk>;

  /**
   * Validate provider configuration
   */
  validate(): Promise<boolean>;
}

export interface LLMProviderConfig {
  apiKey?: string;
  endpoint?: string;
  organization?: string;
  [key: string]: any;
}

export interface LLMStreamChunk {
  delta: string;
  toolCalls?: any[];
  finishReason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}
