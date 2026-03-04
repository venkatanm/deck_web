/**
 * Approach B Translation Engine
 * ADR-001: Backend owns Schema Percentages ↔ OpenXML EMUs/Inches.
 * The Fitness Function rejects invalid payloads before PPTX generation.
 * Flattening Pre-processor: resolves relative group coords to absolute slide percentages.
 * Theme: Defines OpenXML theme part and maps elements to scheme colors or hex overrides.
 */

import express from "express";
import JSZip from "jszip";
import PptxGenJS from "pptxgenjs";
import { ZodError } from "zod";
import {
  PresentationSchema,
  type CanvasElement,
  type ChartElement,
  type ColorRef,
  type ColorScheme,
  type Transform,
} from "../shared/schema/PresentationSchema.ts";
import { SLIDE_REGISTRY } from "../shared/registry/SlideTemplates.ts";
import { convertSvgToEmf } from "./utils/vectorConverter.ts";
import { transformChartData } from "./utils/chartDataAdapter.ts";
import { isSafeExportFont } from "../shared/schema/PresentationSchema.ts";
import { getSafeFallback } from "./utils/fontExtractor.ts";
import { injectFontsIntoZip } from "./utils/fontEmbedder.ts";
import { injectShapeLocks } from "./utils/shapeLockInjector.ts";
import { sanitizeXmlString } from "./utils/xmlSanitizer.ts";

const app = express();
app.use(express.json({ limit: "1mb" }));

const SLIDE_WIDTH_INCHES = 10;
const SLIDE_HEIGHT_INCHES = 5.625;

/** Percentage (0–1) to inches – same math as Instruction 1 for Master/canvas alignment */
function pctToInches(pct: number, isWidth: boolean): number {
  return pct * (isWidth ? SLIDE_WIDTH_INCHES : SLIDE_HEIGHT_INCHES);
}

/** Strip # from hex color for PptxGenJS (expects "RRGGBB") */
function toPptxColor(hex: string): string {
  return hex.replace(/^#/, "");
}

/**
 * Map ColorRef to PptxGenJS color value.
 * - Theme slot: pass scheme color string (tx1, bg1, accent1, etc.) for OpenXML scheme reference.
 * - Custom hex: pass raw hex for absolute <a:srgbClr>.
 */
function colorRefToPptxValue(
  ref: ColorRef,
  colorScheme: ColorScheme
): string {
  if (typeof ref === "object") return toPptxColor(ref.hex);
  const slot = ref;
  const schemeMap: Record<string, string> = {
    dk1: "tx1",
    lt1: "bg1",
    dk2: "tx2",
    lt2: "bg2",
    accent1: "accent1",
    accent2: "accent2",
    accent3: "accent3",
    accent4: "accent4",
    accent5: "accent5",
    accent6: "accent6",
  };
  if (schemeMap[slot]) return schemeMap[slot];
  return toPptxColor(colorScheme[slot]);
}

/** Resolve ColorRef to hex (no #) for chartColors - uses theme, not PowerPoint defaults */
function colorRefToHex(ref: ColorRef, colorScheme: ColorScheme): string {
  const hex = typeof ref === "object" ? ref.hex : colorScheme[ref];
  return toPptxColor(hex);
}

/** Build PptxGenJS chart opts from ChartElement schema and PresentationTheme */
function buildChartOpts(
  element: ChartElement,
  colorScheme: ColorScheme
): PptxGenJS.IChartOpts & PptxGenJS.IChartPropsChartBar {
  const { chartConfig, data } = element;
  const chartType = chartConfig.chartType ?? "CLUSTERED_COLUMN";

  const base: PptxGenJS.IChartOpts & PptxGenJS.IChartPropsChartBar = {
    barDir: "col",
    barGrouping:
      chartType === "STACKED_COLUMN"
        ? "stacked"
        : chartType === "CLUSTERED_COLUMN"
          ? "clustered"
          : "stacked",
    showLegend: chartConfig.showLegend,
    legendPos: "b",
    showTitle: false,
    catGridLine: { style: "none" },
    valGridLine: { style: "none" },
    dataBorder: { pt: 0.75, color: "FFFFFF" },
  };

  const chartColors = data.series.map((s) =>
    colorRefToHex(s.colorToken, colorScheme)
  );
  if (chartColors.length > 0) {
    base.chartColors = chartColors;
  }

  return base;
}

/** Resolve fonts for export: use safe fallback if font is not embeddable */
function resolveExportFonts(fontScheme: {
  headFont: string;
  bodyFont: string;
  headFontUrl?: string;
  bodyFontUrl?: string;
}): { headFont: string; bodyFont: string } {
  return {
    headFont: isSafeExportFont(fontScheme.headFont)
      ? fontScheme.headFont
      : getSafeFallback("headFont"),
    bodyFont: isSafeExportFont(fontScheme.bodyFont)
      ? fontScheme.bodyFont
      : getSafeFallback("bodyFont"),
  };
}

/** Build OpenXML theme XML with custom color scheme and fonts */
function buildThemeXml(colorScheme: ColorScheme, fontScheme: { headFont: string; bodyFont: string }): string {
  const slot = (name: string, hex: string) =>
    `<a:${name}><a:srgbClr val="${hex.replace(/^#/, "")}"/></a:${name}>`;
  const clrScheme = [
    slot("dk1", colorScheme.dk1),
    slot("lt1", colorScheme.lt1),
    slot("dk2", colorScheme.dk2),
    slot("lt2", colorScheme.lt2),
    slot("accent1", colorScheme.accent1),
    slot("accent2", colorScheme.accent2),
    slot("accent3", colorScheme.accent3),
    slot("accent4", colorScheme.accent4),
    slot("accent5", colorScheme.accent5),
    slot("accent6", colorScheme.accent6),
    slot("hlink", colorScheme.hlink),
    slot("folHlink", colorScheme.folHlink),
  ].join("");
  const majorFont = `<a:latin typeface="${fontScheme.headFont}"/>`;
  const minorFont = `<a:latin typeface="${fontScheme.bodyFont}"/>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Deck Theme"><a:themeElements><a:clrScheme name="Deck">${clrScheme}</a:clrScheme><a:fontScheme name="Deck"><a:majorFont>${majorFont}<a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont>${minorFont}<a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;
}

/** Resolve relative coords to absolute: abs = parent + relative * parentSize */
function resolveTransform(
  child: Transform,
  parent: { x: number; y: number; w: number; h: number }
): Transform {
  return {
    x: parent.x + child.x * parent.w,
    y: parent.y + child.y * parent.h,
    w: child.w * parent.w,
    h: child.h * parent.h,
    z: child.z ?? 0,
  };
}

const DPI = 96;

/** Detect if buffer is PNG (magic bytes) vs EMF */
function isPngBuffer(buf: Buffer): boolean {
  return buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
}

/** Flatten groups: recursively convert relative coords to absolute slide percentages */
function flattenElements(
  elements: CanvasElement[],
  parentBounds: { x: number; y: number; w: number; h: number } | null
): Array<CanvasElement & { transform: Transform }> {
  const result: Array<CanvasElement & { transform: Transform }> = [];
  for (const el of elements) {
    const t = el.transform;
    const bounds = parentBounds ?? {
      x: t.x,
      y: t.y,
      w: t.w,
      h: t.h,
    };
    const resolvedTransform = parentBounds
      ? resolveTransform(t, parentBounds)
      : t;

    if (el.type === "group") {
      const groupBounds = {
        x: resolvedTransform.x,
        y: resolvedTransform.y,
        w: resolvedTransform.w,
        h: resolvedTransform.h,
      };
      result.push(...flattenElements(el.elements, groupBounds));
    } else if (el.type === "smartContainer") {
      const containerBounds = {
        x: resolvedTransform.x,
        y: resolvedTransform.y,
        w: resolvedTransform.w,
        h: resolvedTransform.h,
      };
      result.push(...flattenElements(el.elements, containerBounds));
    } else {
      result.push({ ...el, transform: resolvedTransform });
    }
  }
  return result;
}

/** Recursively collect element IDs where isLocked === true */
function collectLockedElementIds(elements: CanvasElement[]): Set<string> {
  const ids = new Set<string>();
  for (const el of elements) {
    if ("isLocked" in el && el.isLocked === true) ids.add(el.id);
    if (el.type === "group" && "elements" in el) {
      for (const id of collectLockedElementIds(el.elements)) ids.add(id);
    }
    if (el.type === "smartContainer" && "elements" in el) {
      for (const id of collectLockedElementIds(el.elements)) ids.add(id);
    }
  }
  return ids;
}

/** Recursively collect placeholder smartContainers (body, body2) and flatten their content for icon extraction */
function collectPlaceholderContainerIcons(
  elements: CanvasElement[],
  parentBounds: { x: number; y: number; w: number; h: number } | null,
  result: Array<{ id: string; svgData: string; transform: Transform }>
): void {
  for (const el of elements) {
    const t = el.transform;
    const bounds = parentBounds ?? { x: t.x, y: t.y, w: t.w, h: t.h };
    const resolved = parentBounds
      ? {
          x: bounds.x + t.x * bounds.w,
          y: bounds.y + t.y * bounds.h,
          w: t.w * bounds.w,
          h: t.h * bounds.h,
        }
      : t;

    if (el.type === "smartContainer" && "placeholderRole" in el && ["body", "body2", "body3"].includes(el.placeholderRole)) {
      const flattened = flattenElements(el.elements, { x: resolved.x, y: resolved.y, w: resolved.w, h: resolved.h });
      for (const child of flattened) {
        if (child.type === "icon") {
          result.push({ id: child.id, svgData: child.svgData, transform: child.transform });
        }
      }
    } else if (el.type === "smartContainer" && "elements" in el) {
      collectPlaceholderContainerIcons(el.elements, { x: resolved.x, y: resolved.y, w: resolved.w, h: resolved.h }, result);
    }
  }
}

/** Collect all icon elements with resolved transforms from the presentation */
function collectIconElements(
  slides: Array<{ elements: CanvasElement[] }>
): Array<{ id: string; svgData: string; transform: Transform }> {
  const result: Array<{ id: string; svgData: string; transform: Transform }> = [];
  for (const slideData of slides) {
    collectPlaceholderContainerIcons(slideData.elements, null, result);
    const freeform = slideData.elements.filter(
      (el) => !("placeholderRole" in el) || el.placeholderRole == null
    );
    const flattened = flattenElements(freeform, null);
    for (const el of flattened) {
      if (el.type === "icon") {
        result.push({ id: el.id, svgData: el.svgData, transform: el.transform });
      }
    }
  }
  return result;
}

app.post("/api/export", async (req, res) => {
  // Fitness Function: reject invalid schema before any PPTX work
  let presentation;
  try {
    presentation = PresentationSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: "Invalid presentation schema",
        details: err.flatten(),
      });
    }
    return res.status(400).json({
      error: "Invalid presentation schema",
      details: err instanceof Error ? err.message : String(err),
    });
  }

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9"; // 10" x 5.625"

  pptx.theme = {
    headFontFace: presentation.theme.fontScheme.headFont,
    bodyFontFace: presentation.theme.fontScheme.bodyFont,
  };

  const colorScheme = presentation.theme.colorScheme;

  // Pre-convert all IconElement SVGs to EMF (or PNG fallback) before building slides
  const iconElements = collectIconElements(presentation.slides);
  const iconConversionResults = await Promise.all(
    iconElements.map((icon) =>
      convertSvgToEmf(icon.svgData, {
        width: Math.round(icon.transform.w * SLIDE_WIDTH_INCHES * DPI),
        height: Math.round(icon.transform.h * SLIDE_HEIGHT_INCHES * DPI),
      })
    )
  );
  const iconConversionMap = new Map<string, { buffer: Buffer; format: "emf" | "png" }>();
  iconElements.forEach((icon, i) => {
    const buf = iconConversionResults[i]!;
    if (buf.length === 0) {
      console.warn(`[Export] Icon conversion produced empty buffer for element "${icon.id}", skipping`);
      return;
    }
    iconConversionMap.set(icon.id, {
      buffer: buf,
      format: isPngBuffer(buf) ? "png" : "emf",
    });
  });
  const hasEmfIcons = [...iconConversionMap.values()].some((v) => v.format === "emf");

  const lockedElementIds = new Set<string>();
  for (const slide of presentation.slides) {
    for (const id of collectLockedElementIds(slide.elements)) {
      lockedElementIds.add(id);
    }
  }

  /** Recursively collect elements with placeholderRole (for master definition) */
  function collectPlaceholderElements(
    elements: CanvasElement[]
  ): Array<CanvasElement & { placeholderRole: string }> {
    const result: Array<CanvasElement & { placeholderRole: string }> = [];
    for (const el of elements) {
      if ("placeholderRole" in el && el.placeholderRole != null) {
        result.push(el as CanvasElement & { placeholderRole: string });
      }
      if ("elements" in el && Array.isArray(el.elements)) {
        result.push(...collectPlaceholderElements(el.elements));
      }
    }
    return result;
  }

  /** Define Slide Masters from registry (dynamic, no hardcoding) */
  Object.entries(SLIDE_REGISTRY).forEach(([id, template]) => {
    const placeholders = collectPlaceholderElements(template.elements);
    const objects = placeholders.map((el) => {
      const t = el.transform;
      const pptxType = el.placeholderRole === "title" ? "title" : "body";
      const defaultText =
        el.placeholderRole === "title"
          ? "Click to add title"
          : el.placeholderRole === "subTitle"
            ? "Click to add subtitle"
            : "Click to add text";
      return {
        placeholder: {
          options: {
            name: el.placeholderRole,
            type: pptxType,
            x: pctToInches(t.x, true),
            y: pctToInches(t.y, false),
            w: pctToInches(t.w, true),
            h: pctToInches(t.h, false),
          },
          text: defaultText,
        },
      };
    });
    pptx.defineSlideMaster({
      title: id,
      background: { color: "FFFFFF" },
      objects,
    });
  });

  /** Recursively collect placeholder elements (text or smartContainer with body/body2) for export */
  function* iterPlaceholderElements(
    elements: CanvasElement[]
  ): Generator<CanvasElement> {
    for (const el of elements) {
      const hasPlaceholder =
        "placeholderRole" in el && el.placeholderRole != null;
      if (hasPlaceholder && (el.type === "text" || el.type === "smartContainer")) {
        yield el;
      }
      if (el.type === "smartContainer" && "elements" in el) {
        yield* iterPlaceholderElements(el.elements);
      }
      if (el.type === "group" && "elements" in el) {
        yield* iterPlaceholderElements(el.elements);
      }
    }
  }

  const validLayoutIds = new Set(Object.keys(SLIDE_REGISTRY));
  for (const slideData of presentation.slides) {
    const masterName = validLayoutIds.has(slideData.layoutId)
      ? slideData.layoutId
      : "BLANK";
    if (!validLayoutIds.has(slideData.layoutId)) {
      console.warn(`[Export] Unknown layoutId "${slideData.layoutId}", falling back to BLANK`);
    }
    const slide = pptx.addSlide({ masterName });

    for (const element of iterPlaceholderElements(slideData.elements)) {
      const hasPlaceholder =
        "placeholderRole" in element && element.placeholderRole != null;

      if (hasPlaceholder && element.type === "text") {
        slide.addText(sanitizeXmlString(element.content), {
          placeholder: element.placeholderRole!,
          fontSize: element.fontSize ?? 12,
          color: colorRefToPptxValue(element.color ?? "dk1", colorScheme),
          objectName: element.id,
        });
        continue;
      }
      if (hasPlaceholder && element.type === "smartContainer") {
        const bodyFlattened = flattenElements(element.elements, {
          x: element.transform.x,
          y: element.transform.y,
          w: element.transform.w,
          h: element.transform.h,
        });
        for (const child of bodyFlattened) {
          const cx = child.transform.x * SLIDE_WIDTH_INCHES;
          const cy = child.transform.y * SLIDE_HEIGHT_INCHES;
          const cw = child.transform.w * SLIDE_WIDTH_INCHES;
          const ch = child.transform.h * SLIDE_HEIGHT_INCHES;
          if (child.type === "text") {
            slide.addText(sanitizeXmlString(child.content), {
              x: cx,
              y: cy,
              w: cw,
              h: ch,
              fontSize: child.fontSize ?? 12,
              color: colorRefToPptxValue(child.color ?? "dk1", colorScheme),
              objectName: child.id,
            });
          } else if (child.type === "shape") {
            const shapeType =
              child.shapeType === "circle" || child.shapeType === "ellipse"
                ? pptx.ShapeType.ellipse
                : child.shapeType === "triangle"
                  ? pptx.ShapeType.triangle
                  : pptx.ShapeType.rect;
            slide.addShape(shapeType, {
              x: cx,
              y: cy,
              w: cw,
              h: ch,
              fill: { color: colorRefToPptxValue(child.fillColor ?? "accent1", colorScheme) },
              objectName: child.id,
            });
          } else if (child.type === "image") {
            try {
              slide.addImage({ path: child.src, x: cx, y: cy, w: cw, h: ch, objectName: child.id });
            } catch (err) {
              console.warn(`[Export] Skipping image "${child.id}": download or add failed`, err);
            }
          } else if (child.type === "icon") {
            const converted = iconConversionMap.get(child.id);
            if (converted && converted.buffer.length > 0) {
              const mime = converted.format === "emf" ? "image/emf" : "image/png";
              slide.addImage({
                data: `${mime};base64,${converted.buffer.toString("base64")}`,
                x: cx,
                y: cy,
                w: cw,
                h: ch,
                objectName: child.id,
              });
            } else {
              console.warn(`[Export] Skipping icon "${child.id}": no valid buffer (EMF/PNG conversion failed or empty)`);
            }
          } else if (child.type === "chart") {
            try {
              const dataChart = transformChartData(child.data);
              const opts = buildChartOpts(child, colorScheme);
              slide.addChart(pptx.ChartType.bar, dataChart, {
                x: cx,
                y: cy,
                w: cw,
                h: ch,
                objectName: child.id,
                ...opts,
              });
            } catch (err) {
              console.error("Chart export failed:", err);
              slide.addText("Chart Generation Failed", {
                x: cx,
                y: cy,
                w: cw,
                h: ch,
                fontSize: 12,
                color: "FF0000",
                objectName: child.id,
              });
            }
          }
        }
        continue;
      }
      if (hasPlaceholder && (element.type === "shape" || element.type === "image" || element.type === "icon")) {
        slide.addText("", { placeholder: element.placeholderRole!, objectName: element.id });
        continue;
      }
    }

    const freeformTopLevel = slideData.elements.filter(
      (el) => !("placeholderRole" in el) || el.placeholderRole == null
    );
    const flattened = flattenElements(freeformTopLevel, null);
    const sortedFreeform = [...flattened].sort(
      (a, b) => (a.transform.z ?? 0) - (b.transform.z ?? 0)
    );

    for (const element of sortedFreeform) {
      const { transform } = element;
      const x = transform.x * SLIDE_WIDTH_INCHES;
      const y = transform.y * SLIDE_HEIGHT_INCHES;
      const w = transform.w * SLIDE_WIDTH_INCHES;
      const h = transform.h * SLIDE_HEIGHT_INCHES;

      if (element.type === "text") {
        slide.addText(sanitizeXmlString(element.content), {
          x,
          y,
          w,
          h,
          fontSize: element.fontSize ?? 12,
          color: colorRefToPptxValue(element.color ?? "dk1", colorScheme),
          objectName: element.id,
        });
      } else if (element.type === "shape") {
        const shapeType =
          element.shapeType === "circle" || element.shapeType === "ellipse"
            ? pptx.ShapeType.ellipse
            : element.shapeType === "triangle"
              ? pptx.ShapeType.triangle
              : pptx.ShapeType.rect;
        slide.addShape(shapeType, {
          x,
          y,
          w,
          h,
          fill: { color: colorRefToPptxValue(element.fillColor ?? "accent1", colorScheme) },
          objectName: element.id,
        });
      } else if (element.type === "image") {
        try {
          slide.addImage({
            path: element.src,
            x,
            y,
            w,
            h,
            objectName: element.id,
          });
        } catch (err) {
          console.warn(`[Export] Skipping image "${element.id}": download or add failed`, err);
        }
      } else if (element.type === "icon") {
        const converted = iconConversionMap.get(element.id);
        if (converted && converted.buffer.length > 0) {
          const mime = converted.format === "emf" ? "image/emf" : "image/png";
          slide.addImage({
            data: `${mime};base64,${converted.buffer.toString("base64")}`,
            x,
            y,
            w,
            h,
          });
        } else {
          console.warn(`[Export] Skipping icon "${element.id}": no valid buffer (EMF/PNG conversion failed or empty)`);
        }
      } else if (element.type === "chart") {
        try {
          const dataChart = transformChartData(element.data);
          const opts = buildChartOpts(element, colorScheme);
          slide.addChart(pptx.ChartType.bar, dataChart, {
            x,
            y,
            w,
            h,
            objectName: element.id,
            ...opts,
          });
        } catch (err) {
          console.error("Chart export failed:", err);
          slide.addText("Chart Generation Failed", {
            x,
            y,
            w,
            h,
            fontSize: 12,
            color: "FF0000",
            objectName: element.id,
          });
        }
      }
    }
  }

  let buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;

  const resolvedFonts = resolveExportFonts(presentation.theme.fontScheme);
  const themeXml = buildThemeXml(
    presentation.theme.colorScheme,
    resolvedFonts
  );
  const zip = await JSZip.loadAsync(buffer);
  zip.file("ppt/theme/theme1.xml", themeXml);

  // Font embedding: inject TTF/OTF when URLs are provided
  const fontsToEmbed: Array<{ typeface: string; url: string; role: "regular" }> = [];
  if (presentation.theme.fontScheme.headFontUrl) {
    fontsToEmbed.push({
      typeface: presentation.theme.fontScheme.headFont,
      url: presentation.theme.fontScheme.headFontUrl,
      role: "regular",
    });
  }
  if (presentation.theme.fontScheme.bodyFontUrl) {
    fontsToEmbed.push({
      typeface: presentation.theme.fontScheme.bodyFont,
      url: presentation.theme.fontScheme.bodyFontUrl,
      role: "regular",
    });
  }
  await injectFontsIntoZip(zip, fontsToEmbed);
  try {
    await injectShapeLocks(zip, lockedElementIds);
  } catch (err) {
    console.warn("Shape lock injection skipped (non-fatal):", err);
  }

  // Ensure EMF content type is registered when we embedded EMF icons
  if (hasEmfIcons) {
    const contentTypes = await zip.file("[Content_Types].xml")?.async("string");
    if (contentTypes && !contentTypes.includes('Extension="emf"')) {
      const emfDefault = '<Default Extension="emf" ContentType="image/x-emf"/>';
      const inserted = contentTypes.replace(
        "<Default Extension=\"gif\" ContentType=\"image/gif\"/>",
        `<Default Extension="gif" ContentType="image/gif"/>${emfDefault}`
      );
      zip.file("[Content_Types].xml", inserted);
    }
  }

  buffer = await zip.generateAsync({ type: "nodebuffer" });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  );
  res.setHeader("Content-Disposition", 'attachment; filename="export.pptx"');
  res.send(buffer);
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Export API listening on http://localhost:${PORT}`);
});
