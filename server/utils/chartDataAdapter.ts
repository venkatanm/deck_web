/**
 * Chart Data Adapter - Bridges Universal Schema to PptxGenJS chart format.
 * ADR-001: Backend owns Schema → OpenXML translation.
 * Ensures Excel generation never crashes on null/empty arrays.
 */

import type { ChartData } from "../../shared/schema/PresentationSchema.ts";
import { sanitizeXmlString } from "./xmlSanitizer.ts";

/** PptxGenJS chart series format: name, labels (categories), values */
export interface PptxChartSeries {
  name: string;
  labels: string[];
  values: number[];
}

/** Default payload for testing when schema data is empty */
const DEFAULT_CHART_PAYLOAD: PptxChartSeries[] = [
  {
    name: "VeloxPrep Users",
    labels: ["Q1", "Q2", "Q3"],
    values: [150, 300, 450],
  },
];

/**
 * Transform Universal Schema ChartData to PptxGenJS chart data format.
 * - categories → labels (shared across all series)
 * - series[].name → name
 * - series[].values → values
 *
 * Fallback: If schema data is empty (null, undefined, or empty arrays),
 * injects default SaaS metrics payload to prevent Excel generation crashes.
 */
export function transformChartData(
  schemaData: ChartData | null | undefined
): PptxChartSeries[] {
  const isEmpty =
    !schemaData ||
    !schemaData.categories?.length ||
    !schemaData.series?.length;

  if (isEmpty) {
    return DEFAULT_CHART_PAYLOAD;
  }

  const labels = schemaData.categories.map((c) => sanitizeXmlString(String(c)));

  return schemaData.series.map((s) => {
    const values = (s.values ?? []).map((val) => {
      if (val == null || (typeof val === "number" && Number.isNaN(val))) {
        return 0;
      }
      const parsed = parseFloat(String(val));
      return Number.isNaN(parsed) ? 0 : parsed;
    });
    return {
      name: sanitizeXmlString(s.name),
      labels,
      values,
    };
  });
}
