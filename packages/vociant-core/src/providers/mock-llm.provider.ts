/**
 * Mock LLM Provider for testing
 *
 * Simulates LLM responses without external API calls
 */

import { ILLMProvider, LLMProviderConfig, LLMStreamChunk } from './llm.interface';
import { ChatMessage, LLMResponse, ToolDefinition, LLMRuntimeConfig } from '../types';

export class MockLLMProvider implements ILLMProvider {
  readonly name = 'mock';
  private config?: LLMProviderConfig;

  async initialize(config: LLMProviderConfig): Promise<void> {
    this.config = config;
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    config?: LLMRuntimeConfig
  ): Promise<LLMResponse> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const lastMessage = messages[messages.length - 1];

    // Generate mock response based on last user message
    let content = 'I understand. How can I help you with that?';

    if (lastMessage.content.toLowerCase().includes('hello')) {
      content = 'Hello! How can I assist you today?';
    } else if (lastMessage.content.toLowerCase().includes('help')) {
      content = 'I\'m here to help! What do you need assistance with?';
    } else if (lastMessage.content.toLowerCase().includes('weather')) {
      content = 'I would need to check the weather API to give you accurate information.';
    }

    return {
      content,
      finishReason: 'stop',
      usage: {
        promptTokens: 50,
        completionTokens: 20,
        totalTokens: 70,
      },
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    config?: LLMRuntimeConfig
  ): AsyncGenerator<LLMStreamChunk> {
    const response = await this.chat(messages, tools, config);
    const words = response.content.split(' ');

    // Simulate streaming word by word
    for (let i = 0; i < words.length; i++) {
      yield {
        delta: words[i] + (i < words.length - 1 ? ' ' : ''),
        finishReason: i === words.length - 1 ? 'stop' : undefined,
      };
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  async validate(): Promise<boolean> {
    return true;
  }
}
