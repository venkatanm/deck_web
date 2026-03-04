import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { LeftSidebar } from "./components/LeftSidebar";
import { SlideCanvas } from "./components/SlideCanvas";
import { CanvasToolbar } from "./components/CanvasToolbar";
import { BottomToolbar } from "./components/BottomToolbar";
import { ThemeSettingsPanel } from "./components/ThemeSettingsPanel";
import { VeloxDatasheetWindow } from "./components/VeloxDatasheetWindow";
import { useThemeVariables } from "./hooks/useThemeVariables";
import { useUndoRedoKeys } from "./hooks/useUndoRedoKeys";
import { YjsProvider } from "./sync/YjsProvider";
import { YjsSync } from "./sync/YjsSync";
import { usePresentationStore } from "./store/usePresentationStore";

function App() {
  useUndoRedoKeys();
  const themeVars = useThemeVariables();
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [zoom, setZoom] = useState(60);

  return (
    <YjsProvider>
      <YjsSync />
      <div
        style={{
          width: "100vw",
          height: "100vh",
          ...themeVars,
          background: "#f8fafc",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppHeader />

        <div
          style={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <LeftSidebar onOpenIconPicker={() => setIconPickerOpen(true)} />

          <div
            style={{
              flex: 1,
              minWidth: 0,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 0,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <CanvasArea
              zoom={zoom}
              iconPickerOpen={iconPickerOpen}
              onCloseIconPicker={() => setIconPickerOpen(false)}
            />
          </div>

          <ThemeSettingsPanel />
        </div>

        <BottomToolbar zoom={zoom} onZoomChange={setZoom} />
        <VeloxDatasheetWindow />
      </div>
    </YjsProvider>
  );
}

function CanvasArea({
  zoom,
  iconPickerOpen,
  onCloseIconPicker,
}: {
  zoom: number;
  iconPickerOpen: boolean;
  onCloseIconPicker: () => void;
}) {
  const {
    selectedElementIds,
    currentSlideId,
    toggleElementLock,
    deleteSelectedElements,
    duplicateSelectedElements,
  } = usePresentationStore();

  const currentSlideSelection = selectedElementIds.filter(
    (s) => s.slideId === currentSlideId
  );
  const hasSelection = currentSlideSelection.length > 0;

  return (
    <>
      <CanvasToolbar
        hasSelection={hasSelection}
        onRotate={() => {}}
        onCrop={() => {}}
        onTransparency={() => {}}
        onLock={() => {
          if (currentSlideId && currentSlideSelection.length === 1) {
            toggleElementLock(currentSlideId, currentSlideSelection[0]!.elementId);
          }
        }}
        onDuplicate={duplicateSelectedElements}
        onDelete={deleteSelectedElements}
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center center",
          }}
        >
          <SlideCanvas
            iconPickerOpen={iconPickerOpen}
            onCloseIconPicker={onCloseIconPicker}
          />
        </div>
      </div>
    </>
  );
}

export default App;
