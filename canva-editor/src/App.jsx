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
import useFeedback from "./store/useFeedback";
import { useToast } from "./components/Toast.jsx";
import GenerationStatusBar from "./components/GenerationStatusBar";
import AIChatPanel from "./components/AIChatPanel";
import MicroSurveyToast from "./components/feedback/MicroSurveyToast";
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
  const [showAIChat, setShowAIChat] = useState(false);
  const toast = useToast();
  const autosaveRef = useRef(null);

  const presentMode = useEditorStore((s) => s.presentMode);
  const pages = useEditorStore((s) => s.pages);
  const canvasSize = useEditorStore((s) => s.canvasSize);

  const loadSurveyState = useFeedback((s) => s.loadSurveyState);
  const triggerSurvey   = useFeedback((s) => s.triggerSurvey);
  const surveyStateLoaded = useFeedback((s) => s.surveyStateLoaded);

  // Load brand kit + survey state once on mount
  useEffect(() => {
    useEditorStore.getState().loadBrandKit();
    loadSurveyState();
  }, []);

  useEffect(() => {
    const loadAutosave = async () => {
      const { projectId } = useEditorStore.getState();
      if (projectId) return;
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
    document.title = `${title || "Untitled"} — Velox Decks`;
  }, [title]);

  // Download modal close — trigger first_export survey after successful export
  const handleDownloadClose = (didExport) => {
    setShowDownload(false);
    if (didExport) {
      triggerSurvey("first_export", {
        isDirty: false,
        isModalOpen: false,
        pageContext: "editor",
      });
    }
  };

  return (
    <>
      {!appReady && <LoadingScreen onReady={() => setAppReady(true)} />}
      <div className={`h-screen w-screen flex flex-col overflow-hidden transition-opacity duration-300 ${appReady ? "opacity-100" : "opacity-0"}`}>
      <TopBar
        onShare={() => setShowShare(true)}
        onDownload={() => setShowDownload(true)}
        onPresent={() => setPresentMode(true)}
        showAIChat={showAIChat}
        onToggleAIChat={() => setShowAIChat((v) => !v)}
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

      {showDownload && (
        <DownloadModal
          onClose={handleDownloadClose}
        />
      )}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}

      {presentMode && <PresentMode />}

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {showAIChat && <AIChatPanel onClose={() => setShowAIChat(false)} />}

      <Onboarding />

      {/* Feedback system — mounts once, self-manages visibility */}
      <MicroSurveyToast />
      </div>
    </>
  );
}
