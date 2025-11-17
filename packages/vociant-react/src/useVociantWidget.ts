/**
 * useVociantWidget Hook
 *
 * React hook for managing Vociant widget lifecycle
 */

import { useEffect, useRef } from 'react';
import { VociantWidget } from '@vociant/sdk-js';
import type { VociantWidgetConfig } from '@vociant/sdk-js';

export interface UseVociantWidgetOptions extends VociantWidgetConfig {
  /** Enable widget */
  enabled?: boolean;
}

export function useVociantWidget(options: UseVociantWidgetOptions): void {
  const widgetRef = useRef<VociantWidget | null>(null);
  const { enabled = true, ...widgetConfig } = options;

  useEffect(() => {
    if (enabled && !widgetRef.current) {
      widgetRef.current = new VociantWidget(widgetConfig);
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
        widgetRef.current = null;
      }
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}
