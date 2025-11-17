/**
 * Speech-to-Text Provider Interface
 *
 * All STT providers must implement this interface to be compatible with Vociant.
 */

import { AudioChunk, TranscriptResult, STTRuntimeConfig } from '../types';

export interface ISTTProvider {
  /**
   * Provider identifier
   */
  readonly name: string;

  /**
   * Initialize the provider with credentials
   */
  initialize(config: STTProviderConfig): Promise<void>;

  /**
   * Transcribe audio stream in real-time
   *
   * @param audioStream - Stream of audio chunks
   * @param config - Runtime configuration
   * @returns Async generator yielding transcript results (partial + final)
   */
  transcribeStream(
    audioStream: AsyncIterable<AudioChunk>,
    config?: STTRuntimeConfig
  ): AsyncGenerator<TranscriptResult>;

  /**
   * Transcribe audio file (batch)
   *
   * @param audioBuffer - Complete audio buffer
   * @param config - Runtime configuration
   * @returns Final transcript
   */
  transcribe(
    audioBuffer: Buffer,
    config?: STTRuntimeConfig
  ): Promise<string>;

  /**
   * Validate provider configuration
   */
  validate(): Promise<boolean>;
}

export interface STTProviderConfig {
  apiKey?: string;
  endpoint?: string;
  region?: string;
  [key: string]: any;
}
