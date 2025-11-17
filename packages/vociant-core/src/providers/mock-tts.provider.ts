/**
 * Mock TTS Provider for testing
 *
 * Generates silent audio chunks to simulate TTS without external API calls
 */

import { ITTSProvider, TTSProviderConfig, VoiceInfo } from './tts.interface';
import { AudioChunk, VoiceProfile, TTSRuntimeConfig } from '../types';

export class MockTTSProvider implements ITTSProvider {
  readonly name = 'mock';
  private config?: TTSProviderConfig;

  async initialize(config: TTSProviderConfig): Promise<void> {
    this.config = config;
  }

  async *synthesizeStream(
    text: string,
    voice: VoiceProfile,
    config?: TTSRuntimeConfig
  ): AsyncGenerator<AudioChunk> {
    // Simulate streaming audio generation
    const chunkSize = 4096;
    const sampleRate = config?.audioConfig?.sampleRate || 16000;
    const channels = config?.audioConfig?.channels || 1;

    // Estimate duration based on text length (rough: 150 words/min = 2.5 words/sec)
    const words = text.split(' ').length;
    const estimatedDurationSec = Math.max(1, words / 2.5);
    const totalSamples = Math.floor(estimatedDurationSec * sampleRate);
    const numChunks = Math.ceil(totalSamples / chunkSize);

    for (let i = 0; i < numChunks; i++) {
      // Generate silent PCM audio
      const buffer = Buffer.alloc(chunkSize * 2); // 16-bit PCM

      yield {
        data: buffer,
        sampleRate,
        channels,
        format: 'pcm',
        timestamp: Date.now(),
      };

      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  async synthesize(
    text: string,
    voice: VoiceProfile,
    config?: TTSRuntimeConfig
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of this.synthesizeStream(text, voice, config)) {
      chunks.push(chunk.data);
    }

    return Buffer.concat(chunks);
  }

  async listVoices(): Promise<VoiceInfo[]> {
    return [
      {
        id: 'mock-voice-1',
        name: 'Mock Voice (Male)',
        language: 'en-US',
        gender: 'male',
      },
      {
        id: 'mock-voice-2',
        name: 'Mock Voice (Female)',
        language: 'en-US',
        gender: 'female',
      },
    ];
  }

  async getVoice(voiceId: string): Promise<VoiceInfo | null> {
    const voices = await this.listVoices();
    return voices.find(v => v.id === voiceId) || null;
  }

  async validate(): Promise<boolean> {
    return true;
  }
}
