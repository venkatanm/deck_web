/**
 * Global keyboard bindings: Undo/Redo, Group/Ungroup.
 */

import { useEffect } from "react";
import { usePresentationStore } from "../store/usePresentationStore";

export function useUndoRedoKeys() {
  const undo = usePresentationStore((s) => s.undo);
  const redo = usePresentationStore((s) => s.redo);
  const groupElements = usePresentationStore((s) => s.groupElements);
  const ungroupElements = usePresentationStore((s) => s.ungroupElements);
  const deleteSelectedElements = usePresentationStore(
    (s) => s.deleteSelectedElements
  );
  const duplicateSelectedElements = usePresentationStore(
    (s) => s.duplicateSelectedElements
  );
  const past = usePresentationStore((s) => s.past);
  const future = usePresentationStore((s) => s.future);
  const selectedElementIds = usePresentationStore((s) => s.selectedElementIds);
  const currentSlideId = usePresentationStore((s) => s.currentSlideId);
  const presentation = usePresentationStore((s) => s.presentation);

  const currentSlideSelection = selectedElementIds.filter(
    (s) => s.slideId === currentSlideId
  );
  const isMultiSelected = currentSlideSelection.length > 1;
  const slide = presentation.slides.find((s) => s.id === currentSlideId);
  const hasGroupSelected =
    currentSlideSelection.length === 1 &&
    slide?.elements.some(
      (e) =>
        e.id === currentSlideSelection[0]?.elementId && e.type === "group"
    );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" || e.key === "y") {
          if (e.shiftKey) {
            if (future.length > 0) {
              e.preventDefault();
              redo();
            }
          } else {
            if (e.key === "z" && past.length > 0) {
              e.preventDefault();
              undo();
            }
            if (e.key === "y" && future.length > 0) {
              e.preventDefault();
              redo();
            }
          }
        }
        if (e.key === "g") {
          if (e.shiftKey) {
            if (hasGroupSelected) {
              e.preventDefault();
              ungroupElements();
            }
          } else {
            if (isMultiSelected) {
              e.preventDefault();
              groupElements();
            }
          }
        }
        if (e.key === "d" && currentSlideSelection.length > 0) {
          e.preventDefault();
          duplicateSelectedElements();
        }
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !e.ctrlKey &&
        !e.metaKey &&
        currentSlideSelection.length > 0
      ) {
        const target = e.target as HTMLElement;
        if (
          !target.isContentEditable &&
          target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          deleteSelectedElements();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    groupElements,
    ungroupElements,
    deleteSelectedElements,
    duplicateSelectedElements,
    past.length,
    future.length,
    isMultiSelected,
    hasGroupSelected,
    currentSlideSelection.length,
  ]);
}
