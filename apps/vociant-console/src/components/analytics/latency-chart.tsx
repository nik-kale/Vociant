'use client';

interface LatencyChartProps {
  avgSTT: number;
  avgLLM: number;
  avgTTS: number;
  avgTotal: number;
}

export default function LatencyChart({ avgSTT, avgLLM, avgTTS, avgTotal }: LatencyChartProps) {
  const maxValue = Math.max(avgSTT, avgLLM, avgTTS, avgTotal);

  const getBarWidth = (value: number) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  const components = [
    { name: 'Speech-to-Text', value: avgSTT, color: 'bg-purple-500', textColor: 'text-purple-600' },
    { name: 'LLM Processing', value: avgLLM, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { name: 'Text-to-Speech', value: avgTTS, color: 'bg-green-500', textColor: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Horizontal Bar Chart */}
      <div className="space-y-4">
        {components.map((component) => (
          <div key={component.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{component.name}</span>
              <span className={`text-sm font-bold ${component.textColor}`}>
                {Math.round(component.value)}ms
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`${component.color} h-3 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${getBarWidth(component.value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total Latency */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">Total Pipeline Latency</span>
          <span className="text-lg font-bold text-gray-900">
            {Math.round(avgTotal)}ms
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 via-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `100%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Target: &lt;800ms (Industry Standard) •
          {avgTotal < 800 ? ' ✅ Meeting target' : ' ⚠️ Above target'}
        </p>
      </div>

      {/* Component Breakdown Pie */}
      <div className="pt-4 border-t">
        <p className="text-sm font-medium text-gray-700 mb-3">Component Distribution</p>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div
                className="bg-purple-500"
                style={{ width: `${(avgSTT / avgTotal) * 100}%` }}
                title={`STT: ${Math.round((avgSTT / avgTotal) * 100)}%`}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${(avgLLM / avgTotal) * 100}%` }}
                title={`LLM: ${Math.round((avgLLM / avgTotal) * 100)}%`}
              />
              <div
                className="bg-green-500"
                style={{ width: `${(avgTTS / avgTotal) * 100}%` }}
                title={`TTS: ${Math.round((avgTTS / avgTotal) * 100)}%`}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-gray-600">
              STT: {Math.round((avgSTT / avgTotal) * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-600">
              LLM: {Math.round((avgLLM / avgTotal) * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600">
              TTS: {Math.round((avgTTS / avgTotal) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
