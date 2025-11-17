/**
 * Mock STT Provider for testing
 *
 * Simulates speech recognition without external API calls
 */

import { ISTTProvider, STTProviderConfig } from './stt.interface';
import { AudioChunk, TranscriptResult, STTRuntimeConfig } from '../types';

export class MockSTTProvider implements ISTTProvider {
  readonly name = 'mock';
  private config?: STTProviderConfig;

  async initialize(config: STTProviderConfig): Promise<void> {
    this.config = config;
  }

  async *transcribeStream(
    audioStream: AsyncIterable<AudioChunk>,
    config?: STTRuntimeConfig
  ): AsyncGenerator<TranscriptResult> {
    let chunkCount = 0;
    const mockPhrases = [
      'Hello',
      'Hello, how',
      'Hello, how can',
      'Hello, how can I',
      'Hello, how can I help',
      'Hello, how can I help you',
      'Hello, how can I help you today?',
    ];

    for await (const chunk of audioStream) {
      chunkCount++;

      // Emit partial results
      if (config?.interimResults !== false && chunkCount < mockPhrases.length) {
        yield {
          partial: mockPhrases[chunkCount],
          isFinal: false,
          confidence: 0.7 + (chunkCount * 0.03),
          timestamp: Date.now(),
        };
      }

      // Emit final result after collecting enough audio
      if (chunkCount >= mockPhrases.length - 1) {
        yield {
          final: mockPhrases[mockPhrases.length - 1],
          isFinal: true,
          confidence: 0.95,
          timestamp: Date.now(),
        };
        break;
      }
    }
  }

  async transcribe(
    audioBuffer: Buffer,
    config?: STTRuntimeConfig
  ): Promise<string> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'This is a mock transcription of the audio.';
  }

  async validate(): Promise<boolean> {
    return true;
  }
}
