/**
 * Core Vociant Client
 *
 * Manages WebSocket connection and voice streaming
 */

import type {
  VociantConfig,
  ConversationTurn,
  ConnectionState,
  EventType,
  EventCallback,
  AudioConfig,
} from './types';

export class VociantClient {
  private config: VociantConfig;
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private connectionState: ConnectionState = { status: 'disconnected' };
  private eventListeners: Map<EventType, Set<EventCallback>> = new Map();
  private conversationHistory: ConversationTurn[] = [];

  constructor(config: VociantConfig) {
    this.config = {
      debug: false,
      autoStart: false,
      ...config,
    };

    this.log('VociantClient initialized', this.config);
  }

  /**
   * Connect to Vociant agent
   */
  async connect(audioConfig?: AudioConfig): Promise<void> {
    if (this.connectionState.status === 'connected') {
      this.log('Already connected');
      return;
    }

    this.updateConnectionState({ status: 'connecting' });

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: audioConfig?.echoCancellation ?? true,
          noiseSuppression: audioConfig?.noiseSuppression ?? true,
          autoGainControl: audioConfig?.autoGainControl ?? true,
          sampleRate: audioConfig?.sampleRate ?? 16000,
        },
      });

      // Establish WebSocket connection
      const wsUrl = this.buildWebSocketUrl();
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.log('WebSocket connected');
        this.updateConnectionState({ status: 'connected' });
        this.emit('connected');

        // Start audio streaming
        this.startAudioStreaming();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      this.ws.onerror = (error) => {
        this.log('WebSocket error', error);
        this.updateConnectionState({ status: 'error', error: 'Connection failed' });
        this.emit('error', { error: 'Connection failed' });
      };

      this.ws.onclose = () => {
        this.log('WebSocket closed');
        this.updateConnectionState({ status: 'disconnected' });
        this.emit('disconnected');
        this.cleanup();
      };
    } catch (error) {
      this.log('Connection error', error);
      this.updateConnectionState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.emit('error', { error });
      throw error;
    }
  }

  /**
   * Disconnect from agent
   */
  disconnect(): void {
    this.log('Disconnecting...');
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanup();
  }

  /**
   * Send a text message to the agent
   */
  sendMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }

    this.log('Sending message:', text);
    this.ws.send(
      JSON.stringify({
        type: 'user_message',
        text,
        timestamp: Date.now(),
      })
    );
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationTurn[] {
    return [...this.conversationHistory];
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Register event listener
   */
  on(event: EventType, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unregister event listener
   */
  off(event: EventType, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: EventType, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          this.log('Event listener error', error);
        }
      });
    }
  }

  /**
   * Build WebSocket URL
   */
  private buildWebSocketUrl(): string {
    const url = new URL(this.config.baseUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = `${protocol}//${url.host}/api/voice/${this.config.agentId}`;

    if (this.config.token) {
      wsUrl += `?token=${this.config.token}`;
    }

    // Add dynamic variables if provided
    if (this.config.variables) {
      const params = new URLSearchParams(this.config.token ? '' : undefined);
      if (this.config.token) {
        params.set('token', this.config.token);
      }
      params.set('variables', JSON.stringify(this.config.variables));
      wsUrl += `?${params.toString()}`;
    }

    return wsUrl;
  }

  /**
   * Start streaming audio to server
   */
  private startAudioStreaming(): void {
    if (!this.mediaStream || !this.ws) {
      return;
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(event.data);
        }
      };

      this.mediaRecorder.start(100); // Send audio chunks every 100ms
      this.log('Audio streaming started');
    } catch (error) {
      this.log('Failed to start audio streaming', error);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      // Handle binary audio data
      if (event.data instanceof Blob) {
        this.playAudioChunk(event.data);
        return;
      }

      // Handle JSON messages
      const message = JSON.parse(event.data);
      this.log('Received message:', message);

      switch (message.type) {
        case 'agent_message':
          this.conversationHistory.push({
            id: message.id || Date.now().toString(),
            assistantMessage: message.text,
            timestamp: message.timestamp || Date.now(),
          });
          this.emit('message', { role: 'assistant', text: message.text });
          break;

        case 'user_transcript':
          this.conversationHistory.push({
            id: message.id || Date.now().toString(),
            userMessage: message.text,
            timestamp: message.timestamp || Date.now(),
          });
          this.emit('message', { role: 'user', text: message.text });
          break;

        case 'turn_start':
          this.emit('turn-start', message);
          break;

        case 'turn_end':
          this.emit('turn-end', message);
          break;

        case 'agent_speaking':
          this.emit('speaking', message);
          break;

        case 'agent_listening':
          this.emit('listening', message);
          break;

        case 'error':
          this.emit('error', message);
          break;

        default:
          this.log('Unknown message type:', message.type);
      }
    } catch (error) {
      this.log('Error handling message', error);
    }
  }

  /**
   * Play audio chunk
   */
  private async playAudioChunk(audioBlob: Blob): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      this.log('Error playing audio', error);
    }
  }

  /**
   * Update connection state
   */
  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.log('Connection state:', state);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[Vociant]', ...args);
    }
  }
}
