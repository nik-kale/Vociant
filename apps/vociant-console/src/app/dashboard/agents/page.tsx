import { db } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Bot, Settings } from 'lucide-react';
import Link from 'next/link';

export default async function AgentsPage() {
  const agents = await db.agent.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          sessions: true,
        },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agents</h1>
            <p className="text-gray-600 mt-1">
              Manage your voice agents and their configurations
            </p>
          </div>
          <Link href="/dashboard/agents/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </Link>
        </div>

        {/* Agents Grid */}
        {agents.length === 0 ? (
          <Card className="p-12 text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first voice agent to get started
            </p>
            <Link href="/dashboard/agents/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{agent.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {agent.description || 'No description'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      agent.status === 'active'
                        ? 'default'
                        : agent.status === 'draft'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {agent.status}
                  </Badge>
                </div>

                {/* Provider Info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">TTS:</span>
                    <span className="font-medium">{agent.ttsProvider}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">STT:</span>
                    <span className="font-medium">{agent.sttProvider}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">LLM:</span>
                    <span className="font-medium">
                      {agent.llmProvider} • {agent.llmModel}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-gray-600">
                    {agent._count.sessions} sessions
                  </span>
                  <Link href={`/dashboard/agents/${agent.slug}`}>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
