/**
 * A/B Testing Utilities
 *
 * Manages variant selection, traffic splitting, and test evaluation
 */

export interface ABTestVariant {
  id: string;
  name: string;
  isControl: boolean;
  trafficWeight: number;
  config?: Record<string, any>;
  totalSessions: number;
  successCount: number;
  successRate?: number | null;
  avgLatencyMs?: number | null;
}

export interface ABTest {
  id: string;
  name: string;
  status: string;
  trafficAllocation: number;
  variants: ABTestVariant[];
  minSampleSize: number;
  successMetric: string;
}

/**
 * Select a variant for a new session based on traffic weights
 *
 * Uses weighted random selection to ensure proper traffic distribution
 *
 * @param test - The A/B test configuration
 * @returns Selected variant ID
 */
export function selectVariant(test: ABTest): string | null {
  // Check if test should run (traffic allocation)
  const random = Math.random() * 100;
  if (random > test.trafficAllocation) {
    return null; // Session not included in test
  }

  // Weighted random selection among variants
  const totalWeight = test.variants.reduce((sum, v) => sum + v.trafficWeight, 0);

  if (totalWeight === 0) {
    return test.variants[0]?.id || null;
  }

  let threshold = Math.random() * totalWeight;

  for (const variant of test.variants) {
    threshold -= variant.trafficWeight;
    if (threshold <= 0) {
      return variant.id;
    }
  }

  // Fallback to first variant
  return test.variants[0]?.id || null;
}

/**
 * Calculate statistical significance between variants
 *
 * Uses Chi-squared test for conversion rate comparison
 *
 * @param control - Control variant metrics
 * @param variant - Treatment variant metrics
 * @returns p-value (lower is more significant, <0.05 typically means significant)
 */
export function calculateSignificance(
  control: { successCount: number; totalSessions: number },
  variant: { successCount: number; totalSessions: number }
): number {
  const n1 = control.totalSessions;
  const n2 = variant.totalSessions;
  const p1 = n1 > 0 ? control.successCount / n1 : 0;
  const p2 = n2 > 0 ? variant.successCount / n2 : 0;

  // Pooled proportion
  const p = (control.successCount + variant.successCount) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));

  if (se === 0) {
    return 1; // No variance, not significant
  }

  // Z-score
  const z = Math.abs(p1 - p2) / se;

  // Approximate p-value using standard normal distribution
  // This is a simplified version; production would use proper statistical library
  const pValue = 2 * (1 - normalCDF(z));

  return pValue;
}

/**
 * Standard normal cumulative distribution function (approximation)
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return x > 0 ? 1 - prob : prob;
}

/**
 * Determine if test has reached minimum sample size
 */
export function hasMinimumSampleSize(test: ABTest): boolean {
  return test.variants.every(v => v.totalSessions >= test.minSampleSize);
}

/**
 * Get winning variant (if statistically significant)
 *
 * @returns Variant ID of winner, or null if no clear winner
 */
export function getWinningVariant(test: ABTest): string | null {
  if (!hasMinimumSampleSize(test)) {
    return null; // Not enough data
  }

  const control = test.variants.find(v => v.isControl);
  if (!control) {
    return null; // No control variant defined
  }

  let bestVariant: ABTestVariant | null = null;
  let bestPValue = 1;

  for (const variant of test.variants) {
    if (variant.isControl) continue;

    const successRate = variant.successRate || 0;
    const controlRate = control.successRate || 0;

    // Only consider if better than control
    if (successRate > controlRate) {
      const pValue = calculateSignificance(
        { successCount: control.successCount, totalSessions: control.totalSessions },
        { successCount: variant.successCount, totalSessions: variant.totalSessions }
      );

      if (pValue < bestPValue) {
        bestPValue = pValue;
        bestVariant = variant;
      }
    }
  }

  // Consider significant if p < 0.05
  if (bestPValue < 0.05 && bestVariant) {
    return bestVariant.id;
  }

  return null; // No statistically significant winner
}

/**
 * Calculate confidence interval for a variant's success rate
 *
 * @returns [lower bound, upper bound] as percentages
 */
export function getConfidenceInterval(
  successCount: number,
  totalSessions: number,
  confidenceLevel = 0.95
): [number, number] {
  if (totalSessions === 0) {
    return [0, 0];
  }

  const p = successCount / totalSessions;
  const z = confidenceLevel === 0.95 ? 1.96 : 2.576; // 95% or 99%

  const margin = z * Math.sqrt((p * (1 - p)) / totalSessions);

  return [
    Math.max(0, (p - margin) * 100),
    Math.min(100, (p + margin) * 100),
  ];
}

/**
 * Apply variant configuration to agent config
 */
export function applyVariantConfig(
  baseConfig: Record<string, any>,
  variantConfig?: Record<string, any>
): Record<string, any> {
  if (!variantConfig) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    ...variantConfig,
  };
}
