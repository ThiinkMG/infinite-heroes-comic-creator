/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Consistency metrics utility for debugging character generation.
 * Stores metrics in memory for debugging (not persisted).
 */

export interface ConsistencyMetrics {
  pageIndex: number;
  characterName: string;
  promptLength: number;
  imageRefCount: number;
  identityFieldsFilled: number;
  hardNegativesUsed: string[];
  timestamp: number;
}

// Store metrics in memory for debugging (not persisted)
const metricsLog: ConsistencyMetrics[] = [];

export function logConsistencyMetrics(metrics: ConsistencyMetrics): void {
  metricsLog.push(metrics);
  console.log(`[Consistency Metrics] Page ${metrics.pageIndex}, ${metrics.characterName}:`, metrics);
}

export function getMetricsLog(): ConsistencyMetrics[] {
  return [...metricsLog];
}

export function clearMetricsLog(): void {
  metricsLog.length = 0;
}
