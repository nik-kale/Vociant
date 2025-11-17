'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Zap, Mic, Volume2, MessageSquare } from 'lucide-react';

interface CallMetricsProps {
  avgLLMLatency: number;
  avgTTSLatency: number;
  avgSTTLatency: number;
  avgTotalLatency: number;
  turns: any[];
}

export default function CallMetrics({
  avgLLMLatency,
  avgTTSLatency,
  avgSTTLatency,
  avgTotalLatency,
  turns,
}: CallMetricsProps) {
  const getLatencyColor = (latency: number) => {
    if (latency < 500) return 'text-green-600';
    if (latency < 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLatencyBadge = (latency: number) => {
    if (latency < 500) return 'Excellent';
    if (latency < 1000) return 'Good';
    if (latency < 2000) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Latency */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Total Latency</span>
            </div>
            <span className={`text-lg font-bold ${getLatencyColor(avgTotalLatency)}`}>
              {Math.round(avgTotalLatency)}ms
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {getLatencyBadge(avgTotalLatency)}
          </div>
        </div>

        {/* Individual Components */}
        <div className="space-y-3">
          {/* LLM Latency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-600">LLM Processing</span>
            </div>
            <span className={`text-sm font-medium ${getLatencyColor(avgLLMLatency)}`}>
              {Math.round(avgLLMLatency)}ms
            </span>
          </div>

          {/* TTS Latency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-600">Text-to-Speech</span>
            </div>
            <span className={`text-sm font-medium ${getLatencyColor(avgTTSLatency)}`}>
              {Math.round(avgTTSLatency)}ms
            </span>
          </div>

          {/* STT Latency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-600">Speech-to-Text</span>
            </div>
            <span className={`text-sm font-medium ${getLatencyColor(avgSTTLatency)}`}>
              {Math.round(avgSTTLatency)}ms
            </span>
          </div>
        </div>

        {/* Latency Distribution */}
        <div className="pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Latency Breakdown</p>
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
            <div
              className="bg-purple-500"
              style={{
                width: `${(avgSTTLatency / avgTotalLatency) * 100}%`,
              }}
              title={`STT: ${Math.round(avgSTTLatency)}ms`}
            />
            <div
              className="bg-blue-500"
              style={{
                width: `${(avgLLMLatency / avgTotalLatency) * 100}%`,
              }}
              title={`LLM: ${Math.round(avgLLMLatency)}ms`}
            />
            <div
              className="bg-green-500"
              style={{
                width: `${(avgTTSLatency / avgTotalLatency) * 100}%`,
              }}
              title={`TTS: ${Math.round(avgTTSLatency)}ms`}
            />
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>STT</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>LLM</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>TTS</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
