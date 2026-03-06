import { useState, useEffect, lazy, Suspense } from "react";
import {
  LayoutTemplate,
  Shapes,
  BarChart2,
  Table2,
  Smile,
  Type,
  Image,
  Pencil,
  FolderOpen,
  Palette,
  PaintBucket,
  Layers,
  Sparkles,
} from "lucide-react";
import useEditorStore from "../store/useEditorStore";
import {
  ElementsPanel,
  TextPanel,
  UploadsPanel,
  ProjectsPanel,
  BackgroundPanel,
} from "./SidebarPanels";
import { LayersPanel } from "./LayersPanel";

const ChartsPanel = lazy(() => import("./SidebarPanels").then((m) => ({ default: m.ChartsPanel })));
const TablesPanel = lazy(() => import("./TablesPanel"));
const GraphicsPanel = lazy(() => import("./GraphicsPanel"));
const BrandKitPanel = lazy(() => import("./BrandKitPanel"));
const TemplatesLayoutsStylesPanel = lazy(() => import("./TemplatesLayoutsStylesPanel"));
const AIRefinementPanel = lazy(() => import("./AIRefinementPanel"));

function PanelSuspense({ children }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-2 p-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// Color accent per tab — gives each section a distinct identity
const TAB_COLORS = {
  templates: { active: "text-violet-300 bg-violet-500/20", icon: "text-violet-300", dot: "bg-violet-400" },
  elements:  { active: "text-blue-300 bg-blue-500/20",    icon: "text-blue-300",   dot: "bg-blue-400"   },
  charts:    { active: "text-cyan-300 bg-cyan-500/20",    icon: "text-cyan-300",   dot: "bg-cyan-400"   },
  tables:    { active: "text-sky-300 bg-sky-500/20",      icon: "text-sky-300",    dot: "bg-sky-400"    },
  graphics:  { active: "text-pink-300 bg-pink-500/20",    icon: "text-pink-300",   dot: "bg-pink-400"   },
  text:      { active: "text-slate-200 bg-slate-500/20",  icon: "text-slate-200",  dot: "bg-slate-300"  },
  draw:      { active: "text-amber-300 bg-amber-500/20",  icon: "text-amber-300",  dot: "bg-amber-400"  },
  uploads:   { active: "text-teal-300 bg-teal-500/20",    icon: "text-teal-300",   dot: "bg-teal-400"   },
  ai:        { active: "text-emerald-300 bg-emerald-500/20", icon: "text-emerald-300", dot: "bg-emerald-400" },
  projects:  { active: "text-indigo-300 bg-indigo-500/20", icon: "text-indigo-300", dot: "bg-indigo-400" },
  brand:     { active: "text-green-300 bg-green-500/20",  icon: "text-green-300",  dot: "bg-green-400"  },
  background:{ active: "text-rose-300 bg-rose-500/20",    icon: "text-rose-300",   dot: "bg-rose-400"   },
  layers:    { active: "text-gray-200 bg-gray-500/20",    icon: "text-gray-200",   dot: "bg-gray-300"   },
};

// Header accent color shown as top border on panel header
const PANEL_HEADER_COLORS = {
  templates:  "from-violet-500 to-purple-600",
  elements:   "from-blue-500 to-indigo-500",
  charts:     "from-cyan-500 to-blue-500",
  tables:     "from-sky-500 to-cyan-500",
  graphics:   "from-pink-500 to-rose-500",
  text:       "from-slate-400 to-slate-600",
  uploads:    "from-teal-500 to-cyan-500",
  ai:         "from-emerald-400 to-teal-500",
  projects:   "from-indigo-500 to-violet-500",
  brand:      "from-green-500 to-emerald-500",
  background: "from-rose-400 to-pink-500",
  layers:     "from-gray-500 to-slate-600",
};

const TABS = [
  { id: "templates", icon: LayoutTemplate, label: "Templates" },
  { id: "elements",  icon: Shapes,         label: "Elements"  },
  { id: "charts",    icon: BarChart2,       label: "Charts"    },
  { id: "tables",    icon: Table2,          label: "Tables"    },
  { id: "graphics",  icon: Smile,           label: "Graphics"  },
  { id: "text",      icon: Type,            label: "Text"      },
  { id: "draw",      icon: Pencil,          label: "Draw",     isDrawMode: true },
  { id: "uploads",   icon: Image,           label: "Uploads"   },
  { id: "ai",        icon: Sparkles,        label: "AI"        },
  { id: "projects",  icon: FolderOpen,      label: "Projects"  },
  { id: "brand",     icon: PaintBucket,     label: "Brand"     },
  { id: "background",icon: Palette,         label: "Background"},
  { id: "layers",    icon: Layers,          label: "Layers"    },
];

const PANELS = {
  templates:  TemplatesLayoutsStylesPanel,
  elements:   ElementsPanel,
  charts:     ChartsPanel,
  tables:     TablesPanel,
  graphics:   GraphicsPanel,
  text:       TextPanel,
  uploads:    UploadsPanel,
  ai:         AIRefinementPanel,
  projects:   ProjectsPanel,
  brand:      BrandKitPanel,
  background: BackgroundPanel,
  layers:     LayersPanel,
};

export function Sidebar() {
  const [activeTab, setActiveTab] = useState(null);
  const [everOpened, setEverOpened] = useState({});
  const [layersPulse, setLayersPulse] = useState(false);
  const drawMode = useEditorStore((s) => s.drawMode);
  const setDrawMode = useEditorStore((s) => s.setDrawMode);
  const selectedId = useEditorStore((s) => s.selectedId);

  useEffect(() => {
    if (selectedId) {
      setLayersPulse(true);
      const t = setTimeout(() => setLayersPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [selectedId]);

  const handleTabClick = (id) => {
    const tab = TABS.find((t) => t.id === id);
    if (tab?.isDrawMode) {
      setDrawMode(!drawMode);
      setActiveTab(null);
      return;
    }
    setEverOpened((prev) => ({ ...prev, [id]: true }));
    setActiveTab((prev) => (prev === id ? null : id));
  };

  const panelTabs = TABS.filter((t) => !t.isDrawMode);

  return (
    <div className="flex h-full">
      {/* Icon rail */}
      <aside className="w-[80px] h-full bg-[#181825] flex flex-col items-center py-3 gap-0.5 flex-shrink-0">
        {TABS.map(({ id, icon: Icon, label, isDrawMode }) => {
          const isActive = isDrawMode ? drawMode : activeTab === id;
          const colors = TAB_COLORS[id] || TAB_COLORS.layers;
          const showPulse = id === "layers" && layersPulse;

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabClick(id)}
              title={label}
              className={`relative w-[68px] py-2.5 flex flex-col items-center gap-1.5 rounded-xl transition-all ${
                showPulse ? "animate-pulse" : ""
              } ${
                isActive
                  ? `${colors.active}`
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {/* Active left indicator */}
              {isActive && (
                <div className={`absolute left-0 top-3 bottom-3 w-[3px] ${colors.dot} rounded-r-full`} />
              )}
              <Icon
                size={22}
                className={isActive ? colors.icon : ""}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span className={`text-[10.5px] font-medium leading-none ${isActive ? colors.icon : ""}`}>
                {label}
              </span>
            </button>
          );
        })}
      </aside>

      {/* Panel drawer */}
      <div
        className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          width: activeTab ? 288 : 0,
          opacity: activeTab ? 1 : 0,
          minWidth: activeTab ? 288 : 0,
        }}
      >
        {panelTabs.map((tab) => {
          const PanelComponent = PANELS[tab.id];
          if (!everOpened[tab.id]) return null;
          const gradientClass = PANEL_HEADER_COLORS[tab.id] || "from-gray-400 to-gray-600";
          return (
            <div
              key={tab.id}
              style={{ display: activeTab === tab.id ? "flex" : "none", flexDirection: "column", height: "100%" }}
            >
              {/* Panel header with gradient accent bar */}
              <div className="flex-shrink-0 border-b border-gray-100">
                <div className={`h-[3px] bg-gradient-to-r ${gradientClass}`} />
                <div className="px-4 py-2.5">
                  <span className="font-bold text-gray-900 text-[13px] tracking-tight">{tab.label}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-2">
                <PanelSuspense>
                  <PanelComponent />
                </PanelSuspense>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
