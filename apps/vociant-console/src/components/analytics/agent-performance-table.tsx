'use client';

import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import Link from 'next/link';

interface AgentPerformance {
  id: string;
  name: string;
  totalSessions: number;
  avgLatency: number;
  successRate: number | null;
  lastSessionAt: Date | null;
}

interface AgentPerformanceTableProps {
  agents: AgentPerformance[];
}

export default function AgentPerformanceTable({ agents }: AgentPerformanceTableProps) {
  const sortedAgents = [...agents].sort((a, b) => b.totalSessions - a.totalSessions);

  const getLatencyBadge = (latency: number) => {
    if (latency < 800) return { variant: 'default' as const, icon: <ArrowDownRight className="h-3 w-3" />, label: 'Excellent' };
    if (latency < 1500) return { variant: 'secondary' as const, icon: <Minus className="h-3 w-3" />, label: 'Good' };
    return { variant: 'destructive' as const, icon: <ArrowUpRight className="h-3 w-3" />, label: 'Needs Work' };
  };

  return (
    <div className="overflow-x-auto">
      {sortedAgents.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No agents with sessions yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Agent</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Sessions</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Avg Latency</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Success Rate</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Last Session</th>
            </tr>
          </thead>
          <tbody>
            {sortedAgents.map((agent) => {
              const latencyBadge = getLatencyBadge(agent.avgLatency);

              return (
                <tr key={agent.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <Link
                      href={`/dashboard/agents/${agent.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {agent.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="outline">{agent.totalSessions}</Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono">{Math.round(agent.avgLatency)}ms</span>
                      <Badge variant={latencyBadge.variant} className="flex items-center gap-1">
                        {latencyBadge.icon}
                        {latencyBadge.label}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {agent.successRate !== null ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">{Math.round(agent.successRate)}%</span>
                        {agent.successRate >= 80 ? (
                          <span className="text-green-600">✓</span>
                        ) : agent.successRate >= 60 ? (
                          <span className="text-yellow-600">⚠</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {agent.lastSessionAt
                      ? new Date(agent.lastSessionAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
