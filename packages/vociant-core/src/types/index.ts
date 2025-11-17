/**
 * Core type definitions for Vociant
 */

// ============================================================================
// Audio Types
// ============================================================================

export interface AudioChunk {
  data: Buffer;
  sampleRate: number;
  channels: number;
  format: 'pcm' | 'opus' | 'mp3';
  timestamp?: number;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  format: 'pcm' | 'opus' | 'mp3';
  bitrate?: number;
}

// ============================================================================
// Voice & TTS Types
// ============================================================================

export interface VoiceProfile {
  id: string;
  name: string;
  provider: TTSProvider;
  voiceId: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  style?: string;
  settings?: VoiceSettings;
}

export interface VoiceSettings {
  stability?: number; // 0-1
  similarityBoost?: number; // 0-1
  speed?: number; // 0.5-2.0
  pitch?: number; // -20 to +20 semitones
  energy?: number; // 0-1
}

export type TTSProvider =
  | 'elevenlabs'
  | 'google'
  | 'deepgram'
  | 'openai'
  | 'azure'
  | 'aws-polly'
  | 'mock';

export interface TTSRuntimeConfig {
  streaming?: boolean;
  audioConfig?: AudioConfig;
  voice?: VoiceProfile;
  settings?: VoiceSettings;
}

// ============================================================================
// STT Types
// ============================================================================

export type STTProvider =
  | 'elevenlabs'
  | 'deepgram'
  | 'google'
  | 'azure'
  | 'aws-transcribe'
  | 'openai-whisper'
  | 'mock';

export interface TranscriptResult {
  partial?: string;
  final?: string;
  isFinal: boolean;
  confidence?: number;
  timestamp?: number;
  words?: WordTimestamp[];
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface STTRuntimeConfig {
  language?: string;
  model?: string;
  interimResults?: boolean;
  punctuate?: boolean;
  profanityFilter?: boolean;
}

// ============================================================================
// LLM Types
// ============================================================================

export type LLMProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'azure-openai'
  | 'mock';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>; // JSON schema
  };
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMRuntimeConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

// ============================================================================
// Agent Configuration
// ============================================================================

export interface AgentConfig {
  // Identity
  id: string;
  name: string;
  description?: string;
  projectId?: string;

  // Personality & Behavior
  systemPrompt: string;
  style?: 'supportive' | 'concise' | 'detailed' | 'professional' | 'friendly';
  maxTurnsPerSession?: number;

  // v2: First Message & Dynamic Variables
  firstMessage?: string;
  dynamicVariables?: string[]; // List of required variables: ["user_name", "order_id"]

  // Voice & Audio
  voiceProfile: VoiceProfile;
  audioConfig?: AudioConfig;

  // v2: Language & Pronunciation
  language: string; // Primary language, e.g., "en-US"
  supportedLanguages?: string[]; // Multi-language support
  pronunciationDictionary?: Record<string, string>; // { "API": "A P I" }

  // Conversation Flow
  conversationFlow: ConversationFlowConfig;

  // Providers
  ttsProvider: TTSProvider;
  ttsModel?: string;
  sttProvider: STTProvider;
  sttModel?: string;
  llmProvider: LLMProvider;
  llmModel: string;
  llmConfig?: LLMRuntimeConfig;

  // Knowledge & RAG
  knowledgeBaseIds?: string[];
  ragConfig?: RAGConfig;

  // Tools
  toolIds?: string[];
  toolExecutionPolicy?: 'strict' | 'auto' | 'ask-before-call';

  // Channels
  channels?: ChannelConfig[];
}

export interface ConversationFlowConfig {
  silenceTimeoutMs: number; // How long to wait for user input
  interruptionsEnabled: boolean; // Can user interrupt agent speech
  turnEagerness: 'low' | 'medium' | 'high'; // How quickly agent responds
  maxResponseLengthSeconds?: number;
  latencyTargetMs?: number;

  // v2: Turn Timeout
  turnTimeoutSeconds?: number; // 1-30s - How long to wait before prompting user
}

export interface ChannelConfig {
  type: 'web' | 'telephony' | 'sip';
  enabled: boolean;
  config?: Record<string, any>;
}

// v2: Conversation Overrides
export interface ConversationOverrides {
  systemPrompt?: string;
  firstMessage?: string;
  language?: string;
  voiceId?: string;
  llmModel?: string;
  temperature?: number;
  dynamicVariableValues?: Record<string, any>; // { "user_name": "John", "order_id": "12345" }
}

export interface RAGConfig {
  topK: number;
  chunkSize: number;
  chunkOverlap: number;
  embeddingProvider: 'openai' | 'cohere' | 'huggingface';
  embeddingModel: string;
  minSimilarity?: number;
}

// ============================================================================
// Tool Types
// ============================================================================

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'server' | 'client';
  schema: ToolDefinition;
  endpoint?: string; // For server tools
  auth?: ToolAuthConfig;
  config?: Record<string, any>;
}

export interface ToolAuthConfig {
  type: 'none' | 'api-key' | 'bearer' | 'oauth';
  credentials?: Record<string, string>;
}

export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTimeMs: number;
}

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
  id: string;
  agentId: string;
  channelType: 'web' | 'telephony' | 'sip';
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'failed' | 'timeout';
  metadata?: Record<string, any>;
}

export interface SessionState {
  sessionId: string;
  messages: ChatMessage[];
  variables: Record<string, any>; // Internal state for system tools
  turnCount: number;
  lastActivityAt: Date;
}

export interface Turn {
  id: string;
  sessionId: string;
  userInput?: string;
  agentResponse?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolExecutionResult[];
  startedAt: Date;
  completedAt?: Date;
  latencyMs?: number;
  audioLatencyMs?: number;
  llmLatencyMs?: number;
}

// ============================================================================
// Knowledge Base Types
// ============================================================================

export interface KnowledgeSource {
  id: string;
  projectId: string;
  name: string;
  type: 'url' | 'file' | 'text' | 's3' | 'github';
  status: 'pending' | 'indexing' | 'ready' | 'failed';
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeChunk {
  id: string;
  sourceId: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

// ============================================================================
// Event Types
// ============================================================================

export type SessionEvent =
  | { type: 'session.started'; session: Session }
  | { type: 'session.ended'; session: Session }
  | { type: 'audio.received'; chunk: AudioChunk }
  | { type: 'transcript.partial'; text: string; timestamp: number }
  | { type: 'transcript.final'; text: string; timestamp: number }
  | { type: 'agent.thinking'; turnId: string }
  | { type: 'agent.speaking'; text: string; turnId: string }
  | { type: 'audio.chunk'; chunk: AudioChunk; turnId: string }
  | { type: 'tool.executing'; tool: string; turnId: string }
  | { type: 'tool.completed'; tool: string; result: ToolExecutionResult; turnId: string }
  | { type: 'error'; error: Error; turnId?: string };
