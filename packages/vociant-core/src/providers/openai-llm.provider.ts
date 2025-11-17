/**
 * OpenAI LLM Provider
 *
 * Integrates with OpenAI's Chat Completion API
 */

import OpenAI from 'openai';
import { ILLMProvider, LLMProviderConfig, LLMStreamChunk } from './llm.interface';
import { ChatMessage, LLMResponse, ToolDefinition, LLMRuntimeConfig, ToolCall } from '../types';

export class OpenAILLMProvider implements ILLMProvider {
  readonly name = 'openai';
  private client?: OpenAI;
  private config?: LLMProviderConfig;

  async initialize(config: LLMProviderConfig): Promise<void> {
    this.config = config;

    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      baseURL: config.endpoint,
    });
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    config?: LLMRuntimeConfig
  ): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const response = await this.client.chat.completions.create({
      model: config?.model || 'gpt-4-turbo-preview',
      messages: this.convertMessages(messages),
      tools: tools?.map(t => ({
        type: 'function' as const,
        function: t.function,
      })),
      temperature: config?.temperature,
      max_tokens: config?.maxTokens,
      top_p: config?.topP,
      frequency_penalty: config?.frequencyPenalty,
      presence_penalty: config?.presencePenalty,
      stop: config?.stop,
    });

    const choice = response.choices[0];

    return {
      content: choice.message.content || '',
      toolCalls: choice.message.tool_calls?.map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    config?: LLMRuntimeConfig
  ): AsyncGenerator<LLMStreamChunk> {
    if (!this.client) {
      throw new Error('Provider not initialized');
    }

    const stream = await this.client.chat.completions.create({
      model: config?.model || 'gpt-4-turbo-preview',
      messages: this.convertMessages(messages),
      tools: tools?.map(t => ({
        type: 'function' as const,
        function: t.function,
      })),
      temperature: config?.temperature,
      max_tokens: config?.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
        yield {
          delta: delta.content,
        };
      }

      if (delta?.tool_calls) {
        yield {
          delta: '',
          toolCalls: delta.tool_calls,
        };
      }

      if (chunk.choices[0]?.finish_reason) {
        yield {
          delta: '',
          finishReason: this.mapFinishReason(chunk.choices[0].finish_reason),
        };
      }
    }
  }

  async validate(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.models.retrieve('gpt-3.5-turbo');
      return true;
    } catch {
      return false;
    }
  }

  private convertMessages(messages: ChatMessage[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          content: msg.content,
          tool_call_id: msg.toolCallId || '',
        };
      }

      if (msg.toolCalls) {
        return {
          role: 'assistant',
          content: msg.content || null,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        };
      }

      return {
        role: msg.role,
        content: msg.content,
        name: msg.name,
      } as OpenAI.Chat.ChatCompletionMessageParam;
    });
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
    switch (reason) {
      case 'stop': return 'stop';
      case 'length': return 'length';
      case 'tool_calls': return 'tool_calls';
      case 'content_filter': return 'content_filter';
      default: return 'stop';
    }
  }
}
