'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile, Meh, Frown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface Turn {
  id: string;
  userMessage: string | null;
  assistantMessage: string | null;
}

interface SentimentAnalysisProps {
  turns: Turn[];
}

// Simple sentiment analysis based on keywords (production would use ML model)
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase();

  const positiveWords = ['great', 'excellent', 'good', 'thank', 'thanks', 'perfect', 'yes', 'sure', 'happy', 'love', 'awesome'];
  const negativeWords = ['bad', 'terrible', 'wrong', 'error', 'issue', 'problem', 'no', 'not', 'never', 'hate', 'awful'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

export default function SentimentAnalysis({ turns }: SentimentAnalysisProps) {
  const sentimentStats = useMemo(() => {
    let positive = 0;
    let neutral = 0;
    let negative = 0;

    turns.forEach(turn => {
      if (turn.userMessage) {
        const sentiment = analyzeSentiment(turn.userMessage);
        if (sentiment === 'positive') positive++;
        else if (sentiment === 'negative') negative++;
        else neutral++;
      }
    });

    const total = positive + neutral + negative;

    return {
      positive,
      neutral,
      negative,
      total,
      positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0,
      neutralPercent: total > 0 ? Math.round((neutral / total) * 100) : 0,
      negativePercent: total > 0 ? Math.round((negative / total) * 100) : 0,
      overallSentiment:
        positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral',
    };
  }, [turns]);

  const getSentimentIcon = () => {
    if (sentimentStats.overallSentiment === 'positive') {
      return <Smile className="h-5 w-5 text-green-600" />;
    }
    if (sentimentStats.overallSentiment === 'negative') {
      return <Frown className="h-5 w-5 text-red-600" />;
    }
    return <Meh className="h-5 w-5 text-yellow-600" />;
  };

  const getSentimentColor = () => {
    if (sentimentStats.overallSentiment === 'positive') return 'text-green-600';
    if (sentimentStats.overallSentiment === 'negative') return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Sentiment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sentimentStats.total === 0 ? (
          <p className="text-sm text-gray-500">No user messages to analyze</p>
        ) : (
          <>
            {/* Overall Sentiment */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Overall Sentiment</span>
              <div className="flex items-center gap-2">
                {getSentimentIcon()}
                <span className={`font-medium capitalize ${getSentimentColor()}`}>
                  {sentimentStats.overallSentiment}
                </span>
              </div>
            </div>

            {/* Distribution */}
            <div className="space-y-3">
              {/* Positive */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Smile className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Positive</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {sentimentStats.positivePercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${sentimentStats.positivePercent}%` }}
                  />
                </div>
              </div>

              {/* Neutral */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Meh className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Neutral</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-600">
                    {sentimentStats.neutralPercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full transition-all"
                    style={{ width: `${sentimentStats.neutralPercent}%` }}
                  />
                </div>
              </div>

              {/* Negative */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Frown className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">Negative</span>
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    {sentimentStats.negativePercent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${sentimentStats.negativePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Message Count */}
            <div className="pt-3 border-t text-xs text-gray-500">
              Analyzed {sentimentStats.total} user {sentimentStats.total === 1 ? 'message' : 'messages'}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
