/**
 * Conversation Guardrails Engine
 *
 * Enforces conversation boundaries, content filtering, and safety
 * SECURITY: Prevents toxic content, PII leaks, off-topic discussions
 */

export interface Guardrail {
  id: string;
  name: string;
  type: 'content_filter' | 'topic_boundary' | 'pii_detection' | 'toxicity' | 'custom';
  config: GuardrailConfig;
  action: 'warn' | 'block' | 'redirect' | 'escalate';
  isEnabled: boolean;
  priority: number;
}

export interface GuardrailConfig {
  // Content filter
  blockedWords?: string[];
  blockedPatterns?: string[];

  // Topic boundary
  allowedTopics?: string[];
  forbiddenTopics?: string[];

  // PII detection
  detectSSN?: boolean;
  detectCreditCard?: boolean;
  detectEmail?: boolean;
  detectPhone?: boolean;

  // Toxicity
  toxicityThreshold?: number; // 0-1

  // Custom rules
  customRules?: CustomRule[];
}

export interface CustomRule {
  pattern: string;
  action: 'warn' | 'block';
  message?: string;
}

export interface GuardrailViolation {
  guardrailId: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  detectedContent?: string;
  action: 'warn' | 'block' | 'redirect' | 'escalate';
}

export class GuardrailEngine {
  private guardrails: Guardrail[];

  constructor(guardrails: Guardrail[]) {
    // Sort by priority (higher first)
    this.guardrails = guardrails
      .filter(g => g.isEnabled)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check text against all guardrails
   * Returns violations if any
   */
  async checkText(text: string, context?: Record<string, any>): Promise<GuardrailViolation[]> {
    const violations: GuardrailViolation[] = [];

    for (const guardrail of this.guardrails) {
      const violation = await this.checkGuardrail(guardrail, text, context);
      if (violation) {
        violations.push(violation);

        // Stop on first blocking violation
        if (violation.action === 'block') {
          break;
        }
      }
    }

    return violations;
  }

  /**
   * Check single guardrail
   */
  private async checkGuardrail(
    guardrail: Guardrail,
    text: string,
    context?: Record<string, any>
  ): Promise<GuardrailViolation | null> {
    switch (guardrail.type) {
      case 'content_filter':
        return this.checkContentFilter(guardrail, text);

      case 'topic_boundary':
        return this.checkTopicBoundary(guardrail, text, context);

      case 'pii_detection':
        return this.checkPII(guardrail, text);

      case 'toxicity':
        return await this.checkToxicity(guardrail, text);

      case 'custom':
        return this.checkCustomRules(guardrail, text);

      default:
        return null;
    }
  }

  /**
   * Content filter - blocked words and patterns
   * SECURITY: Prevents inappropriate content
   */
  private checkContentFilter(guardrail: Guardrail, text: string): GuardrailViolation | null {
    const lowerText = text.toLowerCase();

    // Check blocked words
    if (guardrail.config.blockedWords) {
      for (const word of guardrail.config.blockedWords) {
        if (lowerText.includes(word.toLowerCase())) {
          return {
            guardrailId: guardrail.id,
            type: 'content_filter',
            severity: 'high',
            message: `Blocked word detected: "${word}"`,
            detectedContent: word,
            action: guardrail.action,
          };
        }
      }
    }

    // Check blocked patterns (regex)
    if (guardrail.config.blockedPatterns) {
      for (const pattern of guardrail.config.blockedPatterns) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(text)) {
            return {
              guardrailId: guardrail.id,
              type: 'content_filter',
              severity: 'high',
              message: 'Blocked pattern detected',
              action: guardrail.action,
            };
          }
        } catch (e) {
          console.error('Invalid regex pattern:', pattern);
        }
      }
    }

    return null;
  }

  /**
   * Topic boundary - keep conversation on topic
   */
  private checkTopicBoundary(
    guardrail: Guardrail,
    text: string,
    context?: Record<string, any>
  ): GuardrailViolation | null {
    // Simple keyword-based topic detection
    const lowerText = text.toLowerCase();

    // Check forbidden topics
    if (guardrail.config.forbiddenTopics) {
      for (const topic of guardrail.config.forbiddenTopics) {
        if (lowerText.includes(topic.toLowerCase())) {
          return {
            guardrailId: guardrail.id,
            type: 'topic_boundary',
            severity: 'medium',
            message: `Off-topic discussion detected: ${topic}`,
            detectedContent: topic,
            action: guardrail.action,
          };
        }
      }
    }

    // Check allowed topics (if strict mode)
    if (guardrail.config.allowedTopics && guardrail.config.allowedTopics.length > 0) {
      const hasAllowedTopic = guardrail.config.allowedTopics.some(topic =>
        lowerText.includes(topic.toLowerCase())
      );

      if (!hasAllowedTopic && text.split(' ').length > 5) {
        // Only flag longer messages
        return {
          guardrailId: guardrail.id,
          type: 'topic_boundary',
          severity: 'low',
          message: 'Conversation may be off-topic',
          action: 'warn',
        };
      }
    }

    return null;
  }

  /**
   * PII detection - prevent leaking sensitive information
   * SECURITY: Critical for compliance (GDPR, HIPAA, etc.)
   */
  private checkPII(guardrail: Guardrail, text: string): GuardrailViolation | null {
    const patterns = [];

    if (guardrail.config.detectSSN) {
      // SSN pattern: 123-45-6789
      patterns.push({
        regex: /\b\d{3}-\d{2}-\d{4}\b/g,
        type: 'SSN',
      });
    }

    if (guardrail.config.detectCreditCard) {
      // Credit card pattern: 16 digits with optional spaces/dashes
      patterns.push({
        regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        type: 'Credit Card',
      });
    }

    if (guardrail.config.detectEmail) {
      // Email pattern
      patterns.push({
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        type: 'Email',
      });
    }

    if (guardrail.config.detectPhone) {
      // Phone pattern: various formats
      patterns.push({
        regex: /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
        type: 'Phone Number',
      });
    }

    for (const { regex, type } of patterns) {
      const matches = text.match(regex);
      if (matches) {
        return {
          guardrailId: guardrail.id,
          type: 'pii_detection',
          severity: 'high',
          message: `Potential ${type} detected`,
          detectedContent: `${matches.length} instance(s)`,
          action: guardrail.action,
        };
      }
    }

    return null;
  }

  /**
   * Toxicity detection
   * SECURITY: Prevents abusive language
   *
   * Note: This is a simple keyword-based approach.
   * Production should use ML models like Perspective API
   */
  private async checkToxicity(guardrail: Guardrail, text: string): Promise<GuardrailViolation | null> {
    // Simple toxic keyword list (production would use ML model)
    const toxicPatterns = [
      /\b(hate|stupid|idiot|dumb)\b/i,
      // Add more patterns as needed
    ];

    const lowerText = text.toLowerCase();
    let toxicMatches = 0;

    for (const pattern of toxicPatterns) {
      if (pattern.test(text)) {
        toxicMatches++;
      }
    }

    const threshold = guardrail.config.toxicityThreshold || 0.5;
    const score = Math.min(toxicMatches * 0.3, 1.0);

    if (score >= threshold) {
      return {
        guardrailId: guardrail.id,
        type: 'toxicity',
        severity: score > 0.7 ? 'high' : 'medium',
        message: `Potentially toxic content detected (score: ${(score * 100).toFixed(0)}%)`,
        action: guardrail.action,
      };
    }

    return null;
  }

  /**
   * Custom rules - user-defined patterns
   */
  private checkCustomRules(guardrail: Guardrail, text: string): GuardrailViolation | null {
    if (!guardrail.config.customRules) {
      return null;
    }

    for (const rule of guardrail.config.customRules) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(text)) {
          return {
            guardrailId: guardrail.id,
            type: 'custom',
            severity: 'medium',
            message: rule.message || 'Custom rule violated',
            action: rule.action,
          };
        }
      } catch (e) {
        console.error('Invalid custom rule pattern:', rule.pattern);
      }
    }

    return null;
  }

  /**
   * Get violation response message
   */
  static getViolationResponse(violation: GuardrailViolation): string {
    switch (violation.type) {
      case 'content_filter':
        return "I'm sorry, but I can't discuss that topic. Let's talk about something else.";

      case 'topic_boundary':
        return "That's a bit off-topic. Let me help you with what I'm designed for.";

      case 'pii_detection':
        return "For your security, please don't share personal information like that with me.";

      case 'toxicity':
        return "I'm here to help. Let's keep our conversation respectful.";

      case 'custom':
        return violation.message || "I can't help with that request.";

      default:
        return "I'm sorry, I can't help with that.";
    }
  }
}
