/**
 * useVociant Hook
 *
 * Core React hook for Vociant client management
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { VociantClient } from '@vociant/sdk-js';
import type { VociantConfig, ConnectionState, ConversationTurn } from '@vociant/sdk-js';

export interface UseVociantOptions extends VociantConfig {
  /** Auto-connect on mount */
  autoConnect?: boolean;
}

export interface UseVociantReturn {
  /** Vociant client instance */
  client: VociantClient | null;
  /** Current connection state */
  connectionState: ConnectionState;
  /** Conversation history */
  history: ConversationTurn[];
  /** Is currently speaking */
  isSpeaking: boolean;
  /** Is currently listening */
  isListening: boolean;
  /** Connect to agent */
  connect: () => Promise<void>;
  /** Disconnect from agent */
  disconnect: () => void;
  /** Send text message */
  sendMessage: (text: string) => void;
  /** Is connected */
  isConnected: boolean;
}

export function useVociant(options: UseVociantOptions): UseVociantReturn {
  const clientRef = useRef<VociantClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
  });
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Initialize client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new VociantClient(options);

      // Setup event listeners
      clientRef.current.on('connected', () => {
        setConnectionState({ status: 'connected' });
      });

      clientRef.current.on('disconnected', () => {
        setConnectionState({ status: 'disconnected' });
        setIsSpeaking(false);
        setIsListening(false);
      });

      clientRef.current.on('message', () => {
        setHistory(clientRef.current!.getHistory());
      });

      clientRef.current.on('speaking', () => {
        setIsSpeaking(true);
        setIsListening(false);
      });

      clientRef.current.on('listening', () => {
        setIsListening(true);
        setIsSpeaking(false);
      });

      clientRef.current.on('error', (data) => {
        setConnectionState({ status: 'error', error: data.error });
      });
    }

    // Auto-connect if specified
    if (options.autoConnect && clientRef.current) {
      clientRef.current.connect().catch((error) => {
        console.error('Auto-connect failed:', error);
      });
    }

    // Cleanup on unmount
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (clientRef.current) {
      clientRef.current.sendMessage(text);
    }
  }, []);

  return {
    client: clientRef.current,
    connectionState,
    history,
    isSpeaking,
    isListening,
    connect,
    disconnect,
    sendMessage,
    isConnected: connectionState.status === 'connected',
  };
}
