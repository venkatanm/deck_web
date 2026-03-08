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
            <div key={i} className="h-12 rounded-xl animate-pulse bg-gray-100" />
          ))}
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

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
      <aside
        className="w-[80px] h-full flex flex-col items-center py-3 gap-0.5 flex-shrink-0"
        style={{ background: "#ffffff", borderRight: "1px solid #e5e7eb" }}
      >
        {TABS.map(({ id, icon: Icon, label, isDrawMode }) => {
          const isActive = isDrawMode ? drawMode : activeTab === id;
          const showPulse = id === "layers" && layersPulse;

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabClick(id)}
              title={label}
              className={`relative w-[68px] py-2.5 flex flex-col items-center gap-1.5 rounded-xl transition-all ${
                showPulse ? "animate-pulse" : ""
              }`}
              style={
                isActive
                  ? { background: "#eff6ff", color: "#2563eb" }
                  : { color: "#6b7280" }
              }
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = "#111827";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "#6b7280";
              }}
            >
              {/* Active left indicator */}
              {isActive && (
                <div
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                  style={{ background: "#2563eb" }}
                />
              )}
              <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
              <span className="text-[10.5px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </aside>

      {/* Panel drawer */}
      <div
        className="h-full flex flex-col overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          width: activeTab ? 288 : 0,
          opacity: activeTab ? 1 : 0,
          minWidth: activeTab ? 288 : 0,
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        {panelTabs.map((tab) => {
          const PanelComponent = PANELS[tab.id];
          if (!everOpened[tab.id]) return null;
          return (
            <div
              key={tab.id}
              style={{ display: activeTab === tab.id ? "flex" : "none", flexDirection: "column", height: "100%" }}
            >
              {/* Panel header */}
              <div className="flex-shrink-0" style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <div className="h-[3px]" style={{ background: "#2563eb" }} />
                <div className="px-4 py-2.5">
                  <span className="font-bold text-[13px] tracking-tight" style={{ color: "#111827" }}>
                    {tab.label}
                  </span>
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
