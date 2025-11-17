/**
 * SessionEngine - Core Orchestration Engine
 *
 * Orchestrates the conversation flow:
 * 1. Receives audio from client
 * 2. Runs STT to get transcription
 * 3. Calls LLM with context + tools
 * 4. Executes tools if needed
 * 5. Generates TTS audio
 * 6. Streams audio back to client
 */

import { EventEmitter } from 'events';
import {
  AgentConfig,
  SessionState,
  SessionEvent,
  AudioChunk,
  ChatMessage,
  Turn,
  TranscriptResult,
  Tool,
  ConversationOverrides,
} from '../types';
import { ProviderFactory } from '../providers';
import { ITTSProvider } from '../providers/tts.interface';
import { ISTTProvider } from '../providers/stt.interface';
import { ILLMProvider } from '../providers/llm.interface';
import { ToolExecutor, ToolExecutionContext } from '../tools';
import { replaceVariables, applyPronunciation } from '../utils';

export interface SessionEngineConfig {
  agent: AgentConfig;
  sessionId: string;
  tools?: Tool[];
  onEvent?: (event: SessionEvent) => void;

  // v2: Conversation overrides
  overrides?: ConversationOverrides;
}

export class SessionEngine extends EventEmitter {
  private agent: AgentConfig;
  private sessionId: string;
  private state: SessionState;
  private toolExecutor: ToolExecutor;

  // v2: Overrides
  private overrides?: ConversationOverrides;
  private hasSpokenFirstMessage = false;

  private ttsProvider: ITTSProvider;
  private sttProvider: ISTTProvider;
  private llmProvider: ILLMProvider;

  private currentTurn?: Turn;
  private silenceTimer?: NodeJS.Timeout;
  private turnTimeoutTimer?: NodeJS.Timeout; // v2: Turn timeout
  private isAgentSpeaking = false;

  constructor(config: SessionEngineConfig) {
    super();

    this.agent = config.agent;
    this.sessionId = config.sessionId;
    this.overrides = config.overrides;

    this.state = {
      sessionId: config.sessionId,
      messages: [
        {
          role: 'system',
          content: '', // Will be set by getEffectiveSystemPrompt()
        },
      ],
      variables: {},
      turnCount: 0,
      lastActivityAt: new Date(),
    };

    // Initialize providers
    this.ttsProvider = ProviderFactory.createTTSProvider(this.agent.ttsProvider);
    this.sttProvider = ProviderFactory.createSTTProvider(this.agent.sttProvider);
    this.llmProvider = ProviderFactory.createLLMProvider(this.agent.llmProvider);

    // Initialize tool executor
    this.toolExecutor = new ToolExecutor();
    if (config.tools) {
      this.toolExecutor.registerTools(config.tools);
    }

    // Forward events
    if (config.onEvent) {
      this.on('event', config.onEvent);
    }
  }

  /**
   * Initialize all providers
   */
  async initialize(credentials: {
    tts?: any;
    stt?: any;
    llm?: any;
  }): Promise<void> {
    await this.ttsProvider.initialize(credentials.tts || {});
    await this.sttProvider.initialize(credentials.stt || {});
    await this.llmProvider.initialize(credentials.llm || {});

    this.emitEvent({
      type: 'session.started',
      session: {
        id: this.sessionId,
        agentId: this.agent.id,
        channelType: 'web',
        startedAt: new Date(),
        status: 'active',
      },
    });

    // v2: Speak first message if configured
    await this.speakFirstMessage();
  }

  /**
   * v2: Speak the first message when conversation starts
   */
  private async speakFirstMessage(): Promise<void> {
    if (this.hasSpokenFirstMessage) return;

    const firstMessage = this.overrides?.firstMessage || this.agent.firstMessage;
    if (!firstMessage) return;

    this.hasSpokenFirstMessage = true;

    // Replace dynamic variables
    let message = firstMessage;
    if (this.overrides?.dynamicVariableValues) {
      message = replaceVariables(message, this.overrides.dynamicVariableValues);
    }

    // Apply pronunciation dictionary
    if (this.agent.pronunciationDictionary) {
      message = applyPronunciation(message, this.agent.pronunciationDictionary);
    }

    const turnId = `turn-first-${Date.now()}`;
    await this.speakResponse(message, turnId);

    // Start turn timeout timer
    this.resetTurnTimeoutTimer();
  }

  /**
   * v2: Get effective configuration (agent + overrides)
   */
  private getEffectiveSystemPrompt(): string {
    let prompt = this.overrides?.systemPrompt || this.agent.systemPrompt;

    // Replace dynamic variables in system prompt
    if (this.overrides?.dynamicVariableValues) {
      prompt = replaceVariables(prompt, this.overrides.dynamicVariableValues);
    }

    return prompt;
  }

  /**
   * Process incoming audio stream from user
   */
  async processAudioStream(audioStream: AsyncIterable<AudioChunk>): Promise<void> {
    try {
      // If agent is speaking and interruptions are enabled, stop the agent
      if (this.isAgentSpeaking && this.agent.conversationFlow.interruptionsEnabled) {
        this.stopAgentSpeech();
      }

      // Reset silence timer
      this.resetSilenceTimer();

      // Run STT
      let finalTranscript = '';

      for await (const result of this.sttProvider.transcribeStream(audioStream, {
        interimResults: true,
        language: this.agent.voiceProfile.language,
      })) {
        this.state.lastActivityAt = new Date();

        if (result.partial) {
          this.emitEvent({
            type: 'transcript.partial',
            text: result.partial,
            timestamp: Date.now(),
          });
        }

        if (result.final) {
          finalTranscript = result.final;
          this.emitEvent({
            type: 'transcript.final',
            text: result.final,
            timestamp: Date.now(),
          });
        }
      }

      if (finalTranscript) {
        await this.processTurn(finalTranscript);
      }
    } catch (error) {
      this.emitEvent({
        type: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  /**
   * Process a single conversation turn
   */
  private async processTurn(userInput: string): Promise<void> {
    const turnId = `turn-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    this.currentTurn = {
      id: turnId,
      sessionId: this.sessionId,
      userInput,
      startedAt: new Date(),
    };

    this.state.turnCount++;

    // Add user message to history
    this.state.messages.push({
      role: 'user',
      content: userInput,
    });

    this.emitEvent({
      type: 'agent.thinking',
      turnId,
    });

    // Call LLM
    const llmStartTime = Date.now();
    const tools = this.toolExecutor.getAllTools().map(t => t.schema);

    const llmResponse = await this.llmProvider.chat(
      this.state.messages,
      tools.length > 0 ? tools : undefined,
      this.agent.llmConfig
    );

    const llmLatency = Date.now() - llmStartTime;

    // Handle tool calls
    if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
      this.currentTurn.toolCalls = llmResponse.toolCalls;
      this.currentTurn.toolResults = [];

      // Add assistant message with tool calls
      this.state.messages.push({
        role: 'assistant',
        content: llmResponse.content,
        toolCalls: llmResponse.toolCalls,
      });

      // Execute tools
      for (const toolCall of llmResponse.toolCalls) {
        this.emitEvent({
          type: 'tool.executing',
          tool: toolCall.function.name,
          turnId,
        });

        const context: ToolExecutionContext = {
          sessionId: this.sessionId,
          sessionState: this.state,
          agentId: this.agent.id,
        };

        const result = await this.toolExecutor.execute(toolCall, context);
        this.currentTurn.toolResults?.push(result);

        this.emitEvent({
          type: 'tool.completed',
          tool: toolCall.function.name,
          result,
          turnId,
        });

        // Add tool result to messages
        this.state.messages.push({
          role: 'tool',
          content: JSON.stringify(result),
          toolCallId: toolCall.id,
        });
      }

      // Call LLM again with tool results
      const followUpResponse = await this.llmProvider.chat(
        this.state.messages,
        undefined,
        this.agent.llmConfig
      );

      llmResponse.content = followUpResponse.content;
    }

    // Add assistant response to history
    this.state.messages.push({
      role: 'assistant',
      content: llmResponse.content,
    });

    this.currentTurn.agentResponse = llmResponse.content;

    // Generate and stream TTS
    await this.speakResponse(llmResponse.content, turnId);

    // Update turn metrics
    this.currentTurn.completedAt = new Date();
    this.currentTurn.latencyMs = Date.now() - startTime;
    this.currentTurn.llmLatencyMs = llmLatency;

    // Start silence timer
    this.resetSilenceTimer();
  }

  /**
   * Generate and stream TTS audio
   */
  private async speakResponse(text: string, turnId: string): Promise<void> {
    this.isAgentSpeaking = true;
    const audioStartTime = Date.now();

    this.emitEvent({
      type: 'agent.speaking',
      text,
      turnId,
    });

    try {
      for await (const chunk of this.ttsProvider.synthesizeStream(
        text,
        this.agent.voiceProfile,
        {
          streaming: true,
          audioConfig: this.agent.audioConfig,
        }
      )) {
        if (!this.isAgentSpeaking) {
          // Interrupted
          break;
        }

        this.emitEvent({
          type: 'audio.chunk',
          chunk,
          turnId,
        });
      }

      if (this.currentTurn) {
        this.currentTurn.audioLatencyMs = Date.now() - audioStartTime;
      }
    } finally {
      this.isAgentSpeaking = false;
    }
  }

  /**
   * Stop agent speech (for interruptions)
   */
  private stopAgentSpeech(): void {
    this.isAgentSpeaking = false;
  }

  /**
   * Reset silence timeout timer
   */
  private resetSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    const timeoutMs = this.agent.conversationFlow.silenceTimeoutMs;

    this.silenceTimer = setTimeout(() => {
      this.handleSilenceTimeout();
    }, timeoutMs);
  }

  /**
   * Handle silence timeout
   */
  private handleSilenceTimeout(): void {
    // Could emit an event or trigger a prompt like "Are you still there?"
    // For now, just clear the timer
    this.silenceTimer = undefined;
  }

  /**
   * v2: Reset turn timeout timer
   *
   * Starts timer to prompt user if they don't speak
   */
  private resetTurnTimeoutTimer(): void {
    if (this.turnTimeoutTimer) {
      clearTimeout(this.turnTimeoutTimer);
    }

    const timeoutSeconds = this.agent.conversationFlow.turnTimeoutSeconds || 10;
    const timeoutMs = timeoutSeconds * 1000;

    this.turnTimeoutTimer = setTimeout(() => {
      this.handleTurnTimeout();
    }, timeoutMs);
  }

  /**
   * v2: Handle turn timeout (prompt user)
   */
  private async handleTurnTimeout(): Promise<void> {
    // Speak a prompt like "Are you still there?" or "How can I help you?"
    const promptMessage = "Are you still there? How can I help you?";
    const turnId = `turn-prompt-${Date.now()}`;

    await this.speakResponse(promptMessage, turnId);

    // Reset timer to prompt again if needed
    this.resetTurnTimeoutTimer();
  }

  /**
   * End the session
   */
  async end(): Promise<void> {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    this.emitEvent({
      type: 'session.ended',
      session: {
        id: this.sessionId,
        agentId: this.agent.id,
        channelType: 'web',
        startedAt: new Date(), // Would be tracked properly
        endedAt: new Date(),
        status: 'completed',
      },
    });
  }

  /**
   * Get current session state
   */
  getState(): SessionState {
    return { ...this.state };
  }

  /**
   * Emit session event
   */
  private emitEvent(event: SessionEvent): void {
    this.emit('event', event);
  }
}
