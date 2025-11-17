import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default async function SessionsPage() {
  const sessions = await db.session.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: {
      agent: true,
      turns: {
        orderBy: { startedAt: 'asc' },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-gray-600 mt-1">View all conversation sessions</p>
        </div>

        {sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No sessions yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const duration =
                session.endedAt && session.startedAt
                  ? new Date(session.endedAt).getTime() -
                    new Date(session.startedAt).getTime()
                  : null;

              return (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {session.agent.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(session.startedAt)}
                        </p>
                      </div>
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
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Turns</p>
                        <p className="font-medium">{session.turns.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium">
                          {duration ? formatDuration(duration) : 'In progress'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Channel</p>
                        <p className="font-medium">{session.channelType}</p>
                      </div>
                      <div className="text-right">
                        <Link
                          href={`/dashboard/sessions/${session.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
