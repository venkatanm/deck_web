import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";
import { ContextMenu } from "./components/ContextMenu";
import Toolbar from "./components/Toolbar";
import TopBar from "./components/TopBar";
import DownloadModal from "./components/DownloadModal";
import ShareModal from "./components/ShareModal";
import PresentMode from "./components/PresentMode";
import PagesPanel from "./components/PagesPanel";
import StatusBar from "./components/StatusBar";
import ShortcutsModal from "./components/ShortcutsModal";
import LoadingScreen from "./components/LoadingScreen";
import Onboarding from "./components/Onboarding";
import ErrorBoundary from "./components/ErrorBoundary";
import useEditorStore from "./store/useEditorStore";
import { useToast } from "./components/Toast.jsx";
import GenerationStatusBar from "./components/GenerationStatusBar";
import { shallow } from "zustand/shallow";

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    elementId: null,
  });
  const [showDownload, setShowDownload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const toast = useToast();
  const autosaveRef = useRef(null);

  const presentMode = useEditorStore((s) => s.presentMode);
  const pages = useEditorStore((s) => s.pages);
  const canvasSize = useEditorStore((s) => s.canvasSize);

  useEffect(() => {
    useEditorStore.getState().loadBrandKit();
  }, []);

  useEffect(() => {
    const loadAutosave = async () => {
      try {
        const { getAutosave } = await import("./api/projects");
        const saved = await getAutosave();
        if (saved?.pages) {
          const hasElements = saved.pages?.some((p) => p.elements?.length > 0);
          if (hasElements) {
            await useEditorStore.getState().loadProject({
              pages: saved.pages,
              canvasSize: saved.canvas_size,
            });
            toast("Restored from auto-save", "success");
          }
        }
      } catch (e) {
        console.error("Auto-save restore failed", e);
      }
    };
    loadAutosave();
  }, []);

  useEffect(() => {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => {
      try {
        const { pages: p, canvasSize: cs } = useEditorStore.getState();
        const safePages = Array.isArray(p)
          ? p.map((pg) => ({
              id: pg.id,
              name: pg.name,
              backgroundColor: pg.backgroundColor,
              elements: (pg.elements || []).map((el) => {
                const { src, ...rest } = el;
                return el.type === "image" ? { ...rest, src: null } : rest;
              }),
            }))
          : [];
        const safeCanvasSize = cs
          ? { width: cs.width, height: cs.height, backgroundColor: cs.backgroundColor }
          : {};
        import("./api/projects").then(({ putAutosave }) => {
          putAutosave({
            canvas_size: safeCanvasSize,
            pages: safePages,
          }).catch(console.error);
        });
        useEditorStore.getState().setLastSaved(Date.now());
      } catch (e) {
        console.warn("Autosave failed", e);
      }
    }, 3000);
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [pages, canvasSize]);
  const setPresentMode = useEditorStore((s) => s.setPresentMode);
  const showShortcuts = useEditorStore((s) => s.showShortcuts);
  const setShowShortcuts = useEditorStore((s) => s.setShowShortcuts);
  const {
    status,
    slideCount,
    totalSlides,
    title: streamTitle,
    error,
  } = useEditorStore((s) => s.pipelineStream, shallow);
  const resetPipelineStream = useEditorStore((s) => s.resetPipelineStream);

  const handleContextMenu = (x, y, elementId) => {
    setContextMenu({ visible: true, x, y, elementId });
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const title = useEditorStore((s) => s.title);
  useEffect(() => {
    document.title = `${title || "Untitled"} — CanvaClone`;
  }, [title]);

  return (
    <>
      {!appReady && <LoadingScreen onReady={() => setAppReady(true)} />}
      <div className={`h-screen w-screen flex flex-col overflow-hidden transition-opacity duration-300 ${appReady ? "opacity-100" : "opacity-0"}`}>
      <TopBar
        onShare={() => setShowShare(true)}
        onDownload={() => setShowDownload(true)}
        onPresent={() => setPresentMode(true)}
      />

      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <GenerationStatusBar
            status={status}
            slideCount={slideCount}
            totalSlides={totalSlides}
            title={streamTitle}
            error={error}
            onDismiss={resetPipelineStream}
          />
          <ErrorBoundary>
            <Canvas onContextMenu={handleContextMenu} />
          </ErrorBoundary>
          <PagesPanel />
          <StatusBar />
        </div>
      </div>

      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={contextMenu.elementId}
          onClose={closeContextMenu}
        />
      )}

      {showDownload && <DownloadModal onClose={() => setShowDownload(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}

      {presentMode && <PresentMode />}

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      <Onboarding />
      </div>
    </>
  );
}
