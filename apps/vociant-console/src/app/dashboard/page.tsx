import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageSquare, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  // Fetch stats
  const [agentCount, sessionCount] = await Promise.all([
    db.agent.count(),
    db.session.count(),
  ]);

  const recentSessions = await db.session.findMany({
    take: 5,
    orderBy: { startedAt: 'desc' },
    include: {
      agent: true,
      turns: true,
    },
  });

  const activeAgents = await db.agent.findMany({
    where: { status: 'active' },
    take: 5,
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome to your Vociant control plane
            </p>
          </div>
          <Link href="/dashboard/agents/new">
            <Button>Create Agent</Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentCount}</div>
              <p className="text-xs text-muted-foreground">
                {activeAgents.length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionCount}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2m 34s</div>
              <p className="text-xs text-muted-foreground">Last 24h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.2%</div>
              <p className="text-xs text-muted-foreground">+2.1% from last week</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Agents */}
          <Card>
            <CardHeader>
              <CardTitle>Active Agents</CardTitle>
            </CardHeader>
            <CardContent>
              {activeAgents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active agents yet</p>
              ) : (
                <div className="space-y-4">
                  {activeAgents.map((agent) => (
                    <Link
                      key={agent.id}
                      href={`/dashboard/agents/${agent.slug}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.ttsProvider} • {agent.llmProvider}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(agent.updatedAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions yet</p>
              ) : (
                <div className="space-y-4">
                  {recentSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/dashboard/sessions/${session.id}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="font-medium">{session.agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.turns.length} turns • {session.status}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.startedAt).toLocaleTimeString()}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
