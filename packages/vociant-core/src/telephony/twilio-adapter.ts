/**
 * Twilio Telephony Adapter
 *
 * Integrates Vociant with Twilio for phone call support
 * SECURITY: Validates webhooks, handles call authentication
 */

import { createHmac } from 'crypto';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  webhookUrl: string;
}

export interface CallSession {
  callSid: string;
  from: string;
  to: string;
  status: 'ringing' | 'in-progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export class TwilioAdapter {
  private config: TwilioConfig;

  constructor(config: TwilioConfig) {
    this.config = config;
  }

  /**
   * Validate Twilio webhook signature
   * SECURITY: Prevents webhook spoofing attacks
   */
  validateWebhookSignature(signature: string, url: string, params: Record<string, any>): boolean {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();
    let data = url;

    for (const key of sortedKeys) {
      data += key + params[key];
    }

    // Compute HMAC-SHA1
    const expectedSignature = createHmac('sha1', this.config.authToken)
      .update(Buffer.from(data, 'utf-8'))
      .digest('base64');

    // Timing-safe comparison
    return this.timingSafeEqual(signature, expectedSignature);
  }

  /**
   * Timing-safe string comparison
   * SECURITY: Prevents timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Generate TwiML response for voice calls
   */
  generateTwiML(options: {
    message?: string;
    streamUrl?: string;
    gatherInput?: boolean;
    redirect?: string;
  }): string {
    const twiml = ['<?xml version="1.0" encoding="UTF-8"?>', '<Response>'];

    if (options.message) {
      twiml.push(`  <Say>${this.escapeXml(options.message)}</Say>`);
    }

    if (options.streamUrl) {
      twiml.push(`  <Start>`, `    <Stream url="${this.escapeXml(options.streamUrl)}" />`, `  </Start>`);
    }

    if (options.gatherInput) {
      twiml.push(
        `  <Gather input="speech" timeout="3" speechTimeout="auto">`,
        `    <Say>Please speak after the beep.</Say>`,
        `  </Gather>`
      );
    }

    if (options.redirect) {
      twiml.push(`  <Redirect>${this.escapeXml(options.redirect)}</Redirect>`);
    }

    twiml.push('</Response>');

    return twiml.join('\n');
  }

  /**
   * Escape XML special characters
   * SECURITY: Prevents XML injection
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Make outbound call
   */
  async makeCall(to: string, from?: string): Promise<CallSession> {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64'),
        },
        body: new URLSearchParams({
          To: to,
          From: from || this.config.phoneNumber,
          Url: this.config.webhookUrl,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      callSid: data.sid,
      from: data.from,
      to: data.to,
      status: this.mapTwilioStatus(data.status),
      startTime: data.start_time ? new Date(data.start_time) : undefined,
    };
  }

  /**
   * End call
   */
  async endCall(callSid: string): Promise<void> {
    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.config.accountSid}/Calls/${callSid}.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString('base64'),
        },
        body: new URLSearchParams({
          Status: 'completed',
        }),
      }
    );
  }

  /**
   * Map Twilio status to our status
   */
  private mapTwilioStatus(status: string): CallSession['status'] {
    switch (status) {
      case 'ringing':
      case 'queued':
        return 'ringing';
      case 'in-progress':
      case 'initiated':
        return 'in-progress';
      case 'completed':
        return 'completed';
      case 'failed':
      case 'busy':
      case 'no-answer':
      case 'canceled':
        return 'failed';
      default:
        return 'in-progress';
    }
  }
}
