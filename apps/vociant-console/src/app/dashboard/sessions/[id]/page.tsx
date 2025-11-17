import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatDuration } from '@/lib/utils';
import TranscriptViewer from '@/components/analytics/transcript-viewer';
import CallMetrics from '@/components/analytics/call-metrics';
import SentimentAnalysis from '@/components/analytics/sentiment-analysis';

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await db.session.findUnique({
    where: { id: params.id },
    include: {
      agent: true,
      turns: {
        orderBy: { startedAt: 'asc' },
      },
      evaluation: true,
    },
  });

  if (!session) {
    notFound();
  }

  const duration =
    session.endedAt && session.startedAt
      ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
      : null;

  // Calculate average latencies
  const avgLLMLatency = session.turns.length > 0
    ? session.turns.reduce((sum, t) => sum + (t.llmLatencyMs || 0), 0) / session.turns.length
    : 0;

  const avgTTSLatency = session.turns.length > 0
    ? session.turns.reduce((sum, t) => sum + (t.ttsLatencyMs || 0), 0) / session.turns.length
    : 0;

  const avgSTTLatency = session.turns.length > 0
    ? session.turns.reduce((sum, t) => sum + (t.sttLatencyMs || 0), 0) / session.turns.length
    : 0;

  const avgTotalLatency = session.turns.length > 0
    ? session.turns.reduce((sum, t) => sum + (t.totalLatencyMs || 0), 0) / session.turns.length
    : 0;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/sessions">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Session Details</h1>
              <p className="text-gray-600 mt-1">
                {session.agent.name} • {formatDate(session.startedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Transcript
              </Button>
              <Badge
                variant={
                  session.status === 'completed'
                    ? 'default'
                    : session.status === 'active'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {session.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Session Info & Metrics */}
          <div className="space-y-6">
            {/* Session Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Session ID</p>
                  <p className="font-mono text-sm">{session.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">
                    {duration ? formatDuration(duration) : 'In progress'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Turns</p>
                  <p className="font-medium">{session.turns.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Channel</p>
                  <p className="font-medium capitalize">{session.channelType}</p>
                </div>
                {session.overrides && (
                  <div>
                    <p className="text-sm text-gray-500">Overrides</p>
                    <Badge variant="outline">Custom Configuration</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <CallMetrics
              avgLLMLatency={avgLLMLatency}
              avgTTSLatency={avgTTSLatency}
              avgSTTLatency={avgSTTLatency}
              avgTotalLatency={avgTotalLatency}
              turns={session.turns}
            />

            {/* Evaluation (if exists) */}
            {session.evaluation && (
              <Card>
                <CardHeader>
                  <CardTitle>Evaluation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Overall Success</span>
                    {session.evaluation.overallSuccess ? (
                      <Badge className="bg-green-100 text-green-800">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    ) : session.evaluation.overallSuccess === false ? (
                      <Badge className="bg-red-100 text-red-800">
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Evaluated</Badge>
                    )}
                  </div>
                  {session.evaluation.successCriteria && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Success Criteria</p>
                      <div className="text-sm space-y-1">
                        {JSON.parse(session.evaluation.successCriteria).map(
                          (criterion: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-gray-400">•</span>
                              <span>{criterion}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  {session.evaluation.collectedData && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Collected Data</p>
                      <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto">
                        {JSON.stringify(JSON.parse(session.evaluation.collectedData), null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sentiment Analysis */}
            <SentimentAnalysis turns={session.turns} />
          </div>

          {/* Right Column - Transcript */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Conversation Transcript</CardTitle>
                <CardDescription>
                  Full transcript with timing and latency metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TranscriptViewer turns={session.turns} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
