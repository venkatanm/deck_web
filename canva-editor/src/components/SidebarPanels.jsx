import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Upload, Plus, Trash2, Loader2 } from "lucide-react";
import { saveImage, getAllImages, deleteImage } from "../utils/imageStorage";
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
} from "../utils/defaults";
import { STARTER_TEMPLATES } from "../utils/starterTemplates";
import { renderChart } from "./charts/ChartElement";

export function TemplatesPanel() {
  const [search, setSearch] = useState("");
  const canvasSize = useEditorStore((s) => s.canvasSize);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const toast = useToast();

  const filtered = CANVAS_PRESETS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="relative px-3 py-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm"
        />
      </div>
      <div className="px-3 py-2 flex-1 overflow-y-auto scrollbar-hide">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2 mb-2">
          Starter Templates
        </p>
        <div className="flex flex-col gap-2 mb-4">
          {STARTER_TEMPLATES.map((template) => (
            <button
              key={template.name}
              type="button"
              onClick={() => {
                const store = useEditorStore.getState();
                store.setCanvasSize(template.canvasSize);
                const newElements = template.elements.map((el) => ({
                  ...el,
                  id: uuidv4(),
                }));
                const { pages, currentPageId } = store;
                useEditorStore.setState({
                  pages: pages.map((p) =>
                    p.id === currentPageId ? { ...p, elements: newElements } : p
                  ),
                  selectedId: null,
                  selectedIds: [],
                });
                toast("Template loaded!", "success");
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-colors group"
            >
              <p className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                {template.name}
              </p>
              <p className="text-xs text-gray-400">
                {template.canvasSize.width} × {template.canvasSize.height}
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2 mb-2">
          Canvas Presets
        </p>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((preset) => {
            const isActive =
              canvasSize.width === preset.width &&
              canvasSize.height === preset.height;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => setCanvasSize({ width: preset.width, height: preset.height })}
                className={`rounded-lg border-2 transition-colors p-2 ${
                  isActive
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div
                  className="w-full rounded-md bg-white border border-gray-100"
                  style={{
                    aspectRatio: `${preset.width}/${preset.height}`,
                  }}
                />
                <span className="text-xs font-medium text-gray-700 mt-1 block truncate">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
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

export function ElementsPanel() {
  const [search, setSearch] = useState("");
  const addElement = useEditorStore((s) => s.addElement);

  const filteredShapes = SHAPES.filter((s) =>
    s.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="relative px-3 py-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search elements"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm"
        />
      </div>
      <div className="px-3 py-2 flex-1 overflow-y-auto scrollbar-hide">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Shapes
        </p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {filteredShapes.map(({ id, label, type }) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                addElement({ ...DEFAULT_ELEMENT_PROPS[type] || DEFAULT_ELEMENT_PROPS.rect })
              }
              className="w-14 h-14 rounded-lg bg-gray-100 hover:bg-gray-200 flex flex-col items-center justify-center gap-1"
            >
              <svg viewBox="0 0 56 56" className="w-8 h-8">
                {SHAPE_SVGS[type] || SHAPE_SVGS.rect}
              </svg>
              <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">
                {label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Lines
        </p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {LINE_TYPES.map(({ id, label, props }) => (
            <button
              key={id}
              type="button"
              onClick={() => addElement({ ...props })}
              className="w-14 h-14 rounded-lg bg-gray-100 hover:bg-gray-200 flex flex-col items-center justify-center gap-1"
            >
              <svg viewBox="0 0 56 56" className="w-8 h-8">
                {id === "arrow" ? (
                  <path
                    d="M8,24 L36,24 L36,16 L50,28 L36,40 L36,32 L8,32 Z"
                    fill="#7c3aed"
                  />
                ) : (
                  <line
                    x1={8}
                    y1={28}
                    x2={48}
                    y2={28}
                    stroke="#7c3aed"
                    strokeWidth={3}
                    strokeDasharray={props.dash?.join(" ") || "none"}
                  />
                )}
              </svg>
              <span className="text-[10px] font-medium text-gray-600 truncate w-full text-center">
                {label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Gradients
        </p>
        <div className="grid grid-cols-3 gap-2">
          {GRADIENT_PRESETS.map(({ name, colors }) => (
            <button
              key={name}
              type="button"
              onClick={() =>
                addElement({
                  type: "rect",
                  x: 100,
                  y: 100,
                  width: 300,
                  height: 200,
                  fillLinearGradientStartPoint: { x: 0, y: 0 },
                  fillLinearGradientEndPoint: { x: 300, y: 200 },
                  fillLinearGradientColorStops: [0, colors[0], 1, colors[1]],
                  opacity: 1,
                  rotation: 0,
                })
              }
              className="aspect-video rounded-lg border border-gray-200 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
              }}
            >
              <span className="text-[10px] font-medium text-white/90 drop-shadow">
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function TextPanel() {
  const addElement = useEditorStore((s) => s.addElement);

  const baseText = DEFAULT_ELEMENT_PROPS.text;

  const cards = [
    {
      label: "Add a heading",
      add: () =>
        addElement({
          ...baseText,
          fontSize: 40,
          fontStyle: "bold",
        }),
    },
    {
      label: "Add a subheading",
      add: () =>
        addElement({
          ...baseText,
          fontSize: 28,
          fontStyle: "normal",
        }),
    },
    {
      label: "Add a little text",
      add: () =>
        addElement({
          ...baseText,
          fontSize: 16,
          fontStyle: "normal",
        }),
    },
  ];

  return (
    <div className="px-3 py-2 flex-1 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-2 mb-6">
        {cards.map(({ label, add }) => (
          <button
            key={label}
            type="button"
            onClick={add}
            className="w-full py-4 bg-white border border-gray-200 rounded-lg text-center font-medium text-gray-700 hover:border-purple-500 hover:shadow-md transition-all"
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Font combinations
      </p>
      <div className="flex flex-col gap-2">
        {FONT_PAIRS.map(({ heading, body }) => (
          <button
            key={heading + body}
            type="button"
            onClick={() =>
              addElement({
                ...DEFAULT_ELEMENT_PROPS.text,
                fontFamily: heading,
                text: "Your heading here",
                fontSize: 36,
                fontStyle: "bold",
              })
            }
            className="w-full p-3 bg-white border border-gray-200 rounded-lg text-left hover:border-purple-500 transition-all"
          >
            <div
              className="font-bold text-gray-900 truncate"
              style={{ fontFamily: heading, fontSize: 16 }}
            >
              Heading text
            </div>
            <div
              className="text-gray-600 truncate mt-1"
              style={{ fontFamily: body, fontSize: 12 }}
            >
              Body copy text
            </div>
          </button>
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

  useEffect(() => {
    getAllImages()
      .then((imgs) =>
        setUploads(imgs.sort((a, b) => b.savedAt - a.savedAt))
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
      const { src } = await compressImage(file);
      const id = uuidv4();
      await saveImage(id, src, file.name, file.type);
      const newUpload = {
        id,
        src,
        name: file.name,
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
    await deleteImage(id);
    setUploads((prev) => prev.filter((u) => u.id !== id));
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
    </div>
  );
}

export function ProjectsPanel() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const toast = useToast();
  const { saveProject, loadProject } = useEditorStore();

  useEffect(() => {
    const stored = localStorage.getItem("canva_projects");
    if (stored) setProjects(JSON.parse(stored));
  }, []);

  const handleSave = () => {
    if (!name.trim()) return;
    const project = saveProject(name.trim());
    setProjects((prev) => [project, ...prev]);
    setName("");
    toast("Project saved!", "success");
  };

  const handleLoad = async (project) => {
    await loadProject(project);
    toast("Project loaded!", "success");
  };

  const handleDelete = (id) => {
    const next = projects.filter((p) => p.id !== id);
    setProjects(next);
    localStorage.setItem("canva_projects", JSON.stringify(next));
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
          className="px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600"
        >
          Save Project
        </button>
      </div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Projects
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("canva_onboarding_done");
            window.location.reload();
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
                {new Date(project.savedAt).toLocaleString()}
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

const CHART_CATEGORIES = [
  {
    name: "Bar Charts",
    charts: [
      { id: "bar-grouped", label: "Grouped Bar", chartType: "bar", variant: "grouped" },
      { id: "bar-stacked", label: "Stacked Bar", chartType: "bar", variant: "stacked" },
      { id: "bar-horizontal", label: "Horizontal Bar", chartType: "bar", variant: "horizontal" },
    ],
  },
  {
    name: "Line Charts",
    charts: [
      { id: "line-linear", label: "Line", chartType: "line", variant: "linear" },
      { id: "line-smooth", label: "Smooth Line", chartType: "line", variant: "smooth" },
      { id: "line-step", label: "Step Line", chartType: "line", variant: "step" },
    ],
  },
  {
    name: "Area Charts",
    charts: [
      { id: "area-stacked", label: "Stacked Area", chartType: "area", variant: "stacked" },
      { id: "area-unstacked", label: "Unstacked Area", chartType: "area", variant: "unstacked" },
    ],
  },
  {
    name: "Pie & Donut",
    charts: [
      { id: "pie", label: "Pie", chartType: "pie", variant: "pie" },
      { id: "donut", label: "Donut", chartType: "pie", variant: "donut" },
    ],
  },
  {
    name: "Scatter & Bubble",
    charts: [
      { id: "scatter", label: "Scatter Plot", chartType: "scatter" },
    ],
  },
  {
    name: "Radar & Radial",
    charts: [
      { id: "radar", label: "Radar / Spider", chartType: "radar" },
      { id: "radialBar", label: "Radial Bar", chartType: "radialBar" },
    ],
  },
  {
    name: "Hierarchy & Flow",
    charts: [
      { id: "funnel", label: "Funnel", chartType: "funnel" },
      { id: "treemap", label: "Treemap", chartType: "treemap" },
    ],
  },
  {
    name: "Progress & Infographic",
    charts: [
      { id: "progress-ring", label: "Progress Ring", chartType: "progress", variant: "ring" },
      { id: "progress-bar", label: "Progress Bar", chartType: "progress", variant: "bar" },
    ],
  },
];

function ChartPreviewCard({ chart, onAdd }) {
  const defaults = CHART_DEFAULTS[chart.chartType];
  if (!defaults) return null;

  const previewEl = {
    ...JSON.parse(JSON.stringify(defaults)),
    id: "preview",
    chartType: chart.chartType,
    variant: chart.variant || defaults.variant,
    width: 116,
    height: 80,
    showLegend: false,
    showGrid: false,
    title: "",
  };

  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
    >
      <div className="w-full h-20 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center pointer-events-none">
        {renderChart(previewEl)}
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
    const defaults = CHART_DEFAULTS[chartDef.chartType];
    if (!defaults) return;
    addElement({
      ...JSON.parse(JSON.stringify(defaults)),
      chartType: chartDef.chartType,
      variant: chartDef.variant || defaults.variant,
    });
    toast("Chart added! Click \"Edit Data\" in the toolbar to customize.", "info");
  };

  const filtered = CHART_CATEGORIES.map((cat) => ({
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
          <div key={category.name} className="mb-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {category.name}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {category.charts.map((chart) => (
                <ChartPreviewCard
                  key={chart.id}
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
