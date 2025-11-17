'use client';

import { useMemo } from 'react';

interface Session {
  id: string;
  startedAt: Date;
  status: string;
}

interface SessionVolumeChartProps {
  sessions: Session[];
}

export default function SessionVolumeChart({ sessions }: SessionVolumeChartProps) {
  const volumeData = useMemo(() => {
    // Get last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Group sessions by day
    const dayMap = new Map<string, number>();

    // Initialize all days with 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      dayMap.set(dateKey, 0);
    }

    // Count sessions per day
    sessions.forEach(session => {
      const sessionDate = new Date(session.startedAt);
      if (sessionDate >= thirtyDaysAgo) {
        const dateKey = sessionDate.toISOString().split('T')[0];
        dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + 1);
      }
    });

    // Convert to array and sort
    const data = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const maxCount = Math.max(...data.map(d => d.count), 1);

    return { data, maxCount };
  }, [sessions]);

  return (
    <div className="space-y-4">
      {volumeData.data.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No session data available</p>
      ) : (
        <>
          {/* Chart */}
          <div className="flex items-end justify-between gap-1 h-48 px-2">
            {volumeData.data.map((day, index) => {
              const barHeight = (day.count / volumeData.maxCount) * 100;
              const isWeekend = new Date(day.date).getDay() === 0 || new Date(day.date).getDay() === 6;

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                >
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      day.count > 0
                        ? isWeekend
                          ? 'bg-blue-400 hover:bg-blue-500'
                          : 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-200'
                    }`}
                    style={{ height: `${barHeight}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <div className="font-medium">{day.count} sessions</div>
                      <div className="text-gray-400">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels (show every 5 days) */}
          <div className="flex justify-between text-xs text-gray-500 px-2">
            {volumeData.data
              .filter((_, index) => index % 5 === 0 || index === volumeData.data.length - 1)
              .map((day) => (
                <div key={day.date}>
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {volumeData.data.reduce((sum, d) => sum + d.count, 0)}
              </p>
              <p className="text-xs text-gray-500">Total Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  volumeData.data.reduce((sum, d) => sum + d.count, 0) / 30
                )}
              </p>
              <p className="text-xs text-gray-500">Daily Average</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{volumeData.maxCount}</p>
              <p className="text-xs text-gray-500">Peak Day</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-600" />
              <span>Weekday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-400" />
              <span>Weekend</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
