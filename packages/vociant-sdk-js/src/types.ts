/**
 * Type definitions for Vociant SDK
 */

export interface VociantConfig {
  /** Base URL of the Vociant instance */
  baseUrl: string;
  /** Agent slug or ID */
  agentId: string;
  /** Signed URL token (if required) */
  token?: string;
  /** Auto-start conversation on load */
  autoStart?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom dynamic variable values */
  variables?: Record<string, any>;
}

export interface VociantWidgetConfig extends VociantConfig {
  /** Widget container element or selector */
  container?: string | HTMLElement;
  /** Widget theme customization */
  theme?: WidgetTheme;
  /** Widget position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Custom greeting message */
  greeting?: string;
  /** Avatar URL */
  avatarUrl?: string;
}

export interface WidgetTheme {
  /** Primary color (hex) */
  primaryColor?: string;
  /** Text color (hex) */
  textColor?: string;
  /** Background color (hex) */
  backgroundColor?: string;
  /** Font family */
  fontFamily?: string;
  /** Border radius (px) */
  borderRadius?: number;
}

export interface ConversationTurn {
  id: string;
  userMessage?: string;
  assistantMessage?: string;
  timestamp: number;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error?: string;
}

export type EventType =
  | 'ready'
  | 'connected'
  | 'disconnected'
  | 'message'
  | 'error'
  | 'speaking'
  | 'listening'
  | 'turn-start'
  | 'turn-end';

export type EventCallback = (data?: any) => void;

export interface AudioConfig {
  /** Enable echo cancellation */
  echoCancellation?: boolean;
  /** Enable noise suppression */
  noiseSuppression?: boolean;
  /** Enable auto gain control */
  autoGainControl?: boolean;
  /** Sample rate (Hz) */
  sampleRate?: number;
}
