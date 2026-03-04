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

const TABS = [
  { id: "templates", icon: LayoutTemplate, label: "Templates" },
  { id: "elements", icon: Shapes, label: "Elements" },
  { id: "charts", icon: BarChart2, label: "Charts" },
  { id: "tables", icon: Table2, label: "Tables" },
  { id: "graphics", icon: Smile, label: "Graphics" },
  { id: "text", icon: Type, label: "Text" },
  { id: "draw", icon: Pencil, label: "Draw", isDrawMode: true },
  { id: "uploads", icon: Image, label: "Uploads" },
  { id: "ai", icon: Sparkles, label: "AI" },
  { id: "projects", icon: FolderOpen, label: "Projects" },
  { id: "brand", icon: PaintBucket, label: "Brand" },
  { id: "background", icon: Palette, label: "Background" },
  { id: "layers", icon: Layers, label: "Layers" },
];

const PANELS = {
  templates: TemplatesLayoutsStylesPanel,
  elements: ElementsPanel,
  charts: ChartsPanel,
  tables: TablesPanel,
  graphics: GraphicsPanel,
  text: TextPanel,
  uploads: UploadsPanel,
  ai: AIRefinementPanel,
  projects: ProjectsPanel,
  brand: BrandKitPanel,
  background: BackgroundPanel,
  layers: LayersPanel,
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
      <aside className="w-[72px] h-full bg-[#1e1e2e] flex flex-col items-center py-3 gap-1">
        {TABS.map(({ id, icon: Icon, label, isDrawMode }) => {
          const isActive = isDrawMode ? drawMode : activeTab === id;
          const showPulse = id === "layers" && layersPulse;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabClick(id)}
              className={`relative w-full py-2 flex flex-col items-center gap-1 cursor-pointer rounded-lg mx-1 transition-colors ${showPulse ? "animate-pulse" : ""} ${
                isActive ? "text-white bg-white/20" : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-purple-500 rounded-r" />
              )}
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </aside>

      <div
        className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden transition-all duration-200 ease-in-out"
        style={{
          width: activeTab ? 280 : 0,
          opacity: activeTab ? 1 : 0,
          minWidth: activeTab ? 280 : 0,
        }}
      >
        {panelTabs.map((tab) => {
          const PanelComponent = PANELS[tab.id];
          if (!everOpened[tab.id]) return null;
          return (
            <div
              key={tab.id}
              style={{ display: activeTab === tab.id ? "flex" : "none", flexDirection: "column", height: "100%" }}
              className="flex flex-col"
            >
              <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-800 text-sm flex-shrink-0">
                {tab.label}
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
