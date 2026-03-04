/**
 * ParametricChart - Renders chart from data via layout engine.
 * Uses theme CSS variables, 0.75px white stroke, contrast-aware text.
 * Segment clicks open a BubbleMenu to change series color.
 */

import { useMemo, useState, useCallback } from "react";
import type { ChartElement, ColorRef, ThemeColorSlot } from "@deck-web/schema";
import { resolveColorRef } from "@deck-web/schema";
import { calculateStackedColumnLayout } from "../utils/chartLayoutEngine";
import { usePresentationStore } from "../store/usePresentationStore";
import { BubbleMenu } from "./BubbleMenu";

/** Luminance (0-1); < 0.5 is dark */
function getLuminance(hex: string): number {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return 0.5;
  const r = parseInt(m[1]!, 16) / 255;
  const g = parseInt(m[2]!, 16) / 255;
  const b = parseInt(m[3]!, 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function colorRefToCssVar(ref: ColorRef): string {
  if (typeof ref === "string") return `var(--theme-${ref})`;
  return ref.hex;
}

const LABEL_FONT_SIZE = 10;

interface ParametricChartProps {
  element: ChartElement;
  width: number;
  height: number;
}

export function ParametricChart({ element, width, height }: ParametricChartProps) {
  const colorScheme = usePresentationStore((s) => s.presentation.theme.colorScheme);
  const currentSlideId = usePresentationStore((s) => s.currentSlideId);
  const updateChartElementData = usePresentationStore(
    (s) => s.updateChartElementData
  );
  const commitHistory = usePresentationStore((s) => s.commitHistory);

  const [bubbleMenu, setBubbleMenu] = useState<{
    x: number;
    y: number;
    seriesIndex: number;
  } | null>(null);

  const handleSegmentClick = useCallback(
    (e: React.MouseEvent, seriesIndex: number) => {
      e.stopPropagation();
      setBubbleMenu({ x: e.clientX, y: e.clientY, seriesIndex });
    },
    []
  );

  const handleColorSelect = useCallback(
    (colorToken: ThemeColorSlot) => {
      if (!currentSlideId || bubbleMenu == null) return;
      const { seriesIndex } = bubbleMenu;
      const series = [...element.data.series];
      if (seriesIndex < 0 || seriesIndex >= series.length) return;
      series[seriesIndex] = {
        ...series[seriesIndex]!,
        colorToken,
      };
      updateChartElementData(currentSlideId, element.id, {
        ...element.data,
        series,
      });
      commitHistory();
    },
    [
      currentSlideId,
      element.id,
      element.data,
      bubbleMenu,
      updateChartElementData,
      commitHistory,
    ]
  );

  const layout = useMemo(() => {
    if (element.chartConfig.chartType === "STACKED_COLUMN") {
      return calculateStackedColumnLayout(element.data, width, height);
    }
    return calculateStackedColumnLayout(element.data, width, height);
  }, [element.data, element.chartConfig.chartType, width, height]);

  if (layout.segments.length === 0) {
    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--theme-dk2)"
          fontSize={12}
        >
          No data
        </text>
      </svg>
    );
  }

  return (
    <>
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {layout.segments.map((seg) => {
        const fillHex = resolveColorRef(seg.colorToken, colorScheme);
        const isDark = getLuminance(fillHex) < 0.5;
        const textFill = isDark ? "#ffffff" : "var(--theme-dk1)";

        return (
          <g key={`${seg.categoryIndex}-${seg.seriesIndex}`}>
            <rect
              x={seg.x}
              y={seg.y}
              width={seg.width}
              height={seg.height}
              fill={colorRefToCssVar(seg.colorToken)}
              stroke="#ffffff"
              strokeWidth={0.75}
              cursor="pointer"
              onClick={(e) => handleSegmentClick(e, seg.seriesIndex)}
            />
            {seg.height >= 14 && element.chartConfig.showTotalLabels && (
              <text
                x={seg.x + seg.width / 2}
                y={seg.y + seg.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textFill}
                fontSize={10}
                fontWeight={500}
              >
                {seg.label}
              </text>
            )}
          </g>
        );
      })}
      {layout.categoryLabels.map((label, idx) => (
        <text
          key={idx}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          fill="var(--theme-dk2)"
          fontSize={LABEL_FONT_SIZE}
        >
          {label.text}
        </text>
      ))}
    </svg>
    {bubbleMenu && (
      <BubbleMenu
        x={bubbleMenu.x}
        y={bubbleMenu.y}
        onClose={() => setBubbleMenu(null)}
        onColorSelect={handleColorSelect}
      />
    )}
  </>
  );
}
