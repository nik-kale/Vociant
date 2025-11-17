/**
 * Webhook Utilities
 *
 * Handles webhook delivery with retry logic and HMAC signing
 */

import { generateWebhookSignature } from './auth';

export interface WebhookPayload {
  event: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface WebhookConfig {
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
}

/**
 * Send webhook with HMAC signature and retry logic
 *
 * @param webhook - Webhook configuration
 * @param payload - Event payload
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Success status
 */
export async function sendWebhook(
  webhook: WebhookConfig,
  payload: WebhookPayload,
  maxRetries = 3
): Promise<boolean> {
  if (!webhook.isActive) {
    return false;
  }

  // Check if webhook should receive this event
  if (!webhook.events.includes(payload.event) && !webhook.events.includes('*')) {
    return false; // Webhook not subscribed to this event
  }

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Vociant-Event': payload.event,
    'X-Vociant-Timestamp': payload.timestamp.toString(),
  };

  // Add HMAC signature if secret is configured
  if (webhook.secret) {
    const signature = generateWebhookSignature(body, webhook.secret);
    headers['X-Vociant-Signature'] = signature;
  }

  let lastError: Error | null = null;

  // Retry logic with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        return true; // Success
      }

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      // Retry on 5xx errors
      lastError = new Error(`Webhook returned ${response.status}`);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        break; // Network error, don't retry
      }
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // All retries failed
  console.error(`Webhook delivery failed after ${maxRetries} retries:`, lastError);
  return false;
}

/**
 * Send session completed webhook
 */
export async function sendSessionCompletedWebhook(
  webhooks: WebhookConfig[],
  sessionData: {
    sessionId: string;
    agentId: string;
    status: string;
    startedAt: Date;
    endedAt?: Date;
    turnCount: number;
    evaluation?: {
      overallSuccess: boolean;
      collectedData?: Record<string, any>;
    };
  }
): Promise<void> {
  const payload: WebhookPayload = {
    event: 'session.completed',
    timestamp: Date.now(),
    data: {
      session: {
        id: sessionData.sessionId,
        agentId: sessionData.agentId,
        status: sessionData.status,
        startedAt: sessionData.startedAt.toISOString(),
        endedAt: sessionData.endedAt?.toISOString(),
        turnCount: sessionData.turnCount,
      },
      evaluation: sessionData.evaluation,
    },
  };

  // Send to all active webhooks in parallel
  await Promise.allSettled(
    webhooks.map(webhook => sendWebhook(webhook, payload))
  );
}

/**
 * Send agent evaluated webhook
 */
export async function sendAgentEvaluatedWebhook(
  webhooks: WebhookConfig[],
  evaluationData: {
    sessionId: string;
    agentId: string;
    overallSuccess: boolean;
    successCriteria?: string[];
    evaluationResults?: Record<string, boolean>;
    collectedData?: Record<string, any>;
  }
): Promise<void> {
  const payload: WebhookPayload = {
    event: 'agent.evaluated',
    timestamp: Date.now(),
    data: {
      evaluation: evaluationData,
    },
  };

  await Promise.allSettled(
    webhooks.map(webhook => sendWebhook(webhook, payload))
  );
}

/**
 * Send session started webhook
 */
export async function sendSessionStartedWebhook(
  webhooks: WebhookConfig[],
  sessionData: {
    sessionId: string;
    agentId: string;
    channelType: string;
    startedAt: Date;
  }
): Promise<void> {
  const payload: WebhookPayload = {
    event: 'session.started',
    timestamp: Date.now(),
    data: {
      session: sessionData,
    },
  };

  await Promise.allSettled(
    webhooks.map(webhook => sendWebhook(webhook, payload))
  );
}

/**
 * Send session failed webhook
 */
export async function sendSessionFailedWebhook(
  webhooks: WebhookConfig[],
  sessionData: {
    sessionId: string;
    agentId: string;
    error: string;
    failedAt: Date;
  }
): Promise<void> {
  const payload: WebhookPayload = {
    event: 'session.failed',
    timestamp: Date.now(),
    data: {
      session: sessionData,
    },
  };

  await Promise.allSettled(
    webhooks.map(webhook => sendWebhook(webhook, payload))
  );
}
