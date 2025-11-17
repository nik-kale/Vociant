/**
 * Text-to-Speech Provider Interface
 *
 * All TTS providers must implement this interface to be compatible with Vociant.
 */

import { AudioChunk, VoiceProfile, TTSRuntimeConfig } from '../types';

export interface ITTSProvider {
  /**
   * Provider identifier
   */
  readonly name: string;

  /**
   * Initialize the provider with credentials
   */
  initialize(config: TTSProviderConfig): Promise<void>;

  /**
   * Synthesize text to audio (streaming)
   *
   * @param text - Text to synthesize
   * @param voice - Voice profile to use
   * @param config - Runtime configuration
   * @returns Async generator yielding audio chunks
   */
  synthesizeStream(
    text: string,
    voice: VoiceProfile,
    config?: TTSRuntimeConfig
  ): AsyncGenerator<AudioChunk>;

  /**
   * Synthesize text to audio (batch)
   *
   * @param text - Text to synthesize
   * @param voice - Voice profile to use
   * @param config - Runtime configuration
   * @returns Complete audio buffer
   */
  synthesize(
    text: string,
    voice: VoiceProfile,
    config?: TTSRuntimeConfig
  ): Promise<Buffer>;

  /**
   * List available voices for this provider
   */
  listVoices(): Promise<VoiceInfo[]>;

  /**
   * Get information about a specific voice
   */
  getVoice(voiceId: string): Promise<VoiceInfo | null>;

  /**
   * Validate provider configuration
   */
  validate(): Promise<boolean>;
}

export interface TTSProviderConfig {
  apiKey?: string;
  endpoint?: string;
  region?: string;
  [key: string]: any;
}

export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  preview_url?: string;
  labels?: Record<string, string>;
}
