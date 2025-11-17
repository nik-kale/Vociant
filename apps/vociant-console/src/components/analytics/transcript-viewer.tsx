'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, User, Bot, Clock, Zap } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface Turn {
  id: string;
  userMessage: string | null;
  assistantMessage: string | null;
  startedAt: Date;
  llmLatencyMs: number | null;
  ttsLatencyMs: number | null;
  sttLatencyMs: number | null;
  totalLatencyMs: number | null;
  toolCalls: string | null;
}

interface TranscriptViewerProps {
  turns: Turn[];
}

export default function TranscriptViewer({ turns }: TranscriptViewerProps) {
  const [playingTurnId, setPlayingTurnId] = useState<string | null>(null);
  const [showLatencyMetrics, setShowLatencyMetrics] = useState(false);

  const togglePlay = (turnId: string) => {
    setPlayingTurnId(playingTurnId === turnId ? null : turnId);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {turns.length} {turns.length === 1 ? 'Turn' : 'Turns'}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLatencyMetrics(!showLatencyMetrics)}
        >
          <Zap className="h-4 w-4 mr-2" />
          {showLatencyMetrics ? 'Hide' : 'Show'} Latency Metrics
        </Button>
      </div>

      {/* Transcript */}
      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4">
        {turns.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No conversation turns yet</p>
        ) : (
          turns.map((turn, index) => (
            <div key={turn.id} className="space-y-3">
              {/* Turn Number & Timestamp */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>Turn {index + 1}</span>
                <span>•</span>
                <span>{new Date(turn.startedAt).toLocaleTimeString()}</span>
              </div>

              {/* User Message */}
              {turn.userMessage && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{turn.userMessage}</p>
                    </div>
                    {showLatencyMetrics && turn.sttLatencyMs && (
                      <div className="mt-1 text-xs text-gray-500">
                        STT: {turn.sttLatencyMs}ms
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tool Calls (if any) */}
              {turn.toolCalls && (
                <div className="flex gap-3 ml-11">
                  <div className="flex-1">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-purple-900 mb-2">
                        🛠️ Tool Execution
                      </p>
                      <pre className="text-xs text-purple-700 overflow-auto">
                        {JSON.stringify(JSON.parse(turn.toolCalls), null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Assistant Message */}
              {turn.assistantMessage && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{turn.assistantMessage}</p>
                    </div>
                    {showLatencyMetrics && (
                      <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                        {turn.llmLatencyMs && <span>LLM: {turn.llmLatencyMs}ms</span>}
                        {turn.ttsLatencyMs && <span>TTS: {turn.ttsLatencyMs}ms</span>}
                        {turn.totalLatencyMs && (
                          <span className="font-medium">
                            Total: {turn.totalLatencyMs}ms
                          </span>
                        )}
                      </div>
                    )}
                    {/* Audio playback placeholder - would connect to actual audio storage */}
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePlay(turn.id)}
                        disabled
                      >
                        {playingTurnId === turn.id ? (
                          <Pause className="h-3 w-3 mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        <span className="text-xs">Audio (Coming Soon)</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
