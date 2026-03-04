/**
 * Chart Layout Engine - Parametric SVG layout from chart data.
 * Gestalt spacing: CategoryGap = BarWidth * 0.4
 */

import type { ChartData } from "@deck-web/schema";

export interface SegmentLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  categoryIndex: number;
  seriesIndex: number;
  value: number;
  label: string;
  colorToken: import("@deck-web/schema").ColorRef;
}

export interface CategoryLabelLayout {
  x: number;
  y: number;
  text: string;
}

export interface StackedColumnLayoutResult {
  segments: SegmentLayout[];
  categoryLabels: CategoryLabelLayout[];
  maxValue: number;
}

const PADDING = 8;
const LABEL_FONT_SIZE = 10;

/**
 * Calculate stacked column layout in pixels.
 * Y-axis scale from max stack sum; Gestalt spacing: CategoryGap = BarWidth * 0.4
 */
export function calculateStackedColumnLayout(
  data: ChartData,
  containerWidth: number,
  containerHeight: number
): StackedColumnLayoutResult {
  const numCategories = data.categories.length;
  const numSeries = data.series.length;

  if (numCategories === 0 || numSeries === 0) {
    return { segments: [], categoryLabels: [], maxValue: 0 };
  }

  // Max stack sum per category (for Y-axis scale)
  let maxStackSum = 0;
  for (let c = 0; c < numCategories; c++) {
    let sum = 0;
    for (let s = 0; s < numSeries; s++) {
      sum += data.series[s]!.values[c]!;
    }
    maxStackSum = Math.max(maxStackSum, sum);
  }
  const scaleMax = maxStackSum > 0 ? maxStackSum : 1;

  // Chart area (leave room for labels)
  const chartLeft = PADDING;
  const chartRight = containerWidth - PADDING;
  const chartTop = PADDING;
  const chartBottom = containerHeight - PADDING - LABEL_FONT_SIZE * 2;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  // Gestalt: CategoryGap = BarWidth * 0.4
  // Total: N * BarWidth + (N-1) * CategoryGap = BarWidth * (N + 0.4*(N-1))
  const barWidth =
    chartWidth / (numCategories + 0.4 * (numCategories - 1));
  const categoryGap = barWidth * 0.4;

  const segments: SegmentLayout[] = [];
  const categoryLabels: CategoryLabelLayout[] = [];

  for (let catIdx = 0; catIdx < numCategories; catIdx++) {
    const categoryX = chartLeft + catIdx * (barWidth + categoryGap);

    // Category label (below bars)
    categoryLabels.push({
      x: categoryX + barWidth / 2,
      y: chartBottom + LABEL_FONT_SIZE + 4,
      text: data.categories[catIdx]!,
    });

    let stackBottom = 0;
    for (let seriesIdx = 0; seriesIdx < numSeries; seriesIdx++) {
      const value = data.series[seriesIdx]!.values[catIdx]!;
      const stackTop = stackBottom + value;

      const segmentHeight = (value / scaleMax) * chartHeight;
      const segmentY = chartBottom - (stackTop / scaleMax) * chartHeight;

      segments.push({
        x: categoryX,
        y: segmentY,
        width: barWidth,
        height: segmentHeight,
        categoryIndex: catIdx,
        seriesIndex: seriesIdx,
        value,
        label: String(value),
        colorToken: data.series[seriesIdx]!.colorToken,
      });

      stackBottom = stackTop;
    }
  }

  return {
    segments,
    categoryLabels,
    maxValue: scaleMax,
  };
}
