import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  TrendingUp,
  Users,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  BarChart3,
} from 'lucide-react';
import LatencyChart from '@/components/analytics/latency-chart';
import AgentPerformanceTable from '@/components/analytics/agent-performance-table';
import SessionVolumeChart from '@/components/analytics/session-volume-chart';

export default async function AnalyticsPage() {
  // Fetch aggregated metrics
  const agents = await db.agent.findMany({
    include: {
      sessions: {
        include: {
          turns: true,
          evaluation: true,
        },
      },
    },
  });

  // Calculate overall stats
  const totalSessions = agents.reduce((sum, agent) => sum + agent.sessions.length, 0);
  const completedSessions = agents.reduce(
    (sum, agent) => sum + agent.sessions.filter(s => s.status === 'completed').length,
    0
  );
  const activeSessions = agents.reduce(
    (sum, agent) => sum + agent.sessions.filter(s => s.status === 'active').length,
    0
  );

  // Calculate latency metrics across all sessions
  const allTurns = agents.flatMap(agent =>
    agent.sessions.flatMap(session => session.turns)
  );

  const avgTotalLatency = allTurns.length > 0
    ? allTurns.reduce((sum, t) => sum + (t.totalLatencyMs || 0), 0) / allTurns.length
    : 0;

  const avgLLMLatency = allTurns.length > 0
    ? allTurns.reduce((sum, t) => sum + (t.llmLatencyMs || 0), 0) / allTurns.length
    : 0;

  const avgTTSLatency = allTurns.length > 0
    ? allTurns.reduce((sum, t) => sum + (t.ttsLatencyMs || 0), 0) / allTurns.length
    : 0;

  const avgSTTLatency = allTurns.length > 0
    ? allTurns.reduce((sum, t) => sum + (t.sttLatencyMs || 0), 0) / allTurns.length
    : 0;

  // Calculate success rate
  const evaluatedSessions = agents.flatMap(agent =>
    agent.sessions.filter(s => s.evaluation?.overallSuccess !== null)
  );
  const successfulSessions = evaluatedSessions.filter(
    s => s.evaluation?.overallSuccess === true
  ).length;
  const successRate = evaluatedSessions.length > 0
    ? (successfulSessions / evaluatedSessions.length) * 100
    : 0;

  // Calculate average session duration
  const completedSessionsWithDuration = agents.flatMap(agent =>
    agent.sessions.filter(s => s.status === 'completed' && s.endedAt && s.startedAt)
  );
  const avgDuration = completedSessionsWithDuration.length > 0
    ? completedSessionsWithDuration.reduce(
        (sum, s) =>
          sum + (new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime()),
        0
      ) / completedSessionsWithDuration.length
    : 0;

  // Prepare agent performance data
  const agentPerformance = agents.map(agent => {
    const agentTurns = agent.sessions.flatMap(s => s.turns);
    const agentEvaluations = agent.sessions.filter(s => s.evaluation?.overallSuccess !== null);
    const agentSuccesses = agentEvaluations.filter(s => s.evaluation?.overallSuccess === true);

    return {
      id: agent.id,
      name: agent.name,
      totalSessions: agent.sessions.length,
      avgLatency: agentTurns.length > 0
        ? agentTurns.reduce((sum, t) => sum + (t.totalLatencyMs || 0), 0) / agentTurns.length
        : 0,
      successRate: agentEvaluations.length > 0
        ? (agentSuccesses.length / agentEvaluations.length) * 100
        : null,
      lastSessionAt: agent.sessions.length > 0
        ? new Date(Math.max(...agent.sessions.map(s => new Date(s.startedAt).getTime())))
        : null,
    };
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Performance insights across all voice agents
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sessions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Sessions
              </CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {activeSessions} active
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {completedSessions} completed
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Average Latency */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Response Time
              </CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(avgTotalLatency)}ms
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {avgTotalLatency < 800 ? '🟢 Excellent' : avgTotalLatency < 1500 ? '🟡 Good' : '🔴 Needs improvement'}
              </p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {successRate > 0 ? `${Math.round(successRate)}%` : 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {evaluatedSessions.length} evaluated sessions
              </p>
            </CardContent>
          </Card>

          {/* Avg Duration */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Duration
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgDuration > 0 ? `${Math.round(avgDuration / 1000)}s` : 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Per completed session
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="performance">
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="agents">
              <BarChart3 className="h-4 w-4 mr-2" />
              Agent Comparison
            </TabsTrigger>
            <TabsTrigger value="volume">
              <TrendingUp className="h-4 w-4 mr-2" />
              Volume Trends
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Latency Breakdown</CardTitle>
                <CardDescription>
                  Average response time by component
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LatencyChart
                  avgSTT={avgSTTLatency}
                  avgLLM={avgLLMLatency}
                  avgTTS={avgTTSLatency}
                  avgTotal={avgTotalLatency}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Speech-to-Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(avgSTTLatency)}ms
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Average STT latency</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">LLM Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(avgLLMLatency)}ms
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Average LLM latency</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Text-to-Speech</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(avgTTSLatency)}ms
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Average TTS latency</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agent Comparison Tab */}
          <TabsContent value="agents">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Comparison</CardTitle>
                <CardDescription>
                  Compare metrics across all agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentPerformanceTable agents={agentPerformance} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Volume Trends Tab */}
          <TabsContent value="volume">
            <Card>
              <CardHeader>
                <CardTitle>Session Volume Over Time</CardTitle>
                <CardDescription>
                  Daily conversation volume (last 30 days)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SessionVolumeChart sessions={agents.flatMap(a => a.sessions)} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
