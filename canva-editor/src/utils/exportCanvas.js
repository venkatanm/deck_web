import Konva from "konva";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import pptxgen from "pptxgenjs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import * as Icons from "lucide-react";
import { CHART_COLOR_SCHEMES } from "./defaults";
import useEditorStore from "../store/useEditorStore";
import StatBlockElement from "../components/StatBlockElement";
import TimelineElement from "../components/TimelineElement";
import TableElement from "../components/TableElement";
import GraphicElement from "../components/GraphicElement";

const HEART_PATH = "M28 46 C28 46 8 34 8 20 C8 13 13 8 20 8 C24 8 28 12 28 12 C28 12 32 8 36 8 C43 8 48 13 48 20 C48 34 28 46 28 46Z";
const DIAMOND_PATH = "M28,4 L52,28 L28,52 L4,28 Z";

// Render a React element offscreen via html2canvas and return an HTMLImageElement
async function reactElementToImage(reactEl, width, height) {
  const div = document.createElement("div");
  div.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:${height}px;overflow:hidden;`;
  document.body.appendChild(div);
  const root = createRoot(div);
  root.render(reactEl);
  await new Promise((r) => setTimeout(r, 200));
  let img = null;
  try {
    const canvas = await html2canvas(div.firstChild || div, {
      scale: 1,
      backgroundColor: null,
      useCORS: true,
    });
    img = new window.Image();
    img.src = canvas.toDataURL("image/png");
    await new Promise((r) => { img.onload = r; img.onerror = r; });
  } catch (e) {
    console.warn("reactElementToImage error", e);
  }
  root.unmount();
  document.body.removeChild(div);
  return img;
}

const COMPLEX_TYPES = new Set(["statBlock", "chart", "table", "timeline", "callout", "frame", "flowchart", "graphic", "connector"]);

export async function pageToDataURL(page, canvasSize, scale = 1, mimeType = "image/png") {
  const container = document.createElement("div");
  container.style.display = "none";
  document.body.appendChild(container);

  const stage = new Konva.Stage({
    container,
    width: canvasSize.width * scale,
    height: canvasSize.height * scale,
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  const bg = new Konva.Rect({
    width: canvasSize.width * scale,
    height: canvasSize.height * scale,
    fill: canvasSize.backgroundColor || "#ffffff",
  });
  layer.add(bg);

  // Pre-load regular images
  const imageElements = (page.elements || []).flatMap((el) =>
    el.type === "group"
      ? (el.children || []).filter((c) => c.type === "image")
      : el.type === "image"
        ? [el]
        : []
  );
  const loadedImages = await Promise.all(imageElements.map((el) =>
    new Promise((res) => {
      const img = new window.Image();
      img.onload = () => res({ id: el.id, img });
      img.onerror = () => res({ id: el.id, img: null });
      img.src = el.src || "";
    })
  ));
  const imageMap = Object.fromEntries(loadedImages.map((i) => [i.id, i.img]));

  // Pre-render complex React elements to images
  const complexMap = {};
  for (const el of (page.elements || [])) {
    if (!COMPLEX_TYPES.has(el.type)) continue;
    let reactEl = null;
    if (el.type === "statBlock") reactEl = React.createElement(StatBlockElement, { el: { ...el, x: 0, y: 0 }, zoom: 1 });
    else if (el.type === "timeline") reactEl = React.createElement(TimelineElement, { el: { ...el, x: 0, y: 0 }, zoom: 1 });
    else if (el.type === "table") reactEl = React.createElement(TableElement, { el: { ...el, x: 0, y: 0 }, zoom: 1 });
    else if (el.type === "graphic") reactEl = React.createElement(GraphicElement, { el: { ...el, x: 0, y: 0 }, zoom: 1 });
    if (reactEl) {
      const img = await reactElementToImage(reactEl, el.width, el.height);
      if (img) complexMap[el.id] = img;
    }
  }

  return new Promise((resolve) => {

      (page.elements || []).forEach((el) => {
        let node;
        const common = {
          x: el.x * scale,
          y: el.y * scale,
          rotation: el.rotation || 0,
          opacity: el.opacity ?? 1,
          scaleX: el.scaleX || 1,
          scaleY: el.scaleY || 1,
        };

        switch (el.type) {
          case "rect": {
            const isGradient =
              Array.isArray(el.fillLinearGradientColorStops) &&
              el.fillLinearGradientColorStops.length > 0;

            const rectProps = {
              ...common,
              width: el.width * scale,
              height: el.height * scale,
              stroke: el.stroke || "",
              strokeWidth: (el.strokeWidth || 0) * scale,
              cornerRadius: (el.cornerRadius || 0) * scale,
            };

            if (isGradient) {
              const startPt = el.fillLinearGradientStartPoint || { x: 0, y: 0 };
              const endPt = el.fillLinearGradientEndPoint || { x: el.width, y: el.height };

              rectProps.fillLinearGradientStartPoint = {
                x: startPt.x * scale,
                y: startPt.y * scale,
              };
              rectProps.fillLinearGradientEndPoint = {
                x: endPt.x * scale,
                y: endPt.y * scale,
              };
              rectProps.fillLinearGradientColorStops = el.fillLinearGradientColorStops;
            } else {
              rectProps.fill = el.fill || "#cccccc";
            }

            node = new Konva.Rect(rectProps);
            break;
          }
          case "circle":
            node = new Konva.Ellipse({
              ...common,
              x: (el.x + el.width / 2) * scale,
              y: (el.y + el.height / 2) * scale,
              radiusX: (el.width / 2) * scale,
              radiusY: (el.height / 2) * scale,
              fill: el.fill,
              stroke: el.stroke,
              strokeWidth: (el.strokeWidth || 0) * scale,
            });
            break;
          case "text":
            node = new Konva.Text({
              ...common,
              width: el.width * scale,
              text: el.text || "",
              fontSize: (el.fontSize || 24) * scale,
              fontFamily: el.fontFamily || "Inter",
              fontStyle: el.fontStyle || "normal",
              fill: el.fill || "#1e293b",
              align: el.align || "left",
              lineHeight: el.lineHeight || 1.2,
              letterSpacing: el.letterSpacing || 0,
              textDecoration: el.textDecoration || "",
            });
            break;
          case "image": {
            const img = imageMap[el.id];
            if (img) {
              node = new Konva.Image({
                ...common,
                image: img,
                width: el.width * scale,
                height: el.height * scale,
              });
            }
            break;
          }
          case "triangle":
          case "pentagon":
            node = new Konva.RegularPolygon({
              ...common,
              x: (el.x + el.width / 2) * scale,
              y: (el.y + el.height / 2) * scale,
              sides: el.type === "triangle" ? 3 : 5,
              radius: (el.width / 2) * scale,
              fill: el.fill,
              stroke: el.stroke,
              strokeWidth: (el.strokeWidth || 0) * scale,
            });
            break;
          case "star":
            node = new Konva.Star({
              ...common,
              x: (el.x + el.width / 2) * scale,
              y: (el.y + el.height / 2) * scale,
              numPoints: 5,
              innerRadius: el.width * 0.22 * scale,
              outerRadius: el.width * 0.5 * scale,
              fill: el.fill,
              stroke: el.stroke,
              strokeWidth: (el.strokeWidth || 0) * scale,
            });
            break;
          case "heart":
          case "diamond": {
            const pathScaleX = (el.width / 56) * scale * (el.scaleX || 1);
            const pathScaleY = (el.height / 56) * scale * (el.scaleY || 1);
            const pathData = el.type === "heart" ? HEART_PATH : DIAMOND_PATH;
            node = new Konva.Path({
              ...common,
              data: pathData,
              scaleX: pathScaleX,
              scaleY: pathScaleY,
              fill: el.fill,
              stroke: el.stroke,
              strokeWidth: (el.strokeWidth || 0) * scale,
            });
            break;
          }
          case "line":
            node = new Konva.Line({
              ...common,
              points: [0, 0, el.width * scale, 0],
              stroke: el.stroke || "#1e293b",
              strokeWidth: (el.strokeWidth || 3) * scale,
              dash: el.dash || [],
            });
            break;
          case "arrow":
            node = new Konva.Arrow({
              ...common,
              points: [0, 0, el.width * scale, 0],
              stroke: el.stroke || "#1e293b",
              strokeWidth: (el.strokeWidth || 3) * scale,
              fill: el.stroke || "#1e293b",
            });
            break;
          case "group": {
            const groupX = el.x * scale;
            const groupY = el.y * scale;
            (el.children || []).forEach((child) => {
              const childCommon = {
                x: groupX + child.x * scale,
                y: groupY + child.y * scale,
                rotation: (child.rotation || 0) + (el.rotation || 0),
                opacity: (child.opacity ?? 1) * (el.opacity ?? 1),
                scaleX: (child.scaleX || 1) * (el.scaleX || 1),
                scaleY: (child.scaleY || 1) * (el.scaleY || 1),
              };
              let childNode;
              switch (child.type) {
                case "rect":
                  childNode = new Konva.Rect({
                    ...childCommon,
                    width: (child.width || 0) * scale,
                    height: (child.height || 0) * scale,
                    fill: child.fill || "#cccccc",
                    stroke: child.stroke || "",
                    strokeWidth: (child.strokeWidth || 0) * scale,
                    cornerRadius: (child.cornerRadius || 0) * scale,
                  });
                  break;
                case "circle":
                  childNode = new Konva.Ellipse({
                    ...childCommon,
                    x: childCommon.x + ((child.width || 0) / 2) * scale,
                    y: childCommon.y + ((child.height || 0) / 2) * scale,
                    radiusX: ((child.width || 0) / 2) * scale,
                    radiusY: ((child.height || 0) / 2) * scale,
                    fill: child.fill,
                    stroke: child.stroke,
                    strokeWidth: (child.strokeWidth || 0) * scale,
                  });
                  break;
                case "text":
                  childNode = new Konva.Text({
                    ...childCommon,
                    width: (child.width || 0) * scale,
                    text: child.text || "",
                    fontSize: (child.fontSize || 24) * scale,
                    fontFamily: child.fontFamily || "Inter",
                    fontStyle: child.fontStyle || "normal",
                    fill: child.fill || "#1e293b",
                    align: child.align || "left",
                    lineHeight: child.lineHeight || 1.2,
                    letterSpacing: child.letterSpacing || 0,
                    textDecoration: child.textDecoration || "",
                  });
                  break;
                case "image": {
                  const childImg = imageMap[child.id];
                  if (childImg) {
                    childNode = new Konva.Image({
                      ...childCommon,
                      image: childImg,
                      width: (child.width || 0) * scale,
                      height: (child.height || 0) * scale,
                    });
                  }
                  break;
                }
                case "triangle":
                case "pentagon":
                  childNode = new Konva.RegularPolygon({
                    ...childCommon,
                    x: childCommon.x + ((child.width || 0) / 2) * scale,
                    y: childCommon.y + ((child.height || 0) / 2) * scale,
                    sides: child.type === "triangle" ? 3 : 5,
                    radius: ((child.width || 0) / 2) * scale,
                    fill: child.fill,
                    stroke: child.stroke,
                    strokeWidth: (child.strokeWidth || 0) * scale,
                  });
                  break;
                case "star":
                  childNode = new Konva.Star({
                    ...childCommon,
                    x: childCommon.x + ((child.width || 0) / 2) * scale,
                    y: childCommon.y + ((child.height || 0) / 2) * scale,
                    numPoints: 5,
                    innerRadius: (child.width || 0) * 0.22 * scale,
                    outerRadius: (child.width || 0) * 0.5 * scale,
                    fill: child.fill,
                    stroke: child.stroke,
                    strokeWidth: (child.strokeWidth || 0) * scale,
                  });
                  break;
                case "line":
                  childNode = new Konva.Line({
                    ...childCommon,
                    points: [0, 0, (child.width || 0) * scale, 0],
                    stroke: child.stroke || "#1e293b",
                    strokeWidth: (child.strokeWidth || 3) * scale,
                    dash: child.dash || [],
                  });
                  break;
                case "arrow":
                  childNode = new Konva.Arrow({
                    ...childCommon,
                    points: [0, 0, (child.width || 0) * scale, 0],
                    stroke: child.stroke || "#1e293b",
                    strokeWidth: (child.strokeWidth || 3) * scale,
                    fill: child.stroke || "#1e293b",
                  });
                  break;
                default:
                  break;
              }
              if (childNode) layer.add(childNode);
            });
            break;
          }
          default: {
            // Complex React-rendered element — use pre-rendered image
            const complexImg = complexMap[el.id];
            if (complexImg) {
              node = new Konva.Image({
                ...common,
                image: complexImg,
                width: el.width * scale,
                height: el.height * scale,
              });
            }
            break;
          }
        }
        if (node) layer.add(node);
      });

      layer.draw();
      const dataURL = stage.toDataURL({ mimeType, pixelRatio: 1, quality: mimeType === 'image/jpeg' ? 0.7 : 1 });
      stage.destroy();
      document.body.removeChild(container);
      resolve(dataURL);
  });
}

export async function exportPNG(pages, currentPageId, canvasSize, scale = 1, title = "design") {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;
  const dataURL = await pageToDataURL(page, canvasSize, scale, "image/png");
  saveAs(dataURL, `${title}.png`);
}

export async function exportJPG(pages, currentPageId, canvasSize, scale = 1, title = "design") {
  const page = pages.find((p) => p.id === currentPageId);
  if (!page) return;
  const dataURL = await pageToDataURL(page, canvasSize, scale, "image/jpeg");
  saveAs(dataURL, `${title}.jpg`);
}

export async function exportPDF(pages, currentPageId, canvasSize, allPages = false, title = "design") {
  const targetPages = allPages ? pages : [pages.find((p) => p.id === currentPageId)].filter(Boolean);

  const pdf = new jsPDF({
    orientation: canvasSize.width > canvasSize.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvasSize.width, canvasSize.height],
  });

  for (let i = 0; i < targetPages.length; i++) {
    if (i > 0) pdf.addPage([canvasSize.width, canvasSize.height]);
    const dataURL = await pageToDataURL(targetPages[i], canvasSize, 2, "image/jpeg");
    pdf.addImage(dataURL, "JPEG", 0, 0, canvasSize.width, canvasSize.height);
  }

  pdf.save(`${title}.pdf`);
}

// Map our color scheme name to hex array for pptx (no # prefix)
function getChartColors(el) {
  const scheme = CHART_COLOR_SCHEMES[el.colorScheme || "purple"];
  return scheme.map((c) => c.replace("#", ""));
}

// Convert canvas px coords to pptxgenjs inches
function pxToInches(px, canvasSize, axis) {
  const slideW = 10;
  const slideH = 10 * (canvasSize.height / canvasSize.width);
  return axis === "x"
    ? (px / canvasSize.width) * slideW
    : (px / canvasSize.height) * slideH;
}

export async function exportPPTX(pages, canvasSize, title = "Presentation", exportOptions = {}) {
  const pptx = new pptxgen();

  const aspectRatio = canvasSize.height / canvasSize.width;
  const slideW = 10;
  const slideH = 10 * aspectRatio;

  pptx.defineLayout({
    name: "CUSTOM",
    width: slideW,
    height: slideH,
  });
  pptx.layout = "CUSTOM";

  // Brand logo stamp (from store when stampLogo is requested)
  let primaryLogo = null;
  if (exportOptions?.stampLogo) {
    const brandKit = useEditorStore.getState().brandKit;
    primaryLogo = brandKit?.logos?.find((l) => l.type === "primary");
  }

  for (const page of pages) {
    const slide = pptx.addSlide();

    if (canvasSize.backgroundColor) {
      slide.background = { color: canvasSize.backgroundColor.replace("#", "") };
    }

    for (const el of page.elements) {
      if (el.visible === false) continue;

      const x = pxToInches(el.x, canvasSize, "x");
      const y = pxToInches(el.y, canvasSize, "y");
      const w = pxToInches(el.width, canvasSize, "x");
      const h = pxToInches(el.height, canvasSize, "y");
      const opts = { x, y, w, h, rotate: el.rotation || 0 };

      switch (el.type) {
        case "text": {
          slide.addText(el.text || "", {
            ...opts,
            fontSize: Math.round((el.fontSize || 24) * 0.75),
            bold: (el.fontStyle || "").includes("bold"),
            italic: (el.fontStyle || "").includes("italic"),
            underline: { style: el.textDecoration === "underline" ? "sng" : "none" },
            color: (el.fill || "#1e293b").replace("#", ""),
            fontFace: el.fontFamily || "Calibri",
            align: el.align || "left",
            valign: "top",
            wrap: true,
            transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
          });
          break;
        }

        case "rect": {
          const hasRadius = (el.cornerRadius || 0) > 0;
          const rectFill = el.fill && el.fill !== 'transparent'
            ? { color: el.fill.replace("#", ""), transparency: Math.round((1 - (el.opacity ?? 1)) * 100) }
            : { type: "none" };
          slide.addShape(hasRadius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
            ...opts,
            fill: rectFill,
            line: el.stroke
              ? { color: el.stroke.replace("#", ""), width: el.strokeWidth || 1 }
              : { type: "none" },
            ...(hasRadius ? { rectRadius: Math.min(0.5, (el.cornerRadius / Math.min(el.width, el.height)) * (w < h ? w : h)) } : {}),
          });
          break;
        }

        case "circle": {
          slide.addShape(pptx.ShapeType.ellipse, {
            ...opts,
            fill: {
              color: (el.fill || "#818cf8").replace("#", ""),
              transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
            },
            line: el.stroke ? { color: el.stroke.replace("#", "") } : { type: "none" },
          });
          break;
        }

        case "chart": {
          const colors = getChartColors(el);

          switch (el.chartType) {
            case "bar": {
              const isHoriz = el.variant === "horizontal";
              const isStack = el.variant === "stacked";

              const chartData = (el.series || []).map((s) => ({
                name: s.name,
                labels: (el.data || []).map((row) => row.label),
                values: (el.data || []).map((row) => row[s.key] || 0),
              }));

              slide.addChart(pptx.ChartType.bar, chartData, {
                ...opts,
                barDir: isHoriz ? "bar" : "col",
                barGrouping: isStack ? "stacked" : "clustered",
                chartColors: colors,
                showLegend: el.showLegend,
                legendPos: "b",
                showTitle: !!el.title,
                title: el.title || "",
                showValue: false,
              });
              break;
            }

            case "line": {
              const chartData = (el.series || []).map((s) => ({
                name: s.name,
                labels: (el.data || []).map((row) => row.label),
                values: (el.data || []).map((row) => row[s.key] || 0),
              }));

              slide.addChart(pptx.ChartType.line, chartData, {
                ...opts,
                chartColors: colors,
                showLegend: el.showLegend,
                legendPos: "b",
                lineDataSymbol: "circle",
                lineDataSymbolSize: 6,
                showTitle: !!el.title,
                title: el.title || "",
              });
              break;
            }

            case "area": {
              const chartData = (el.series || []).map((s) => ({
                name: s.name,
                labels: (el.data || []).map((row) => row.label),
                values: (el.data || []).map((row) => row[s.key] || 0),
              }));

              slide.addChart(pptx.ChartType.area, chartData, {
                ...opts,
                chartColors: colors,
                barGrouping: el.variant === "stacked" ? "stacked" : "standard",
                showLegend: el.showLegend,
                legendPos: "b",
                showTitle: !!el.title,
                title: el.title || "",
              });
              break;
            }

            case "pie": {
              const chartData = [
                {
                  name: el.title || "Data",
                  labels: (el.data || []).map((d) => d.label),
                  values: (el.data || []).map((d) => d.value),
                },
              ];

              slide.addChart(
                el.variant === "donut" ? pptx.ChartType.doughnut : pptx.ChartType.pie,
                chartData,
                {
                  ...opts,
                  chartColors: (el.data || []).map((d) =>
                    (d.color || colors[0]).replace("#", "")
                  ),
                  showLegend: el.showLegend,
                  legendPos: "r",
                  showTitle: !!el.title,
                  title: el.title || "",
                  holeSize: el.variant === "donut" ? 50 : undefined,
                }
              );
              break;
            }

            case "scatter": {
              const chartData = [
                {
                  name: "Data",
                  values: (el.data || []).map((d) => ({ x: d.x, y: d.y })),
                },
              ];

              slide.addChart(pptx.ChartType.scatter, chartData, {
                ...opts,
                chartColors: colors,
                showTitle: !!el.title,
                title: el.title || "",
              });
              break;
            }

            case "radar": {
              const chartData = (el.series || []).map((s) => ({
                name: s.name,
                labels: (el.data || []).map((row) => row.label),
                values: (el.data || []).map((row) => row[s.key] || 0),
              }));

              slide.addChart(pptx.ChartType.radar, chartData, {
                ...opts,
                chartColors: colors,
                showLegend: el.showLegend,
                legendPos: "b",
                showTitle: !!el.title,
                title: el.title || "",
              });
              break;
            }

            default: {
              slide.addShape(pptx.ShapeType.rect, {
                ...opts,
                fill: { color: "F3F4F6" },
                line: { color: "E5E7EB" },
              });
              slide.addText(`[${el.chartType} chart]`, {
                ...opts,
                align: "center",
                valign: "middle",
                color: "9CA3AF",
                fontSize: 11,
              });
              break;
            }
          }
          break;
        }

        case "image": {
          if (el.src) {
            try {
              slide.addImage({
                data: el.src,
                ...opts,
                transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
              });
            } catch (e) {
              console.error("PPTX image error", e);
            }
          }
          break;
        }

        case "table": {
          const cells = el.cells || [];
          const tableData = cells.map((row) =>
            row.map((cell) => ({
              text: cell.text || "",
              options: {
                bold: cell.bold,
                align: cell.align || "left",
                color: (cell.color || "#1e293b").replace("#", ""),
                fill: (cell.bg || "#ffffff").replace("#", ""),
                fontSize: el.fontSize || 12,
                border: { pt: 1, color: (el.borderColor || "#e2e8f0").replace("#", "") },
              },
            }))
          );
          if (tableData.length > 0) {
            const numCols = el.cols || tableData[0]?.length || 1;
            try {
              slide.addTable(tableData, {
                ...opts,
                colW: Array(numCols).fill(w / numCols),
                border: { pt: 1, color: (el.borderColor || "#e2e8f0").replace("#", "") },
              });
            } catch (e) {
              console.error("PPTX table error", e);
            }
          }
          break;
        }

        case "graphic": {
          const IconComp = Icons[el.iconName];
          if (IconComp) {
            try {
              const svgStr = renderToStaticMarkup(
                React.createElement(IconComp, {
                  color: el.fill || "#7c3aed",
                  width: 200,
                  height: 200,
                  strokeWidth: el.strokeWidth || 1.5,
                })
              );
              const svgUrl = `data:image/svg+xml;base64,${btoa(
                unescape(encodeURIComponent(svgStr))
              )}`;
              slide.addImage({
                data: svgUrl,
                ...opts,
                transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
              });
            } catch (e) {
              console.error("PPTX graphic error", e);
            }
          }
          break;
        }

        case "statBlock": {
          const tempDiv = document.createElement("div");
          tempDiv.style.cssText = `position:fixed;left:-9999px;top:0;width:${el.width}px;height:${el.height}px;overflow:hidden;`;
          document.body.appendChild(tempDiv);
          const root = createRoot(tempDiv);
          root.render(
            React.createElement(StatBlockElement, {
              el: { ...el, x: 0, y: 0 },
              zoom: 1,
            })
          );
          await new Promise((r) => setTimeout(r, 150));
          try {
            const canvas = await html2canvas(tempDiv.firstChild || tempDiv, {
              scale: 2,
              backgroundColor: null,
            });
            const dataUrl = canvas.toDataURL("image/png");
            slide.addImage({
              data: dataUrl,
              ...opts,
              transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
            });
          } catch (e) {
            console.error("StatBlock export error", e);
          }
          root.unmount();
          document.body.removeChild(tempDiv);
          break;
        }

        case "callout": {
          slide.addShape(pptx.ShapeType.roundRect, {
            ...opts,
            rectRadius: 0.1,
            fill: { color: (el.fill || "#7c3aed").replace("#", "") },
            line: { type: "none" },
            transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
          });
          if (el.text) {
            slide.addText(el.text, {
              ...opts,
              h: h * 0.72,
              align: "center",
              valign: "middle",
              color: (el.textColor || "#ffffff").replace("#", ""),
              fontSize: Math.round((el.fontSize || 14) * 0.75),
              fontFace: el.fontFamily || "Calibri",
              wrap: true,
              transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
            });
          }
          break;
        }

        case "frame": {
          if (el.src) {
            slide.addImage({
              data: el.src,
              ...opts,
              transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
            });
          } else {
            const pptxShape =
              el.frameShape === "circle"
                ? pptx.ShapeType.ellipse
                : pptx.ShapeType.roundRect;
            slide.addShape(pptxShape, {
              ...opts,
              fill: { color: "F1F5F9" },
              line: {
                color: (el.strokeColor || "7c3aed").replace("#", ""),
                pt: el.strokeWidth || 2,
              },
              ...(el.frameShape === "roundedRect" && el.cornerRadius
                ? { rectRadius: Math.min(0.5, (el.cornerRadius / el.height) * 2) }
                : {}),
            });
          }
          break;
        }

        case "flowchart": {
          const SHAPE_MAP = {
            process: "rect",
            decision: "diamond",
            terminal: "roundRect",
            document: "rect",
            database: "cylinder",
            parallelogram: "parallelogram",
            hexagon: "hexagon",
            cloud: "rect",
          };
          const pptxShape = pptx.ShapeType[SHAPE_MAP[el.subtype]] || pptx.ShapeType.rect;
          slide.addShape(pptxShape, {
            ...opts,
            fill: { color: (el.fill || "#ede9fe").replace("#", "") },
            line: {
              color: (el.stroke || "#7c3aed").replace("#", ""),
              pt: el.strokeWidth || 2,
            },
            ...(el.subtype === "terminal" ? { rectRadius: 0.5 } : {}),
          });
          if (el.text) {
            slide.addText(el.text, {
              ...opts,
              align: "center",
              valign: "middle",
              color: (el.textColor || "#1e293b").replace("#", ""),
              fontSize: Math.round((el.fontSize || 13) * 0.75),
              fontFace: el.fontFamily || "Calibri",
              wrap: true,
            });
          }
          break;
        }

        case "connector": {
          const pageEls = page.elements;
          const fromEl = pageEls.find((e) => e.id === el.fromId);
          const toEl = pageEls.find((e) => e.id === el.toId);
          const getAnchorPoint = (elem, anchor) => {
            const cx = elem.x + elem.width / 2;
            const cy = elem.y + elem.height / 2;
            switch (anchor) {
              case "top": return { x: cx, y: elem.y };
              case "bottom": return { x: cx, y: elem.y + elem.height };
              case "left": return { x: elem.x, y: cy };
              case "right": return { x: elem.x + elem.width, y: cy };
              default: return { x: cx, y: cy };
            }
          };
          if (fromEl && toEl) {
            const from = getAnchorPoint(fromEl, el.fromAnchor || "bottom");
            const to = getAnchorPoint(toEl, el.toAnchor || "top");
            const fx = pxToInches(from.x, canvasSize, "x");
            const fy = pxToInches(from.y, canvasSize, "y");
            const tx = pxToInches(to.x, canvasSize, "x");
            const ty = pxToInches(to.y, canvasSize, "y");
            slide.addShape(pptx.ShapeType.line, {
              x: fx,
              y: fy,
              w: tx - fx,
              h: ty - fy,
              line: {
                color: (el.stroke || "#7c3aed").replace("#", ""),
                pt: el.strokeWidth || 2,
                endArrowType: el.arrowEnd !== false ? "arrow" : "none",
                beginArrowType: el.arrowStart === true ? "arrow" : "none",
              },
            });
            if (el.label) {
              slide.addText(el.label, {
                x: (fx + tx) / 2 - 0.4,
                y: (fy + ty) / 2 - 0.1,
                w: 0.8,
                h: 0.2,
                align: "center",
                color: (el.stroke || "#7c3aed").replace("#", ""),
                fontSize: 9,
              });
            }
          }
          break;
        }

        case "timeline": {
          const tempDiv = document.createElement("div");
          tempDiv.style.cssText = `position:fixed;left:-9999px;top:0;width:${el.width}px;height:${el.height}px;overflow:hidden;`;
          document.body.appendChild(tempDiv);
          const root = createRoot(tempDiv);
          root.render(
            React.createElement(TimelineElement, {
              el: { ...el, x: 0, y: 0 },
              zoom: 1,
            })
          );
          await new Promise((r) => setTimeout(r, 150));
          try {
            const canvas = await html2canvas(tempDiv.firstChild || tempDiv, {
              scale: 2,
              backgroundColor: null,
            });
            const dataUrl = canvas.toDataURL("image/png");
            slide.addImage({
              data: dataUrl,
              ...opts,
              transparency: Math.round((1 - (el.opacity ?? 1)) * 100),
            });
          } catch (e) {
            console.error("Timeline export error", e);
          }
          root.unmount();
          document.body.removeChild(tempDiv);
          break;
        }

        default:
          break;
      }
    }

    // Brand logo stamp (bottom-right of each slide)
    if (primaryLogo?.src) {
      try {
        const logoW = 1.2;
        const logoH = 0.4;
        slide.addImage({
          data: primaryLogo.src,
          x: slideW - logoW - 0.15,
          y: slideH - logoH - 0.15,
          w: logoW,
          h: logoH,
        });
      } catch (e) {
        console.warn("Could not add brand logo to slide", e);
      }
    }
  }

  pptx.writeFile({ fileName: `${title}.pptx` });
}
