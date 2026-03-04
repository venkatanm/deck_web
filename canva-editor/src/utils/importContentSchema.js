import { v4 as uuidv4 } from "uuid";
import { CHART_DEFAULTS } from "./defaults";

// ── Element builder helpers ──────────────────

function mkRect(x, y, w, h, fill, extra = {}) {
  return {
    id: uuidv4(),
    type: "rect",
    x,
    y,
    width: w,
    height: h,
    fill,
    rotation: 0,
    opacity: 1,
    cornerRadius: extra.cornerRadius || 0,
    ...extra,
  };
}

function mkText(x, y, w, content, fontSize, fill, extra = {}) {
  return {
    id: uuidv4(),
    type: "text",
    x,
    y,
    width: w,
    height: fontSize * (extra.lineHeight || 1.4),
    text: content,
    fontSize,
    fill,
    fontFamily: extra.fontFamily || "Inter",
    fontStyle: extra.bold ? "bold" : "normal",
    align: extra.align || "left",
    lineHeight: extra.lineHeight || 1.3,
    letterSpacing: extra.letterSpacing || 0,
    rotation: 0,
    opacity: 1,
    ...extra,
  };
}

function mkLine(x, y, w, stroke, extra = {}) {
  return {
    id: uuidv4(),
    type: "line",
    x,
    y,
    width: w,
    height: 0,
    stroke,
    strokeWidth: extra.strokeWidth || 2,
    rotation: 0,
    opacity: 1,
    ...extra,
  };
}

function mkKPI(x, y, w, h, stat, accentColor) {
  return {
    id: uuidv4(),
    type: "statBlock",
    subtype: "kpi",
    x,
    y,
    width: w,
    height: h,
    rotation: 0,
    opacity: 1,
    value: stat.value || "—",
    label: stat.label || "",
    trend: stat.trend || "",
    trendDir: stat.trendDir || "up",
    trendLabel: stat.trendLabel || "",
    accentColor,
    bgColor: "#f8fafc",
    textColor: "#1e293b",
    style: "card",
  };
}

function mkChart(x, y, w, h, content, primary) {
  // Normalize pipeline chart types to Recharts names
  const CHART_TYPE_MAP = {
    column: "bar",
    stacked_column: "bar",
    stacked_bar: "bar",
    bar_stacked: "bar",
    doughnut: "pie",
    line_markers: "line",
    radar_markers: "radar",
    horizontal_stacked_bar: "bar",
  };
  const rawType = content.chartType || "bar";
  const chartType = CHART_TYPE_MAP[rawType] || rawType;

  const base =
    CHART_DEFAULTS?.[chartType] || CHART_DEFAULTS?.bar || {};
  return {
    id: uuidv4(),
    ...base,
    type: "chart",
    chartType,
    variant: content.variant || "grouped",
    x,
    y,
    width: w,
    height: h,
    rotation: 0,
    opacity: 1,
    data: content.data || [],
    series: (content.series || []).map((s, i) => ({
      ...s,
      color:
        i === 0 ? primary : i === 1 ? "#06b6d4" : i === 2 ? "#10b981" : "#f59e0b",
    })),
    title: content.chartTitle || "",
    showLegend: true,
    showGrid: true,
    colorScheme: "purple",
  };
}

function mkTimeline(x, y, w, h, content, primary) {
  return {
    id: uuidv4(),
    type: "timeline",
    subtype: content.direction === "vertical" ? "vertical" : "horizontal",
    x,
    y,
    width: w,
    height: h,
    rotation: 0,
    opacity: 1,
    accentColor: primary,
    bgColor: "transparent",
    lineColor: "#e2e8f0",
    style: "dots",
    items: (content.items || []).map((item) => ({
      label: item.label || "",
      sublabel: item.sublabel || "",
      description: item.description || "",
      done: item.done || false,
    })),
  };
}

// ── Slide builders by type ───────────────────

function buildCover(content, W, H, primary, bg, font) {
  const isDark = bg === "#0f172a" || bg === "#1e293b";
  const textColor = isDark ? "#ffffff" : "#0f172a";
  return [
    mkRect(0, 0, W, H, bg),
    mkRect(0, 0, 6, H, primary),
    mkRect(0, H - 100, W, 100, primary, { opacity: 0.12 }),
    mkText(
      60,
      150,
      W - 120,
      content.title || "Title",
      Math.min(72, W * 0.075),
      textColor,
      { bold: true, fontFamily: font }
    ),
    content.subtitle &&
      mkText(
        60,
        260,
        W * 0.65,
        content.subtitle,
        22,
        isDark ? "#94a3b8" : "#64748b",
        { fontFamily: font }
      ),
    content.date &&
      mkText(60, H - 55, 400, content.date, 13, isDark ? "#64748b" : "#94a3b8", {
        fontFamily: font,
      }),
    mkRect(60, 320, 120, 4, primary),
  ].filter(Boolean);
}

function buildStatGrid(content, W, H, primary, bg, font) {
  const stats = content.stats || [];
  const n = Math.max(1, Math.min(4, stats.length));
  const pad = 40;
  const gap = 16;
  const colW = Math.floor((W - pad * 2 - gap * (n - 1)) / n);

  return [
    mkRect(0, 0, W, H, bg || "#ffffff"),
    mkRect(0, 0, W, 5, primary),
    mkText(pad, 24, W - pad * 2, content.headline || "", 30, "#1e293b", {
      bold: true,
      fontFamily: font,
    }),
    mkLine(pad, 74, W - pad * 2, "#e2e8f0", { strokeWidth: 1 }),
    ...stats.slice(0, n).map((stat, i) =>
      mkKPI(pad + i * (colW + gap), 90, colW, 160, stat, primary)
    ),
  ];
}

function buildChart(content, W, H, primary, bg, font) {
  return [
    mkRect(0, 0, W, H, bg || "#ffffff"),
    mkRect(0, 0, W, 5, primary),
    mkText(40, 22, W - 80, content.headline || "", 28, "#1e293b", {
      bold: true,
      fontFamily: font,
    }),
    mkLine(40, 68, W - 80, "#e2e8f0", { strokeWidth: 1 }),
    mkChart(40, 80, W - 80, H - 110, content, primary),
  ];
}

function buildBullets(content, W, H, primary, bg, font) {
  const points = content.points || [];
  const bodyClr = "#374151";
  return [
    mkRect(0, 0, W, H, bg || "#ffffff"),
    mkRect(0, 0, W, 5, primary),
    mkText(60, 28, W - 120, content.headline || "", 32, "#1e293b", {
      bold: true,
      fontFamily: font,
    }),
    mkLine(60, 78, W - 120, "#e2e8f0", { strokeWidth: 1 }),
    ...points.slice(0, 6).map((pt, i) =>
      mkText(80, 100 + i * 60, W - 160, `• ${pt}`, 17, bodyClr, {
        fontFamily: font,
        lineHeight: 1.5,
      })
    ),
  ];
}

function buildTimeline(content, W, H, primary, bg, font) {
  return [
    mkRect(0, 0, W, H, bg || "#ffffff"),
    mkRect(0, 0, W, 5, primary),
    mkText(40, 22, W - 80, content.headline || "", 28, "#1e293b", {
      bold: true,
      fontFamily: font,
    }),
    mkTimeline(20, 100, W - 40, H - 130, content, primary),
  ];
}

function buildSectionDivider(content, W, H, primary, bg, font) {
  return [
    mkRect(0, 0, W, H, primary),
    mkText(
      60,
      H / 2 - 60,
      W - 120,
      content.title || "",
      Math.min(60, W * 0.065),
      "#ffffff",
      { bold: true, fontFamily: font, align: "center" }
    ),
    content.subtitle &&
      mkText(
        60,
        H / 2 + 30,
        W - 120,
        content.subtitle,
        20,
        "rgba(255,255,255,0.7)",
        { fontFamily: font, align: "center" }
      ),
  ].filter(Boolean);
}

function buildComparison(content, W, H, primary, bg, font) {
  const L = content.left || {};
  const R = content.right || {};
  return [
    mkRect(0, 0, W, H, bg || "#ffffff"),
    mkRect(0, 0, W, 5, primary),
    mkText(40, 22, W - 80, content.headline || "", 28, "#1e293b", {
      bold: true,
      fontFamily: font,
    }),
    {
      id: uuidv4(),
      type: "statBlock",
      subtype: "comparison",
      x: 60,
      y: 90,
      width: W - 120,
      height: 150,
      rotation: 0,
      opacity: 1,
      leftValue: L.value || "",
      leftLabel: L.label || "",
      rightValue: R.value || "",
      rightLabel: R.label || "",
      vsLabel: "vs",
      accentColor: primary,
      bgColor: "#ffffff",
      textColor: "#1e293b",
      style: "card",
    },
    L.description &&
      mkText(
        60,
        270,
        (W - 120) / 2 - 20,
        L.description,
        14,
        "#64748b",
        { fontFamily: font }
      ),
    R.description &&
      mkText(
        W / 2 + 20,
        270,
        (W - 120) / 2 - 20,
        R.description,
        14,
        "#64748b",
        { fontFamily: font }
      ),
  ].filter(Boolean);
}

function buildQuote(content, W, H, primary, bg, font) {
  return [
    mkRect(0, 0, W, H, bg || "#f8fafc"),
    mkRect(0, 0, 8, H, primary),
    mkRect(W - 8, 0, 8, H, primary, { opacity: 0.3 }),
    mkText(
      80,
      H / 2 - 80,
      W - 160,
      `"${content.quote || ""}"`,
      Math.min(30, W * 0.032),
      "#1e293b",
      {
        fontFamily: "Playfair Display",
        fontStyle: "italic",
        align: "center",
        lineHeight: 1.6,
      }
    ),
    mkText(
      80,
      H / 2 + 70,
      W - 160,
      `— ${content.attribution || ""}`,
      15,
      "#94a3b8",
      { fontFamily: font, align: "center" }
    ),
  ];
}

function buildFullBleedText(content, W, H, primary, bg, font) {
  return [
    mkRect(0, 0, W, H, bg || "#0f172a"),
    mkText(
      60,
      H / 2 - 60,
      W - 120,
      content.text || "",
      Math.min(64, W * 0.068),
      "#ffffff",
      {
        bold: true,
        fontFamily: font,
        align: "center",
        lineHeight: 1.2,
      }
    ),
    content.subtext &&
      mkText(
        60,
        H / 2 + 50,
        W - 120,
        content.subtext,
        20,
        "rgba(255,255,255,0.6)",
        { fontFamily: font, align: "center" }
      ),
    mkRect(W / 2 - 60, H / 2 + 100, 120, 4, primary),
  ].filter(Boolean);
}

function buildFlowchart(content, W, H, primary, bg, font) {
  const steps = content.steps || [];
  const n = Math.max(1, steps.length);
  const boxW = Math.min(160, (W - 80) / n - 20);
  const boxH = 72;
  const startX = (W - (n * boxW + (n - 1) * 40)) / 2;
  const centerY = (H - boxH) / 2 + 20 + boxH / 2;

  const flowElements = steps.map((step, i) => ({
    id: uuidv4(),
    type: "flowchart",
    subtype: i === 0 || i === n - 1 ? "terminal" : "process",
    x: startX + i * (boxW + 40),
    y: (H - boxH) / 2 + 20,
    width: boxW,
    height: boxH,
    fill: i === 0 ? primary + "22" : "#f8fafc",
    stroke: primary,
    strokeWidth: 2,
    text: typeof step === "object" ? step.label || step : step,
    fontSize: 12,
    textColor: "#1e293b",
    fontFamily: font,
    rotation: 0,
    opacity: 1,
  }));

  const connectors = steps.slice(0, -1).map((_, i) => {
    const leftCenterX = startX + i * (boxW + 40) + boxW;
    const rightCenterX = startX + (i + 1) * (boxW + 40);
    return {
      id: uuidv4(),
      type: "connector",
      fromId: flowElements[i].id,
      toId: flowElements[i + 1].id,
      routing: "straight",
      stroke: primary,
      strokeWidth: 2,
      arrowEnd: true,
      arrowStart: false,
      label: "",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      rotation: 0,
      opacity: 1,
      staticPoints: [leftCenterX, centerY, rightCenterX, centerY],
    };
  });

  return [
    mkRect(0, 0, W, H, bg || "#ffffff"),
    mkRect(0, 0, W, 5, primary),
    mkText(40, 22, W - 80, content.headline || "Process", 28, "#1e293b", {
      bold: true,
      fontFamily: font,
    }),
    ...flowElements,
    ...connectors,
  ];
}

function buildTeam(content, W, H, primary, bg, font) {
  const members = content.members || [];
  const n = Math.max(1, Math.min(4, members.length));
  const cardW = Math.floor((W - 80 - (n - 1) * 20) / n);

  const elements = [
    mkRect(0, 0, W, H, bg || "#ffffff"),
    mkRect(0, 0, W, 5, primary),
    mkText(40, 22, W - 80, content.headline || "The Team", 28, "#1e293b", {
      bold: true,
      fontFamily: font,
    }),
  ];

  members.slice(0, n).forEach((m, i) => {
    const x = 40 + i * (cardW + 20);
    elements.push(
      mkRect(x, 90, cardW, 200, "#f8fafc", { cornerRadius: 12 }),
      mkRect(x, 90, cardW, 4, primary, { cornerRadius: 2 }),
      {
        id: uuidv4(),
        type: "circle",
        x: x + cardW / 2 - 30,
        y: 104,
        width: 60,
        height: 60,
        fill: primary + "22",
        stroke: primary,
        strokeWidth: 2,
        rotation: 0,
        opacity: 1,
      },
      mkText(x, 178, cardW, m.name || "", 15, "#1e293b", {
        bold: true,
        fontFamily: font,
        align: "center",
      }),
      mkText(x, 200, cardW, m.title || "", 12, primary, {
        fontFamily: font,
        align: "center",
      })
    );
    if (m.bio) {
      elements.push(
        mkText(x + 8, 222, cardW - 16, m.bio, 11, "#94a3b8", {
          fontFamily: font,
          align: "center",
        })
      );
    }
  });

  return elements;
}

// ── Single-slide builder (for streaming) ──────

/**
 * Builds elements for a single slide. Used by the pipeline stream.
 * @param {Object} slide - { slideType, content, title? }
 * @param {Object} brandKit - Brand kit from store
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object[]} Elements array
 */
export function buildSlideElements(slide, brandKit, width, height) {
  const W = width || 960;
  const H = height || 540;
  const primary = brandKit?.colors?.[0]?.hex || "#7c3aed";
  const bgColor =
    brandKit?.colors?.find(
      (c) =>
        c.name?.toLowerCase().includes("background") ||
        c.name?.toLowerCase().includes("bg")
    )?.hex || null;
  const headingFont = brandKit?.fonts?.[0]?.family || "Inter";
  const bg = bgColor || "#ffffff";

  const content = slide.content || slide;
  let elements = [];

  switch (slide.slideType) {
    case "cover":
      elements = buildCover(content, W, H, primary, bg, headingFont);
      break;
    case "stat-grid":
      elements = buildStatGrid(content, W, H, primary, "#ffffff", headingFont);
      break;
    case "chart":
      elements = buildChart(content, W, H, primary, "#ffffff", headingFont);
      break;
    case "bullets":
      elements = buildBullets(content, W, H, primary, "#ffffff", headingFont);
      break;
    case "timeline":
      elements = buildTimeline(content, W, H, primary, "#ffffff", headingFont);
      break;
    case "section-divider":
      elements = buildSectionDivider(content, W, H, primary, bg, headingFont);
      break;
    case "comparison":
      elements = buildComparison(content, W, H, primary, "#ffffff", headingFont);
      break;
    case "quote":
      elements = buildQuote(content, W, H, primary, "#f8fafc", headingFont);
      break;
    case "full-bleed-text":
      elements = buildFullBleedText(content, W, H, primary, bg, headingFont);
      break;
    case "flowchart":
      elements = buildFlowchart(content, W, H, primary, "#ffffff", headingFont);
      break;
    case "team":
      elements = buildTeam(content, W, H, primary, "#ffffff", headingFont);
      break;
    default:
      elements = buildBullets(content, W, H, primary, "#ffffff", headingFont);
  }

  return elements.filter(Boolean);
}

// ── Main export function ─────────────────────

export function importContentSchema(schema, brandKit, canvasSize) {
  const W = canvasSize?.width || 960;
  const H = canvasSize?.height || 540;

  // Resolve brand kit values
  const primary =
    brandKit?.colors?.[0]?.hex || "#7c3aed";
  const bgColor =
    brandKit?.colors?.find(
      (c) =>
        c.name?.toLowerCase().includes("background") ||
        c.name?.toLowerCase().includes("bg")
    )?.hex || null;
  const headingFont = brandKit?.fonts?.[0]?.family || "Inter";

  // Default backgrounds per template style
  const templateBg = {
    "pitch-deck-dark": "#0f172a",
    "corporate-report": "#ffffff",
    "tech-product": "#0f172a",
    consulting: "#ffffff",
    "minimalist-light": "#ffffff",
    educational: "#f0fdf4",
    "marketing-campaign": "#fffbeb",
  };
  const bg =
    bgColor ||
    templateBg[schema.meta?.suggestedTemplate] ||
    "#ffffff";

  const pages = schema.slides.map((slide, i) => {
    let elements = [];

    switch (slide.slideType) {
      case "cover":
        elements = buildCover(slide.content, W, H, primary, bg, headingFont);
        break;
      case "stat-grid":
        elements = buildStatGrid(slide.content, W, H, primary, "#ffffff", headingFont);
        break;
      case "chart":
        elements = buildChart(slide.content, W, H, primary, "#ffffff", headingFont);
        break;
      case "bullets":
        elements = buildBullets(slide.content, W, H, primary, "#ffffff", headingFont);
        break;
      case "timeline":
        elements = buildTimeline(slide.content, W, H, primary, "#ffffff", headingFont);
        break;
      case "section-divider":
        elements = buildSectionDivider(slide.content, W, H, primary, bg, headingFont);
        break;
      case "comparison":
        elements = buildComparison(slide.content, W, H, primary, "#ffffff", headingFont);
        break;
      case "quote":
        elements = buildQuote(slide.content, W, H, primary, "#f8fafc", headingFont);
        break;
      case "full-bleed-text":
        elements = buildFullBleedText(slide.content, W, H, primary, bg, headingFont);
        break;
      case "flowchart":
        elements = buildFlowchart(slide.content, W, H, primary, "#ffffff", headingFont);
        break;
      case "team":
        elements = buildTeam(slide.content, W, H, primary, "#ffffff", headingFont);
        break;
      default:
        elements = buildBullets(slide.content, W, H, primary, "#ffffff", headingFont);
    }

    return {
      id: uuidv4(),
      name: slide.title || `Slide ${i + 1}`,
      elements: elements.filter(Boolean),
      backgroundColor:
        slide.slideType === "cover" ||
        slide.slideType === "section-divider" ||
        slide.slideType === "full-bleed-text"
          ? bg
          : "#ffffff",
    };
  });

  return { pages };
}

// Applies brand kit colors and fonts to imported pages.
// Called after importContentSchema if brand kit is set.
export function applyBrandKitToPages(pages, brandKit, canvasSize) {
  if (!brandKit) return pages;

  const W = canvasSize?.width || 960;
  const primary =
    brandKit.colors?.[0]?.hex;
  const bg =
    brandKit.colors?.find(
      (c) =>
        c.name?.toLowerCase().includes("bg") ||
        c.name?.toLowerCase().includes("background")
    )?.hex;
  const headingFont = brandKit.fonts?.[0]?.family;
  const bodyFont =
    brandKit.fonts?.[1]?.family || brandKit.fonts?.[0]?.family;

  return pages.map((page) => ({
    ...page,
    elements: page.elements.map((el) => {
      // Text: apply brand fonts
      if (el.type === "text") {
        const isHeading = (el.fontSize || 16) >= 28;
        return {
          ...el,
          fontFamily: isHeading
            ? headingFont || el.fontFamily
            : bodyFont || el.fontFamily,
        };
      }
      // KPI stat blocks: apply brand accent
      if (el.type === "statBlock" && primary) {
        return { ...el, accentColor: primary };
      }
      // Timeline: apply brand accent
      if (el.type === "timeline" && primary) {
        return { ...el, accentColor: primary };
      }
      // Flowchart shapes: apply brand colors
      if (el.type === "flowchart" && primary) {
        return {
          ...el,
          stroke: primary,
          fill: primary + "18",
          textColor: "#1e293b",
        };
      }
      // Charts: update series colors
      if (el.type === "chart" && primary) {
        return {
          ...el,
          series: (el.series || []).map((s, i) => ({
            ...s,
            color:
              i === 0
                ? primary
                : i === 1
                  ? brandKit.colors?.[1]?.hex || "#06b6d4"
                  : brandKit.colors?.[2]?.hex || "#10b981",
          })),
        };
      }
      // Rects: large background rects
      if (el.type === "rect" && bg) {
        if (
          el.x <= 10 &&
          el.y <= 10 &&
          el.width >= W * 0.9
        ) {
          // It's a background rect on a light slide
          // Only recolor if it was white
          if (el.fill === "#ffffff" || el.fill === "#f8fafc") {
            return { ...el, fill: bg };
          }
        }
      }
      // Accent rects and lines
      if ((el.type === "rect" || el.type === "line") && primary) {
        // Small decorative rects (accent bars)
        if (el.type === "rect" && el.height <= 8) {
          return { ...el, fill: primary };
        }
        if (el.type === "rect" && el.width <= 8) {
          return { ...el, fill: primary };
        }
        if (el.type === "line") {
          return { ...el, stroke: primary };
        }
      }
      return el;
    }),
  }));
}
