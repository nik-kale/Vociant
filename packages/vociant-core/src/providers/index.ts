/**
 * Provider exports
 */

// Interfaces
export * from './tts.interface';
export * from './stt.interface';
export * from './llm.interface';

// Mock providers
export * from './mock-tts.provider';
export * from './mock-stt.provider';
export * from './mock-llm.provider';

// Real providers
export * from './openai-llm.provider';
export * from './elevenlabs-tts.provider';

// Provider factory
import { ITTSProvider } from './tts.interface';
import { ISTTProvider } from './stt.interface';
import { ILLMProvider } from './llm.interface';
import { MockTTSProvider } from './mock-tts.provider';
import { MockSTTProvider } from './mock-stt.provider';
import { MockLLMProvider } from './mock-llm.provider';
import { OpenAILLMProvider } from './openai-llm.provider';
import { ElevenLabsTTSProvider } from './elevenlabs-tts.provider';
import { TTSProvider, STTProvider, LLMProvider } from '../types';

export class ProviderFactory {
  static createTTSProvider(type: TTSProvider): ITTSProvider {
    switch (type) {
      case 'elevenlabs':
        return new ElevenLabsTTSProvider();
      case 'mock':
        return new MockTTSProvider();
      default:
        throw new Error(`Unsupported TTS provider: ${type}`);
    }
  }

  static createSTTProvider(type: STTProvider): ISTTProvider {
    switch (type) {
      case 'mock':
        return new MockSTTProvider();
      default:
        throw new Error(`Unsupported STT provider: ${type}`);
    }
  }

  static createLLMProvider(type: LLMProvider): ILLMProvider {
    switch (type) {
      case 'openai':
        return new OpenAILLMProvider();
      case 'mock':
        return new MockLLMProvider();
      default:
        throw new Error(`Unsupported LLM provider: ${type}`);
    }
  }
}
