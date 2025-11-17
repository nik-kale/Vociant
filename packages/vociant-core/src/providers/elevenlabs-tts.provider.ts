/**
 * ElevenLabs TTS Provider
 *
 * Integrates with ElevenLabs Text-to-Speech API
 * Documentation: https://elevenlabs.io/docs/api-reference/text-to-speech
 */

import { ITTSProvider, TTSProviderConfig, VoiceInfo } from './tts.interface';
import { AudioChunk, VoiceProfile, TTSRuntimeConfig } from '../types';

export class ElevenLabsTTSProvider implements ITTSProvider {
  readonly name = 'elevenlabs';
  private config?: TTSProviderConfig;
  private readonly baseURL = 'https://api.elevenlabs.io/v1';

  async initialize(config: TTSProviderConfig): Promise<void> {
    this.config = config;

    if (!config.apiKey) {
      throw new Error('ElevenLabs API key is required');
    }
  }

  async *synthesizeStream(
    text: string,
    voice: VoiceProfile,
    config?: TTSRuntimeConfig
  ): AsyncGenerator<AudioChunk> {
    if (!this.config?.apiKey) {
      throw new Error('Provider not initialized');
    }

    const voiceId = voice.voiceId;
    const url = `${this.baseURL}/text-to-speech/${voiceId}/stream`;

    const body = {
      text,
      model_id: 'eleven_turbo_v2', // Fast, low-latency model
      voice_settings: {
        stability: voice.settings?.stability ?? 0.5,
        similarity_boost: voice.settings?.similarityBoost ?? 0.75,
        style: voice.settings?.energy ?? 0.0,
        use_speaker_boost: true,
      },
    };

    // TODO: Implement actual streaming HTTP request
    // For now, this is a placeholder structure showing the API shape

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Stream audio chunks
      const reader = response.body.getReader();
      const sampleRate = 44100; // ElevenLabs default
      const channels = 1;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        yield {
          data: Buffer.from(value),
          sampleRate,
          channels,
          format: 'mp3',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      throw new Error(`ElevenLabs TTS streaming failed: ${error}`);
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
    if (!this.config?.apiKey) {
      throw new Error('Provider not initialized');
    }

    const url = `${this.baseURL}/voices`;

    try {
      const response = await fetch(url, {
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();

      return data.voices.map((v: any) => ({
        id: v.voice_id,
        name: v.name,
        language: v.labels?.language || 'en',
        gender: v.labels?.gender,
        preview_url: v.preview_url,
        labels: v.labels,
      }));
    } catch (error) {
      throw new Error(`Failed to list ElevenLabs voices: ${error}`);
    }
  }

  async getVoice(voiceId: string): Promise<VoiceInfo | null> {
    if (!this.config?.apiKey) {
      throw new Error('Provider not initialized');
    }

    const url = `${this.baseURL}/voices/${voiceId}`;

    try {
      const response = await fetch(url, {
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const v = await response.json();

      return {
        id: v.voice_id,
        name: v.name,
        language: v.labels?.language || 'en',
        gender: v.labels?.gender,
        preview_url: v.preview_url,
        labels: v.labels,
      };
    } catch (error) {
      throw new Error(`Failed to get ElevenLabs voice: ${error}`);
    }
  }

  async validate(): Promise<boolean> {
    if (!this.config?.apiKey) {
      return false;
    }

    try {
      await this.listVoices();
      return true;
    } catch {
      return false;
    }
  }
}
