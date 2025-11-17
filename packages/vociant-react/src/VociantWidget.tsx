/**
 * VociantWidget Component
 *
 * React component wrapper for Vociant widget
 */

import React from 'react';
import { useVociantWidget } from './useVociantWidget';
import type { UseVociantWidgetOptions } from './useVociantWidget';

export interface VociantWidgetProps extends UseVociantWidgetOptions {}

export function VociantWidget(props: VociantWidgetProps) {
  useVociantWidget(props);

  // Widget renders itself in a portal, so this component returns null
  return null;
}
