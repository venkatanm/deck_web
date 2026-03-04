/**
 * Universal Schema - Architectural Fitness Function
 * ADR-001: All spatial coordinates (x, y, w, h) are percentages (0.0 to 1.0).
 * This schema is the immutable contract between frontend and backend.
 */

import { z } from "zod";

const PERCENTAGE_ERROR = "Coordinates must be percentages (0.0 to 1.0)";

/** Validates a float in the range [0.0, 1.0] for percentage-based layout */
const percentage = z
  .number()
  .min(0, { message: PERCENTAGE_ERROR })
  .max(1, { message: PERCENTAGE_ERROR });

/** Slide layout identifiers - derived from Slide Template Registry */
import { SLIDE_REGISTRY } from "../registry/SlideTemplates";
export const LAYOUT_IDS = Object.keys(SLIDE_REGISTRY) as [string, ...string[]];
export const LayoutIdSchema = z.enum(LAYOUT_IDS);

/** OpenXML placeholder roles for theme-aware export */
export const PlaceholderRoleSchema = z.enum([
  "title",
  "body",
  "body2",
  "body3",
  "subTitle",
  "footer",
]);

/** Standard PowerPoint theme color slots - maps to OpenXML clrScheme */
export const ThemeColorSlotSchema = z.enum([
  "dk1",
  "lt1",
  "dk2",
  "lt2",
  "accent1",
  "accent2",
  "accent3",
  "accent4",
  "accent5",
  "accent6",
  "hlink",
  "folHlink",
]);

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
const hexString = z.string().regex(HEX_REGEX, "Must be a valid hex code (e.g. #FF0000)");

/** Color scheme: all 12 PowerPoint theme slots with hex values */
export const ColorSchemeSchema = z.object({
  dk1: hexString,
  lt1: hexString,
  dk2: hexString,
  lt2: hexString,
  accent1: hexString,
  accent2: hexString,
  accent3: hexString,
  accent4: hexString,
  accent5: hexString,
  accent6: hexString,
  hlink: hexString,
  folHlink: hexString,
});

/** Safe system fonts for PPTX export (no embedding required) */
export const SAFE_EXPORT_FONTS = [
  "Arial",
  "Calibri",
  "Calibri Light",
  "Georgia",
  "Times New Roman",
  "Verdana",
] as const;

/** Check if a font is safe for export (standard system font) */
export function isSafeExportFont(fontName: string): boolean {
  const n = fontName.trim();
  return SAFE_EXPORT_FONTS.some((s) => s.toLowerCase() === n.toLowerCase());
}

/** Font scheme: head and body font families, with optional URLs for embedding */
export const FontSchemeSchema = z.object({
  headFont: z.string().min(1, "headFont is required"),
  bodyFont: z.string().min(1, "bodyFont is required"),
  /** Optional URL to .TTF or .OTF for head font (used by export for embedding) */
  headFontUrl: z.string().url().optional(),
  /** Optional URL to .TTF or .OTF for body font (used by export for embedding) */
  bodyFontUrl: z.string().url().optional(),
});

/** Global presentation theme - required at root level */
export const PresentationThemeSchema = z.object({
  colorScheme: ColorSchemeSchema,
  fontScheme: FontSchemeSchema,
});

/** Theme slot reference OR custom hex override when user breaks the theme */
export const ColorRefSchema = z.union([
  ThemeColorSlotSchema,
  z.object({ hex: hexString }),
]);

/** Spatial transform: x,y,w,h are percentages; z is visual stacking order (higher = on top) */
export const TransformSchema = z.object({
  x: percentage,
  y: percentage,
  w: percentage,
  h: percentage,
  z: z.number().int().optional().default(0),
});

/** Base schema for all canvas elements - requires id, type, and transform */
const CanvasElementSchemaBase = z.object({
  id: z.string(),
  transform: TransformSchema,
  /** When set, element maps to an OpenXML placeholder; otherwise it is freeform */
  placeholderRole: PlaceholderRoleSchema.optional(),
  /** When true, element cannot be moved, resized, or deleted; maps to OpenXML spLocks */
  isLocked: z.boolean().optional(),
});

/** Text element with content and typography styling */
export const TextElementSchema = CanvasElementSchemaBase.extend({
  type: z.literal("text"),
  content: z.string(),
  fontSize: z.number().positive().optional().default(12),
  /** Theme slot (e.g. dk1) or custom override { hex: "#FF0000" } */
  color: ColorRefSchema.optional().default("dk1"),
});

/** Shape element with fill and shape type */
export const ShapeElementSchema = CanvasElementSchemaBase.extend({
  type: z.literal("shape"),
  shapeType: z
    .enum(["rectangle", "circle", "ellipse", "triangle"])
    .optional()
    .default("rectangle"),
  /** Theme slot (e.g. accent1) or custom override { hex: "#CCCCCC" } */
  fillColor: ColorRefSchema.optional().default("accent1"),
});

/** Image element with src URL */
export const ImageElementSchema = CanvasElementSchemaBase.extend({
  type: z.literal("image"),
  src: z.string().url("Image src must be a valid URL"),
});

/** Icon element with raw SVG markup (colorized with theme) */
export const IconElementSchema = CanvasElementSchemaBase.extend({
  type: z.literal("icon"),
  /** Raw SVG markup, colorized using PresentationTheme */
  svgData: z.string().min(1, "svgData is required"),
  /** Theme slot or custom override for icon color */
  color: ColorRefSchema.optional().default("accent1"),
});

/** Chart type - maps to OpenXML chart variants */
export const ChartTypeSchema = z.enum([
  "STACKED_COLUMN",
  "CLUSTERED_COLUMN",
  "WATERFALL",
]);

/** Chart visual configuration */
export const ChartConfigSchema = z.object({
  chartType: ChartTypeSchema.optional().default("CLUSTERED_COLUMN"),
  showLegend: z.boolean(),
  showTotalLabels: z.boolean(),
});

/** Single data series - colorToken references theme color scheme */
export const ChartSeriesSchema = z.object({
  name: z.string(),
  colorToken: ColorRefSchema,
  values: z.array(z.number()),
});

/** Chart data payload - categories and series */
export const ChartDataSchema = z
  .object({
    categories: z.array(z.string()),
    series: z.array(ChartSeriesSchema),
  })
  .refine(
    (data) =>
      data.series.every((s) => s.values.length === data.categories.length),
    {
      message:
        "Each series values array length must match categories array length",
    }
  );

/** Chart element - data-driven; React renders from data, spreadsheet edits data */
export const ChartElementSchema = CanvasElementSchemaBase.extend({
  type: z.literal("chart"),
  chartConfig: ChartConfigSchema,
  data: ChartDataSchema,
});

/** Layout configuration for SmartContainer - frontend computes child positions from this */
export const LayoutConfigSchema = z.object({
  direction: z.enum(["row", "column"]),
  justifyContent: z.enum([
    "flex-start",
    "center",
    "space-between",
  ]),
  alignItems: z.enum(["flex-start", "center", "stretch"]),
  gap: z
    .number()
    .min(0, { message: "Gap must be non-negative (percentage of container)" }),
  padding: z
    .number()
    .min(0, { message: "Padding must be non-negative (percentage)" }),
});

/** SmartContainer: automated layout container; children have relative coords (computed by frontend) */
export const SmartContainerSchema = CanvasElementSchemaBase.extend({
  type: z.literal("smartContainer"),
  layoutConfig: LayoutConfigSchema,
  elements: z.array(z.lazy(() => CanvasElementSchema)),
});

/** Recursive: Group and SmartContainer contain CanvasElements with coords relative to bounds */
type CanvasElementRecursive =
  | z.infer<typeof TextElementSchema>
  | z.infer<typeof ShapeElementSchema>
  | z.infer<typeof ImageElementSchema>
  | z.infer<typeof IconElementSchema>
  | z.infer<typeof ChartElementSchema>
  | {
      id: string;
      type: "group";
      transform: z.infer<typeof TransformSchema>;
      elements: CanvasElementRecursive[];
      placeholderRole?: z.infer<typeof PlaceholderRoleSchema>;
    }
  | {
      id: string;
      type: "smartContainer";
      transform: z.infer<typeof TransformSchema>;
      layoutConfig: z.infer<typeof LayoutConfigSchema>;
      elements: CanvasElementRecursive[];
      placeholderRole?: z.infer<typeof PlaceholderRoleSchema>;
    };
export const CanvasElementSchema = z.lazy(() =>
  z.union([
    TextElementSchema,
    ShapeElementSchema,
    ImageElementSchema,
    IconElementSchema,
    ChartElementSchema,
    CanvasElementSchemaBase.extend({
      type: z.literal("group"),
      elements: z.array(CanvasElementSchema),
    }),
    SmartContainerSchema,
  ])
) as z.ZodType<CanvasElementRecursive>;

/** Layout requirements: derived from Slide Template Registry */
function getPlaceholderRolesFromElements(
  elements: z.infer<typeof CanvasElementSchema>[]
): z.infer<typeof PlaceholderRoleSchema>[] {
  const result: z.infer<typeof PlaceholderRoleSchema>[] = [];
  for (const el of elements) {
    if ("placeholderRole" in el && el.placeholderRole != null) {
      result.push(el.placeholderRole);
    }
    if ("elements" in el && Array.isArray(el.elements)) {
      result.push(...getPlaceholderRolesFromElements(el.elements));
    }
  }
  return result;
}

const LAYOUT_PLACEHOLDER_REQUIREMENTS: Record<string, z.infer<typeof PlaceholderRoleSchema>[]> = {};
for (const [id, template] of Object.entries(SLIDE_REGISTRY)) {
  LAYOUT_PLACEHOLDER_REQUIREMENTS[id] = getPlaceholderRolesFromElements(template.elements);
}

/** Recursively collect elements that have a placeholderRole (including nested in smartContainer/group) */
function getPlaceholderElements(
  elements: z.infer<typeof CanvasElementSchema>[]
): Array<{ placeholderRole: z.infer<typeof PlaceholderRoleSchema> }> {
  const result: Array<{ placeholderRole: z.infer<typeof PlaceholderRoleSchema> }> = [];
  for (const el of elements) {
    if ("placeholderRole" in el && el.placeholderRole != null) {
      result.push({ placeholderRole: el.placeholderRole });
    }
    if ("elements" in el && Array.isArray(el.elements)) {
      result.push(...getPlaceholderElements(el.elements));
    }
  }
  return result;
}

/** A slide has an id, layoutId, and an ordered array of canvas elements */
export const SlideSchema = z
  .object({
    id: z.string(),
    layoutId: LayoutIdSchema.default("BLANK"),
    elements: z.array(CanvasElementSchema),
  })
  .refine(
    (slide) => {
      const required = LAYOUT_PLACEHOLDER_REQUIREMENTS[slide.layoutId] ?? [];
      if (required.length === 0) return true;
      const placeholders = getPlaceholderElements(slide.elements);
      const roleCounts = new Map<z.infer<typeof PlaceholderRoleSchema>, number>();
      for (const p of placeholders) {
        roleCounts.set(p.placeholderRole, (roleCounts.get(p.placeholderRole) ?? 0) + 1);
      }
      for (const role of required) {
        if ((roleCounts.get(role) ?? 0) !== 1) return false;
      }
      return true;
    },
    (slide) => {
      const required = LAYOUT_PLACEHOLDER_REQUIREMENTS[slide.layoutId] ?? [];
      const placeholders = getPlaceholderElements(slide.elements);
      const roleCounts = new Map<z.infer<typeof PlaceholderRoleSchema>, number>();
      for (const p of placeholders) {
        roleCounts.set(p.placeholderRole, (roleCounts.get(p.placeholderRole) ?? 0) + 1);
      }
      const missing = required.filter((r) => (roleCounts.get(r) ?? 0) === 0);
      const extra = required.filter((r) => (roleCounts.get(r) ?? 0) > 1);
      const parts: string[] = [];
      if (missing.length) parts.push(`missing: ${missing.join(", ")}`);
      if (extra.length) parts.push(`duplicate: ${extra.join(", ")}`);
      return {
        message: `layoutId "${slide.layoutId}" requires exactly one of each [${required.join(", ")}]. ${parts.join("; ")}`,
      };
    }
  );

/** Default theme - Office-like neutral palette */
const DEFAULT_THEME: z.infer<typeof PresentationThemeSchema> = {
  colorScheme: {
    dk1: "#000000",
    lt1: "#FFFFFF",
    dk2: "#1F2937",
    lt2: "#F3F4F6",
    accent1: "#4361EE",
    accent2: "#3B82F6",
    accent3: "#06B6D4",
    accent4: "#10B981",
    accent5: "#F59E0B",
    accent6: "#EF4444",
    hlink: "#2563EB",
    folHlink: "#7C3AED",
  },
  fontScheme: {
    headFont: "Calibri Light",
    bodyFont: "Calibri",
  },
};

/** Root presentation: theme (required) + slides */
export const PresentationSchema = z.object({
  theme: PresentationThemeSchema.default(DEFAULT_THEME),
  slides: z.array(SlideSchema),
  /** Project/presentation title shown in header */
  title: z.string().optional(),
  /** When true, theme colors/fonts cannot be changed; enterprise brand guardrail */
  isThemeLocked: z.boolean().optional(),
});

// --- Inferred TypeScript types ---
export type ThemeColorSlot = z.infer<typeof ThemeColorSlotSchema>;
export type ColorScheme = z.infer<typeof ColorSchemeSchema>;
export type FontScheme = z.infer<typeof FontSchemeSchema>;
export type PresentationTheme = z.infer<typeof PresentationThemeSchema>;
export type ColorRef = z.infer<typeof ColorRefSchema>;
export type LayoutId = z.infer<typeof LayoutIdSchema>;
export type PlaceholderRole = z.infer<typeof PlaceholderRoleSchema>;
export type Transform = z.infer<typeof TransformSchema>;

/** Resolve ColorRef to hex string given a color scheme */
export function resolveColorRef(
  ref: ColorRef,
  colorScheme: ColorScheme
): string {
  if (typeof ref === "string") return colorScheme[ref];
  return ref.hex;
}

/** Convert ColorRef to CSS value: var(--theme-accent1) for slots, or hex for custom override */
export function colorRefToCssValue(ref: ColorRef): string {
  if (typeof ref === "string") return `var(--theme-${ref})`;
  return ref.hex;
}
export type TextElement = z.infer<typeof TextElementSchema>;
export type ShapeElement = z.infer<typeof ShapeElementSchema>;
export type ImageElement = z.infer<typeof ImageElementSchema>;
export type IconElement = z.infer<typeof IconElementSchema>;
export type ChartType = z.infer<typeof ChartTypeSchema>;
export type ChartConfig = z.infer<typeof ChartConfigSchema>;
export type ChartSeries = z.infer<typeof ChartSeriesSchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;
export type ChartElement = z.infer<typeof ChartElementSchema>;
export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;
export type SmartContainerElement = z.infer<typeof SmartContainerSchema>;
export type CanvasElement = CanvasElementRecursive;
export type GroupElement = Extract<CanvasElement, { type: "group" }>;
export type Slide = z.infer<typeof SlideSchema>;
export type Presentation = z.infer<typeof PresentationSchema>;
