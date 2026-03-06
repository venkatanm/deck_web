import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Upload, Plus, Trash2, Loader2 } from "lucide-react";
import { uploadImage, listImages, deleteImage } from "../api/images";
import { compressImage } from "../utils/compressImage";
import { HexColorPicker } from "react-colorful";
import { v4 as uuidv4 } from "uuid";
import useEditorStore from "../store/useEditorStore";
import { useToast } from "./Toast.jsx";
import {
  DEFAULT_ELEMENT_PROPS,
  CANVAS_PRESETS,
  FONT_PAIRS,
  GRADIENT_PRESETS,
  BACKGROUND_COLORS,
  CHART_DEFAULTS,
  STAT_BLOCK_DEFAULTS,
  TIMELINE_DEFAULTS,
  CALLOUT_DEFAULTS,
  FRAME_DEFAULTS,
  FLOWCHART_DEFAULTS,
} from "../utils/defaults";
import { STARTER_TEMPLATES } from "../utils/starterTemplates";
import { CHART_ICON_MAP, GroupedBarIcon } from "./charts/ChartIcons";
import { PRESENTATION_TEMPLATES, BLANK_TEMPLATE } from "../data/presentationTemplates";
import { FONT_COMBINATIONS } from "../data/fontCombinations";
import { LayoutTemplate, FileUp, X, Check } from "lucide-react";

// ── User template library (stored in sessionStorage for simplicity, persisted via API) ──
const USER_TEMPLATES_KEY = "user_pptx_templates";

function loadUserTemplates() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_TEMPLATES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function TemplatesPanel() {
  const [search, setSearch] = useState("");
  const [activeCategory, setCategory] = useState("All");
  const [userTemplates, setUserTemplates] = useState(loadUserTemplates);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  // Load templates from API on mount and merge with session cache
  useEffect(() => {
    import("../api/templates").then(({ listTemplates }) =>
      listTemplates()
        .then((apiTemplates) => {
          if (!Array.isArray(apiTemplates) || apiTemplates.length === 0) return;
          const normalized = apiTemplates.map((t) => ({
            ...t,
            canvasSize: t.canvasSize || t.canvas_size || { width: 1920, height: 1080 },
            thumbnail: t.thumbnail || { bg: t.thumbnail_bg || "#f1f5f9" },
          }));
          setUserTemplates(normalized);
          sessionStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(normalized));
        })
        .catch(() => {/* offline – use session cache */})
    );
  }, []);

  const categories = ["All", "Business", "Technology", "Education", "Creative", "Marketing", "My Uploads", "Global"];

  const allTemplates = [...PRESENTATION_TEMPLATES, ...userTemplates];

  const filtered = allTemplates.filter((t) => {
    if (activeCategory === "My Uploads") return userTemplates.some((ut) => ut.id === t.id);
    const matchCat = activeCategory === "All" || t.category === activeCategory || (activeCategory !== "My Uploads" && t.id === "blank");
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handlePptxUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith(".pptx")) {
      toast("Please upload a .pptx file", "error");
      return;
    }
    setUploading(true);
    try {
      const { uploadPptxTemplate } = await import("../api/templates");
      const result = await uploadPptxTemplate(file);
      const newTemplate = {
        ...result,
        category: "My Uploads",
        tags: result.tags || ["uploaded", "pptx"],
      };
      const updated = [...userTemplates, newTemplate];
      setUserTemplates(updated);
      sessionStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(updated));
      setCategory("My Uploads");
      toast(`"${result.name}" imported from PPTX!`, "success");
    } catch (e) {
      toast(e.message || "Failed to import PPTX", "error");
    } finally {
      setUploading(false);
    }
  };

  const removeUserTemplate = (id) => {
    const updated = userTemplates.filter((t) => t.id !== id);
    setUserTemplates(updated);
    sessionStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
              activeCategory === cat
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PPTX upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-xs font-medium text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50"
      >
        {uploading ? (
          <><span className="animate-spin text-purple-600">⟳</span> Importing PPTX…</>
        ) : (
          <><FileUp size={14} /> Import from PPTX</>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pptx"
        className="hidden"
        onChange={(e) => { handlePptxUpload(e.target.files?.[0]); e.target.value = ""; }}
      />

      {/* Template cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isUserTemplate={userTemplates.some((ut) => ut.id === template.id)}
            onRemove={removeUserTemplate}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <LayoutTemplate className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">No templates found</p>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template, isUserTemplate, onRemove }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const setPages = useEditorStore((s) => s.setPages);
  const setCurrentPageId = useEditorStore((s) => s.setCurrentPageId);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const toast = useToast();

  const isBlank = template.id === "blank";

  const applyTemplate = () => {
    const newPages = template.slides.map((slide, i) => ({
      id: uuidv4(),
      name: `Slide ${i + 1}`,
      backgroundColor: null,
      elements: (slide.elements || []).map((el) => ({ ...el, id: uuidv4() })),
    }));

    setPages(newPages);
    setCurrentPageId(newPages[0].id);
    setCanvasSize(template.canvasSize || { width: 1920, height: 1080, backgroundColor: "#ffffff" });
    clearSelection?.();
    toast(`"${template.name}" template loaded!`, "success");
    setShowConfirm(false);
  };

  // Blank template — show as a special compact card with no preview needed
  if (isBlank) {
    return (
      <div
        className="rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all group cursor-pointer flex items-center gap-3 px-4 py-3"
        onClick={applyTemplate}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && applyTemplate()}
      >
        <div className="w-12 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-purple-300">
          <div className="w-5 h-0.5 bg-gray-200 rounded" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800 group-hover:text-purple-700">Blank</p>
          <p className="text-[11px] text-gray-400">Start with an empty slide</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-gray-200 overflow-hidden hover:border-purple-400 transition-all group cursor-pointer"
      onClick={() => setShowConfirm(true)}
      onKeyDown={(e) => e.key === "Enter" && setShowConfirm(true)}
      role="button"
      tabIndex={0}
    >
      <div
        className="w-full h-32 relative overflow-hidden"
        style={{ background: template.thumbnail?.bg || "#f1f5f9" }}
      >
        <div
          className="absolute inset-0 scale-[0.22] origin-top-left"
          style={{
            width: template.canvasSize?.width || 1920,
            height: template.canvasSize?.height || 1080,
          }}
        >
          {(template.slides?.[0]?.elements || []).slice(0, 12).map((el, i) => (
            <MiniElement key={el.id || i} el={el} />
          ))}
        </div>
        <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">
          {template.slides?.length || 1} slides
        </div>
        {isUserTemplate && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove?.(template.id); }}
            className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove"
          >
            <X size={12} />
          </button>
        )}
        <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 bg-purple-600 text-white text-xs px-4 py-2 rounded-lg font-medium shadow-lg transition-all transform scale-95 group-hover:scale-100">
            Use Template
          </div>
        </div>
      </div>

      <div className="px-3 py-2 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-800">{template.name}</p>
          <p className="text-[11px] text-gray-400">{template.category}</p>
        </div>
        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          {template.slides?.length || 1} slides
        </span>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
          onKeyDown={(e) => e.key === "Escape" && setShowConfirm(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-2xl w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-900 mb-2">Apply Template?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will replace all your current slides with &quot;{template.name}&quot;. Your
              work will be lost unless saved.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyTemplate}
                className="flex-1 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniElement({ el }) {
  const style = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    background: el.fill || "transparent",
    opacity: el.opacity ?? 1,
    borderRadius: el.cornerRadius || 0,
    transform: `rotate(${el.rotation || 0}deg)`,
    transformOrigin: "top left",
    overflow: "hidden",
  };

  if (el.type === "text") {
    return (
      <div
        style={{
          ...style,
          background: "transparent",
          color: el.fill,
          fontSize: el.fontSize,
          fontWeight: (el.fontStyle || "").includes("bold") ? "bold" : "normal",
          fontFamily: el.fontFamily || "Inter",
          textAlign: el.align || "left",
          whiteSpace: "pre-wrap",
          lineHeight: 1.3,
        }}
      >
        {el.text}
      </div>
    );
  }

  if (el.type === "line") {
    return (
      <div
        style={{
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.strokeWidth || 2,
          background: el.stroke || "#000",
          opacity: el.opacity ?? 1,
        }}
      />
    );
  }

  if (el.fillLinearGradientColorStops) {
    const stops = el.fillLinearGradientColorStops;
    const c1 = stops[1] || "#7c3aed";
    const c2 = stops[3] || "#a78bfa";
    return (
      <div style={{ ...style, background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
    );
  }

  return <div style={style} />;
}

const SHAPE_SVGS = {
  rect: <rect x={6} y={14} width={44} height={28} rx={3} fill="#7c3aed" />,
  circle: <circle cx={28} cy={28} r={18} fill="#7c3aed" />,
  triangle: <polygon points="28,8 50,48 6,48" fill="#7c3aed" />,
  star: (
    <polygon
      points="28,6 34,20 50,20 38,30 42,46 28,36 14,46 18,30 6,20 22,20"
      fill="#7c3aed"
    />
  ),
  pentagon: <polygon points="28,6 51,22 43,48 13,48 5,22" fill="#7c3aed" />,
  heart: (
    <path
      d="M28 46 C28 46 8 34 8 20 C8 13 13 8 20 8 C24 8 28 12 28 12 C28 12 32 8 36 8 C43 8 48 13 48 20 C48 34 28 46 28 46Z"
      fill="#7c3aed"
    />
  ),
  diamond: <polygon points="28,4 52,28 28,52 4,28" fill="#7c3aed" />,
  arrow: (
    <path
      d="M8,24 L36,24 L36,16 L50,28 L36,40 L36,32 L8,32 Z"
      fill="#7c3aed"
    />
  ),
};

const SHAPES = [
  { id: "rect", label: "Rectangle", type: "rect" },
  { id: "circle", label: "Circle", type: "circle" },
  { id: "triangle", label: "Triangle", type: "triangle" },
  { id: "star", label: "Star", type: "star" },
  { id: "pentagon", label: "Pentagon", type: "pentagon" },
  { id: "heart", label: "Heart", type: "heart" },
  { id: "diamond", label: "Diamond", type: "diamond" },
  { id: "arrow", label: "Arrow", type: "arrow" },
];

const LINE_TYPES = [
  { id: "line", label: "Straight", props: { ...DEFAULT_ELEMENT_PROPS.line, dash: [] } },
  { id: "dashed", label: "Dashed", props: { ...DEFAULT_ELEMENT_PROPS.line, dash: [10, 5] } },
  { id: "dotted", label: "Dotted", props: { ...DEFAULT_ELEMENT_PROPS.line, dash: [2, 4] } },
  { id: "arrow", label: "Arrow", props: DEFAULT_ELEMENT_PROPS.arrow },
];

// ── Element catalog for search ──────────────────────────────────────────────
const STAT_ITEMS = [
  { subtype: "kpi", label: "KPI Card", icon: "$2.4M", keywords: ["kpi", "stat", "metric", "card", "number", "key"] },
  { subtype: "comparison", label: "Comparison", icon: "A vs B", keywords: ["comparison", "compare", "versus", "vs"] },
  { subtype: "progressStat", label: "Progress Bar", icon: "72%", keywords: ["progress", "bar", "percent", "gauge"] },
  { subtype: "rankedList", label: "Ranked List", icon: "#1", keywords: ["rank", "list", "leaderboard", "top"] },
  { subtype: "iconStat", label: "Icon + Stat", icon: "★", keywords: ["icon", "stat", "badge"] },
];

const FLOWCHART_ITEMS = [
  "process", "decision", "terminal", "document", "database", "parallelogram", "hexagon", "cloud",
].map((s) => ({ subtype: s, label: s.charAt(0).toUpperCase() + s.slice(1), keywords: ["flowchart", "flow", "diagram", s] }));

const FRAME_ITEMS = [
  { shape: "circle", label: "Circle Frame" },
  { shape: "roundedRect", label: "Rounded Frame" },
  { shape: "hexagon", label: "Hexagon Frame" },
  { shape: "diamond", label: "Diamond Frame" },
  { shape: "triangle", label: "Triangle Frame" },
].map((f) => ({ ...f, keywords: ["frame", "mask", f.label.toLowerCase()] }));

const TIMELINE_ITEMS = [
  { subtype: "horizontal", label: "Horizontal Timeline", icon: "—", keywords: ["timeline", "horizontal", "steps", "roadmap"] },
  { subtype: "vertical", label: "Vertical Roadmap", icon: "|", keywords: ["timeline", "vertical", "roadmap", "milestones"] },
  { subtype: "steps", label: "Numbered Steps", icon: "1→2", keywords: ["steps", "numbered", "process", "sequence"] },
];

const CALLOUT_ITEMS = ["bottom-left", "bottom-right", "top-left", "top-right", "left", "right"].map((d) => ({
  dir: d, label: d.replace("-", " "), keywords: ["callout", "bubble", "speech", "tooltip", d],
}));

const LINE_ITEMS = LINE_TYPES.map((l) => ({ ...l, keywords: ["line", "arrow", l.label.toLowerCase()] }));

const GRADIENT_ITEMS = GRADIENT_PRESETS.map((g) => ({ ...g, keywords: ["gradient", "color", g.name.toLowerCase()] }));

function matches(keywords, q) {
  return !q || keywords.some((kw) => kw.includes(q));
}

export function ElementsPanel() {
  const [search, setSearch] = useState("");
  const addElement = useEditorStore((s) => s.addElement);
  const q = search.toLowerCase().trim();

  const filteredStats = STAT_ITEMS.filter((i) => matches([i.label.toLowerCase(), ...i.keywords], q));
  const filteredFlowchart = FLOWCHART_ITEMS.filter((i) => matches([i.label.toLowerCase(), ...i.keywords], q));
  const filteredFrames = FRAME_ITEMS.filter((i) => matches([i.label.toLowerCase(), ...i.keywords], q));
  const filteredTimelines = TIMELINE_ITEMS.filter((i) => matches([i.label.toLowerCase(), ...i.keywords], q));
  const filteredCallouts = CALLOUT_ITEMS.filter((i) => matches([i.label.toLowerCase(), ...i.keywords], q));
  const filteredShapes = SHAPES.filter((s) => matches([s.label.toLowerCase(), "shape", s.type], q));
  const filteredLines = LINE_ITEMS.filter((i) => matches([i.label.toLowerCase(), ...i.keywords], q));
  const filteredGradients = GRADIENT_ITEMS.filter((i) => matches([i.name.toLowerCase(), ...i.keywords], q));

  const totalResults = filteredStats.length + filteredFlowchart.length + filteredFrames.length +
    filteredTimelines.length + filteredCallouts.length + filteredShapes.length +
    filteredLines.length + filteredGradients.length;

  const SectionHead = ({ title, count }) =>
    (!q || count > 0) ? (
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 mt-1">{title}</p>
    ) : null;

  return (
    <>
      <div className="relative px-3 py-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search elements…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
        />
      </div>

      {q && totalResults === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400 px-3">
          <Search className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-xs">No elements found for "{search}"</p>
        </div>
      )}

      <div className="px-3 py-2 flex-1 overflow-y-auto scrollbar-hide">
        {/* ─── Infographic Stats ─── */}
        {filteredStats.length > 0 && (
          <>
            <SectionHead title="Infographic Stats" count={filteredStats.length} />
            <div className="flex flex-col gap-2 mb-6">
              {filteredStats.map((preset) => (
                <button
                  key={preset.subtype}
                  type="button"
                  onClick={() => { const d = STAT_BLOCK_DEFAULTS[preset.subtype]; if (d) addElement({ ...d }); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="w-10 h-8 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-[10px] font-bold flex-shrink-0">
                    {preset.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{preset.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Flowchart ─── */}
        {filteredFlowchart.length > 0 && (
          <>
            <SectionHead title="Flowchart" count={filteredFlowchart.length} />
            <div className="grid grid-cols-4 gap-2 mb-6">
              {filteredFlowchart.map(({ subtype, label }) => (
                <button
                  key={subtype}
                  type="button"
                  onClick={() => { const d = FLOWCHART_DEFAULTS[subtype]; if (d) addElement({ ...d }); }}
                  className="w-14 h-14 rounded-lg bg-purple-100 hover:bg-purple-200 flex flex-col items-center justify-center gap-1 border border-purple-200"
                  title={label}
                >
                  <div className="w-8 h-6 rounded bg-purple-300/60 border border-purple-500" />
                  <span className="text-[9px] font-medium text-purple-700 truncate w-full text-center">{subtype}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Frames ─── */}
        {filteredFrames.length > 0 && (
          <>
            <SectionHead title="Frames" count={filteredFrames.length} />
            <div className="grid grid-cols-5 gap-2 mb-6">
              {filteredFrames.map(({ shape, label }) => (
                <button
                  key={shape}
                  type="button"
                  onClick={() => { const d = FRAME_DEFAULTS[shape]; if (d) addElement({ ...d }); }}
                  className="w-14 h-14 rounded-lg bg-purple-100 hover:bg-purple-200 flex flex-col items-center justify-center gap-1 border border-purple-200"
                  title={label}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-300/50 border-2 border-purple-500"
                    style={shape === "roundedRect" ? { borderRadius: 6 } : shape === "hexagon" || shape === "diamond" ? { transform: "rotate(45deg)", borderRadius: 2 } : shape === "triangle" ? { clipPath: "polygon(50% 0, 100% 100%, 0 100%)", borderRadius: 0 } : {}} />
                  <span className="text-[9px] font-medium text-purple-700 truncate w-full text-center">{shape}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Timelines ─── */}
        {filteredTimelines.length > 0 && (
          <>
            <SectionHead title="Timelines" count={filteredTimelines.length} />
            <div className="flex flex-col gap-2 mb-6">
              {filteredTimelines.map((preset) => (
                <button
                  key={preset.subtype}
                  type="button"
                  onClick={() => { const d = TIMELINE_DEFAULTS[preset.subtype]; if (d) addElement({ ...d }); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="w-10 h-8 bg-purple-100 rounded flex items-center justify-center text-purple-600 text-[10px] font-bold flex-shrink-0">
                    {preset.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{preset.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Callouts ─── */}
        {filteredCallouts.length > 0 && (
          <>
            <SectionHead title="Callouts" count={filteredCallouts.length} />
            <div className="grid grid-cols-3 gap-2 mb-6">
              {filteredCallouts.map(({ dir, label }) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => { const d = CALLOUT_DEFAULTS[dir]; if (d) addElement({ ...d }); }}
                  className="w-14 h-14 rounded-lg bg-purple-100 hover:bg-purple-200 flex flex-col items-center justify-center gap-1 border border-purple-200"
                  title={label}
                >
                  <div className="w-10 h-7 rounded bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold">💬</div>
                  <span className="text-[9px] font-medium text-purple-700 truncate w-full text-center">{label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Shapes ─── */}
        {filteredShapes.length > 0 && (
          <>
            <SectionHead title="Shapes" count={filteredShapes.length} />
            <div className="grid grid-cols-4 gap-2 mb-6">
              {filteredShapes.map(({ id, label, type }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => addElement({ ...DEFAULT_ELEMENT_PROPS[type] || DEFAULT_ELEMENT_PROPS.rect })}
                  className="w-14 h-14 rounded-lg bg-gray-100 hover:bg-gray-200 flex flex-col items-center justify-center gap-1"
                >
                  <svg viewBox="0 0 56 56" className="w-8 h-8">{SHAPE_SVGS[type] || SHAPE_SVGS.rect}</svg>
                  <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">{label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Lines ─── */}
        {filteredLines.length > 0 && (
          <>
            <SectionHead title="Lines" count={filteredLines.length} />
            <div className="grid grid-cols-4 gap-2 mb-6">
              {filteredLines.map(({ id, label, props }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => addElement({ ...props })}
                  className="w-14 h-14 rounded-lg bg-gray-100 hover:bg-gray-200 flex flex-col items-center justify-center gap-1"
                >
                  <svg viewBox="0 0 56 56" className="w-8 h-8">
                    {id === "arrow" ? (
                      <path d="M8,24 L36,24 L36,16 L50,28 L36,40 L36,32 L8,32 Z" fill="#7c3aed" />
                    ) : (
                      <line x1={8} y1={28} x2={48} y2={28} stroke="#7c3aed" strokeWidth={3} strokeDasharray={props.dash?.join(" ") || "none"} />
                    )}
                  </svg>
                  <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">{label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ─── Gradients ─── */}
        {filteredGradients.length > 0 && (
          <>
            <SectionHead title="Gradients" count={filteredGradients.length} />
            <div className="grid grid-cols-3 gap-2">
              {filteredGradients.map(({ name, colors }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addElement({
                    type: "rect", x: 100, y: 100, width: 300, height: 200,
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: 300, y: 200 },
                    fillLinearGradientColorStops: [0, colors[0], 1, colors[1]],
                    opacity: 1, rotation: 0,
                  })}
                  className="aspect-video rounded-lg border border-gray-200 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                >
                  <span className="text-[10px] font-medium text-white/90 drop-shadow">{name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

const TEXT_PRESETS = [
  {
    id: "heading",
    label: "Add a heading",
    preview: "Heading",
    defaults: {
      text: "Add a heading",
      fontSize: 48,
      fontFamily: "Inter",
      fontStyle: "bold",
      fill: "#0f172a",
      width: 600,
      height: 64,
      align: "left",
      lineHeight: 1.2,
      letterSpacing: -1,
    },
  },
  {
    id: "subheading",
    label: "Add a subheading",
    preview: "Subheading",
    defaults: {
      text: "Add a subheading",
      fontSize: 28,
      fontFamily: "Inter",
      fontStyle: "normal",
      fill: "#334155",
      width: 500,
      height: 40,
      align: "left",
      lineHeight: 1.3,
      letterSpacing: 0,
    },
  },
  {
    id: "body",
    label: "Add a little bit of body text",
    preview: "Body text",
    defaults: {
      text: "Add a little bit of body text",
      fontSize: 16,
      fontFamily: "Inter",
      fontStyle: "normal",
      fill: "#64748b",
      width: 480,
      height: 24,
      align: "left",
      lineHeight: 1.6,
      letterSpacing: 0,
    },
  },
  {
    id: "caption",
    label: "Add a caption",
    preview: "Caption",
    defaults: {
      text: "Caption text",
      fontSize: 12,
      fontFamily: "Inter",
      fontStyle: "normal",
      fill: "#94a3b8",
      width: 320,
      height: 18,
      align: "left",
      lineHeight: 1.4,
      letterSpacing: 0.5,
    },
  },
];

function FontComboCard({ combo }) {
  const addElement = useEditorStore((s) => s.addElement);
  const canvasSize = useEditorStore((s) => s.canvasSize);

  const handleAdd = () => {
    const baseX = canvasSize.width / 2 - 200;
    const baseY = canvasSize.height / 2 - 60;
    combo.elements.forEach((el) => {
      addElement({
        type: "text",
        rotation: 0,
        opacity: 1,
        x: baseX + (el.x || 0),
        y: baseY + (el.y || 0),
        ...el,
      });
    });
  };

  return (
    <button
      onClick={handleAdd}
      className="p-3 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left overflow-hidden bg-white group min-h-[80px]"
    >
      <div className="pointer-events-none">
        {combo.elements.map((el, i) => (
          <div
            key={i}
            style={{
              fontFamily: el.fontFamily,
              fontSize: Math.min(el.fontSize * 0.28, 16),
              fontWeight: (el.fontStyle || "").includes("bold") ? 700 : 400,
              fontStyle: (el.fontStyle || "").includes("italic") ? "italic" : "normal",
              color: el.fill,
              letterSpacing: (el.letterSpacing || 0) * 0.28,
              lineHeight: el.lineHeight || 1.3,
              textTransform: el.textCase === "upper" ? "uppercase" : "none",
              marginBottom: 1,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {el.text}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1 group-hover:text-purple-500 truncate">
        {combo.name}
      </p>
    </button>
  );
}

export function TextPanel() {
  const addElement = useEditorStore((s) => s.addElement);

  return (
    <div className="px-3 py-2 flex-1 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-1 mb-4">
        {TEXT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() =>
              addElement({
                type: "text",
                x: 60,
                y: 80,
                rotation: 0,
                opacity: 1,
                ...preset.defaults,
              })
            }
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
          >
            <span
              style={{
                fontSize: preset.id === "heading" ? 18 : preset.id === "subheading" ? 15 : preset.id === "body" ? 12 : 10,
                fontWeight: preset.id === "heading" ? 700 : 400,
                color: "#1e293b",
                lineHeight: 1,
                flexShrink: 0,
                width: 80,
              }}
            >
              {preset.preview}
            </span>
            <span className="text-xs text-gray-500 group-hover:text-purple-600">
              {preset.label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-4">
        Font Combinations
      </p>
      <div className="grid grid-cols-2 gap-2">
        {FONT_COMBINATIONS.map((combo) => (
          <FontComboCard key={combo.id} combo={combo} />
        ))}
      </div>
    </div>
  );
}

export function UploadsPanel() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();
  const addElement = useEditorStore((s) => s.addElement);
  const toast = useToast();

  useEffect(() => {
    listImages()
      .then((imgs) =>
        setUploads(
          imgs.map((i) => ({
            id: i.id,
            src: i.url,
            name: i.name,
            type: i.type,
            savedAt: i.created_at ? new Date(i.created_at).getTime() : 0,
          })).sort((a, b) => b.savedAt - a.savedAt)
        )
      )
      .catch(() => setError("Failed to load uploads"));
  }, []);

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Only image files are supported");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File too large. Max 20MB.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await uploadImage(file);
      const newUpload = {
        id: result.id,
        src: result.url,
        name: result.name || file.name,
        type: file.type,
        savedAt: Date.now(),
      };
      setUploads((prev) => [newUpload, ...prev]);
    } catch (err) {
      setError("Failed to process image. Try a smaller file.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDelete = async (id) => {
    try {
      await deleteImage(id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleAddToCanvas = (upload) => {
    const maxDim = 400;
    addElement({
      type: "image",
      imageId: upload.id,
      src: upload.src,
      x: 80,
      y: 80,
      width: maxDim,
      height: maxDim,
      opacity: 1,
      rotation: 0,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-150 select-none ${
          dragging
            ? "border-purple-500 bg-purple-50"
            : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-sm text-gray-500">Processing image...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              {dragging ? "Drop image here" : "Click or drag to upload"}
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 20MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">
        Your Uploads ({uploads.length})
      </p>

      {uploads.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          <Upload className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No uploads yet</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {uploads.map((upload) => (
          <div
            key={upload.id}
            className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
          >
            <img
              src={upload.src}
              alt={upload.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-150 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCanvas(upload);
                }}
                className="bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-purple-100 shadow"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(upload.id);
                }}
                className="bg-white text-red-500 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-red-50 shadow"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
            <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {upload.name}
            </p>
          </div>
        ))}
      </div>

      <StockPhotosSection
        addElement={addElement}
        compressImage={compressImage}
        uploadImage={uploadImage}
        toast={toast}
      />
    </div>
  );
}

function StockPhotosSection({ addElement, compressImage, uploadImage, toast }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const SUGGESTIONS = [
    "business",
    "team",
    "technology",
    "nature",
    "office",
    "abstract",
    "city",
    "minimal",
  ];

  const hashStr = (str) =>
    str.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 7);

  const search = async (q) => {
    const term = q || query;
    if (!term) return;
    setSubmitted(term);
    setLoading(true);
    const seed = hashStr(term);
    const urls = Array.from({ length: 9 }, (_, i) => ({
      id: `${term}-${i}`,
      thumb: `https://picsum.photos/seed/${seed + i}/300/200`,
      full: `https://picsum.photos/seed/${seed + i}/1600/900`,
    }));
    setPhotos(urls);
    setLoading(false);
  };

  const addPhoto = async (url) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const file = new File([blob], "stock.jpg", { type: blob.type || "image/jpeg" });
      const { src } = await compressImage(file);
      const res = await fetch(src);
      const b = await res.blob();
      const fileToUpload = new File([b], "stock-photo.jpg", { type: b.type || "image/jpeg" });
      const result = await uploadImage(fileToUpload);
      addElement({
        type: "image",
        src: result.url,
        imageId: result.id,
        x: 80,
        y: 80,
        width: 400,
        height: 250,
        rotation: 0,
        opacity: 1,
      });
      toast("Photo added to canvas!", "success");
    } catch (e) {
      toast("Could not load photo — check network.", "error");
    }
  };

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Stock Photos
      </p>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Search photos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400"
        />
        <button
          type="button"
          onClick={() => search()}
          className="bg-purple-600 text-white text-xs px-3 py-2 rounded-xl hover:bg-purple-700"
        >
          Go
        </button>
      </div>
      {!submitted && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                search(s);
              }}
              className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-purple-100 hover:text-purple-700"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {loading && (
        <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
      )}
      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => addPhoto(photo.full)}
              className="relative group rounded-lg overflow-hidden aspect-video bg-gray-100"
            >
              <img
                src={photo.thumb}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/30 transition-colors flex items-center justify-center">
                <Plus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectsPanel() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { saveProject, loadProject } = useEditorStore();

  useEffect(() => {
    import("../api/projects")
      .then(({ listProjects }) => listProjects())
      .then((list) => setProjects(list || []))
      .catch(() => setProjects([]));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const project = await saveProject(name.trim());
      setProjects((prev) => [{ id: project.id, name: project.name, updated_at: project.savedAt }, ...prev]);
      setName("");
      toast("Project saved!", "success");
    } catch (e) {
      toast("Failed to save project", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (project) => {
    try {
      const { getProject } = await import("../api/projects");
      const full = await getProject(project.id);
      await loadProject(full);
      toast("Project loaded!", "success");
    } catch (e) {
      toast("Failed to load project", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      const { deleteProject } = await import("../api/projects");
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      toast("Failed to delete project", "error");
    }
  };

  return (
    <div className="px-3 py-2 flex-1 overflow-y-auto scrollbar-hide">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Project"}
        </button>
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Projects
        </p>
        <button
          type="button"
          onClick={async () => {
            try {
              await import("../api/client").then((m) => m.apiFetch("/api/settings/onboarding", { method: "DELETE" }));
              window.location.reload();
            } catch {
              window.location.reload();
            }
          }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Reset onboarding
        </button>
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No saved projects yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-3 bg-white border border-gray-200 rounded-lg"
            >
              <p className="font-bold text-gray-900">{project.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(project.updated_at || project.savedAt).toLocaleString()}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleLoad(project)}
                  className="px-3 py-1 bg-purple-500 text-white text-sm rounded"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(project.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CHARTS_CONFIG = [
  {
    category: "BAR CHARTS",
    charts: [
      { iconId: "bar-grouped", label: "Grouped Bar", defaultKey: "bar" },
      { iconId: "bar-stacked", label: "Stacked Bar", defaultKey: "stackedBar" },
      { iconId: "bar-stacked100", label: "100% Stacked", defaultKey: "stackedBar100" },
      { iconId: "bar-horizontal", label: "Horizontal Bar", defaultKey: "bar", extraProps: { variant: "horizontal" } },
    ],
  },
  {
    category: "LINE CHARTS",
    charts: [
      { iconId: "line", label: "Line", defaultKey: "line" },
      { iconId: "line-smooth", label: "Smooth Line", defaultKey: "line", extraProps: { variant: "smooth" } },
      { iconId: "line-step", label: "Step Line", defaultKey: "line", extraProps: { variant: "step" } },
      { iconId: "line-multi", label: "Multi-Line", defaultKey: "multiLine" },
    ],
  },
  {
    category: "COMBO CHARTS",
    charts: [
      { iconId: "combo-bar-line", label: "Bar + Line", defaultKey: "composed" },
      { iconId: "waterfall", label: "Waterfall", defaultKey: "waterfall" },
    ],
  },
  {
    category: "AREA CHARTS",
    charts: [
      { iconId: "area-stacked", label: "Stacked Area", defaultKey: "area", extraProps: { variant: "stacked" } },
      { iconId: "area-unstacked", label: "Unstacked Area", defaultKey: "area", extraProps: { variant: "unstacked" } },
    ],
  },
  {
    category: "PIE & DONUT",
    charts: [
      { iconId: "pie", label: "Pie", defaultKey: "pie" },
      { iconId: "donut", label: "Donut", defaultKey: "pie", extraProps: { variant: "donut" } },
    ],
  },
  {
    category: "SCATTER & BUBBLE",
    charts: [{ iconId: "scatter", label: "Scatter Plot", defaultKey: "scatter" }],
  },
  {
    category: "RADAR & RADIAL",
    charts: [
      { iconId: "radar", label: "Radar", defaultKey: "radar" },
      { iconId: "radialBar", label: "Radial Bar", defaultKey: "radialBar" },
    ],
  },
  {
    category: "FUNNEL & HIERARCHY",
    charts: [
      { iconId: "funnel", label: "Funnel", defaultKey: "funnel" },
      { iconId: "treemap", label: "Treemap", defaultKey: "treemap" },
    ],
  },
  {
    category: "PROGRESS",
    charts: [
      { iconId: "progress-ring", label: "Progress Ring", defaultKey: "progress", extraProps: { variant: "ring" } },
      { iconId: "progress-bar", label: "Progress Bar", defaultKey: "progress", extraProps: { variant: "bar" } },
    ],
  },
];

function ChartPreviewCard({ chart, onAdd }) {
  const IconComp = CHART_ICON_MAP[chart.iconId] || GroupedBarIcon;
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group bg-white"
    >
      <div
        className="w-full flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden group-hover:bg-purple-50 transition-colors"
        style={{ height: 72 }}
      >
        <IconComp width={116} height={68} />
      </div>
      <span className="text-[11px] text-gray-600 group-hover:text-purple-700 font-medium text-center leading-tight">
        {chart.label}
      </span>
    </button>
  );
}

export function ChartsPanel() {
  const addElement = useEditorStore((s) => s.addElement);
  const toast = useToast();
  const [search, setSearch] = useState("");

  const handleAdd = (chartDef) => {
    const defaults = CHART_DEFAULTS[chartDef.defaultKey];
    if (!defaults) return;
    addElement({
      ...JSON.parse(JSON.stringify(defaults)),
      ...(chartDef.extraProps || {}),
    });
    toast("Chart added! Click \"Edit Data\" in the toolbar to customize.", "info");
  };

  const filtered = CHARTS_CONFIG.map((cat) => ({
    ...cat,
    charts: cat.charts.filter((c) =>
      !search || c.label.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.charts.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative px-3 py-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search charts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm"
        />
      </div>
      <div className="px-3 py-2 flex-1 overflow-y-auto scrollbar-hide">
        {filtered.map((category) => (
          <div key={category.category} className="mb-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {category.category}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {category.charts.map((chart) => (
                <ChartPreviewCard
                  key={chart.iconId}
                  chart={chart}
                  onAdd={() => handleAdd(chart)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BackgroundPanel() {
  const { canvasSize, setBackgroundColor } = useEditorStore();
  const [customColor, setCustomColor] = useState(canvasSize.backgroundColor || "#ffffff");
  const debounceRef = useRef(null);

  const currentBg = canvasSize.backgroundColor || "#ffffff";

  const handleCustomChange = (color) => {
    setCustomColor(color);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBackgroundColor(color), 100);
  };

  return (
    <div className="px-3 py-2 flex-1 overflow-y-auto scrollbar-hide">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Background Color
      </p>
      <div className="grid grid-cols-5 gap-2 mb-6">
        {BACKGROUND_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setBackgroundColor(color)}
            className={`w-8 h-8 rounded-full border-2 transition-colors ${
              currentBg === color ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Custom Color
      </p>
      <div className="flex flex-col gap-2">
        <HexColorPicker color={customColor} onChange={handleCustomChange} />
      </div>
    </div>
  );
}
