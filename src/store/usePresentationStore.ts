/**
 * Global presentation state - Zod-compliant.
 * All mutations produce valid PresentationSchema output.
 * History stack: commit only on drag/resize/blur (not mousemove).
 */

import { create } from "zustand";
import type {
  CanvasElement,
  ChartData,
  LayoutId,
  Presentation,
  Slide,
  ThemeColorSlot,
  Transform,
} from "@deck-web/schema";
import { PresentationSchema } from "../../shared/schema/PresentationSchema";
import { SLIDE_REGISTRY } from "../../shared/registry/SlideTemplates";

const HISTORY_LIMIT = 50;

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function clonePresentation(p: Presentation): Presentation {
  return structuredClone(p);
}

const INITIAL_PRESENTATION: Presentation = {
  theme: {
    colorScheme: {
      dk1: "#000000",
      lt1: "#FFFFFF",
      dk2: "#1F2937",
      lt2: "#F3F4F6",
      accent1: "#4361EE",
      accent2: "#3B82F6",
      accent3: "#06B6D4",
      accent4: "#10B981",
      accent5: "#F59E0B",
      accent6: "#EF4444",
      hlink: "#2563EB",
      folHlink: "#7C3AED",
    },
    fontScheme: { headFont: "Calibri Light", bodyFont: "Calibri" },
  },
  slides: [
    {
      id: "slide-1",
      layoutId: "BLANK",
      elements: [
        {
          id: "text-1",
          type: "text",
          content: "Hello World",
          transform: { x: 0.1, y: 0.1, w: 0.3, h: 0.15, z: 0 },
          fontSize: 24,
          color: "dk1",
        },
      ],
    },
  ],
};

export const PLACEHOLDER_IMAGE_URL =
  "https://placehold.co/400x300/e2e8f0/64748b?text=Image";

export type SelectedElement = { slideId: string; elementId: string };

interface PresentationState {
  presentation: Presentation;
  currentSlideId: string | null;
  selectedElementIds: SelectedElement[];
  past: Presentation[];
  future: Presentation[];

  addSlide: () => void;
  deleteSlide: (id: string) => void;
  setSlideLayout: (slideId: string, layoutId: LayoutId) => void;
  deleteSelectedElements: () => void;
  toggleElementLock: (slideId: string, elementId: string) => void;
  selectSlide: (id: string) => void;
  toggleSelectElement: (slideId: string, elementId: string, shiftKey: boolean) => void;
  clearSelection: () => void;
  updateElement: (
    slideId: string,
    elementId: string,
    newTransform: Transform
  ) => void;
  updateElementContent: (slideId: string, elementId: string, content: string) => void;
  updateChartElementData: (slideId: string, elementId: string, data: ChartData) => void;
  addElement: (slideId: string, element: CanvasElement) => void;
  bringForward: () => void;
  sendBackward: () => void;
  alignLeft: () => void;
  alignCenter: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignMiddle: () => void;
  alignBottom: () => void;
  distributeHorizontally: () => void;
  distributeVertically: () => void;
  groupElements: () => void;
  ungroupElements: () => void;
  bakeSmartContainerChildTransforms: (
    slideId: string,
    smartContainerId: string,
    updates: Record<string, Transform>
  ) => void;
  reorderSmartContainerElements: (
    slideId: string,
    smartContainerId: string,
    fromIndex: number,
    toIndex: number
  ) => void;
  updateNestedElementContent: (
    slideId: string,
    elementId: string,
    content: string
  ) => void;
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;
  updateThemeColor: (slot: ThemeColorSlot, hex: string) => void;
  updateThemeFont: (
    which: "headFont" | "bodyFont",
    font: string
  ) => void;
  toggleThemeLock: () => void;
  updatePresentationTitle: (title: string) => void;
  duplicateSelectedElements: () => void;
}

function pushToPast(past: Presentation[], current: Presentation): Presentation[] {
  const next = [...past, clonePresentation(current)];
  return next.slice(-HISTORY_LIMIT);
}

/** Recursively update an element by id anywhere in the tree */
function updateElementInTree(
  elements: CanvasElement[],
  elementId: string,
  updater: (el: CanvasElement) => CanvasElement
): CanvasElement[] {
  return elements.map((el) => {
    if (el.id === elementId) return updater(el);
    if (el.type === "group" && "elements" in el) {
      return {
        ...el,
        elements: updateElementInTree(el.elements, elementId, updater),
      };
    }
    if (el.type === "smartContainer" && "elements" in el) {
      return {
        ...el,
        elements: updateElementInTree(el.elements, elementId, updater),
      };
    }
    return el;
  });
}

export const usePresentationStore = create<PresentationState>((set) => ({
  presentation: INITIAL_PRESENTATION,
  currentSlideId: INITIAL_PRESENTATION.slides[0]?.id ?? null,
  selectedElementIds: [],
  past: [],
  future: [],

  addSlide: () =>
    set((state) => {
      const newSlide: Slide = {
        id: generateId("slide"),
        layoutId: "BLANK",
        elements: [],
      };
      const next = {
        ...state.presentation,
        slides: [...state.presentation.slides, newSlide],
      };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        currentSlideId: newSlide.id,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  deleteSlide: (id) =>
    set((state) => {
      const slides = state.presentation.slides;
      const idx = slides.findIndex((s) => s.id === id);
      if (idx < 0) return state;
      const nextSlides = slides.filter((s) => s.id !== id);
      if (nextSlides.length === 0) return state;
      const next = { ...state.presentation, slides: nextSlides };
      PresentationSchema.parse(next);
      const newCurrent =
        state.currentSlideId === id
          ? nextSlides[Math.min(idx, nextSlides.length - 1)]!.id
          : state.currentSlideId;
      return {
        presentation: next,
        currentSlideId: newCurrent,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  setSlideLayout: (slideId, layoutId) =>
    set((state) => {
      const slide = state.presentation.slides.find((s) => s.id === slideId);
      if (!slide) return state;

      const template = SLIDE_REGISTRY[layoutId];
      if (!template) return state;

      const freeformElements = slide.elements.filter(
        (el) => !("placeholderRole" in el) || el.placeholderRole == null
      );
      const maxZ = freeformElements.reduce(
        (m, el) => Math.max(m, el.transform.z ?? 0),
        0
      );

      /** Deep copy template elements with fresh ids and z-offset */
      function cloneWithFreshIds(
        elements: CanvasElement[],
        zOffset: number
      ): CanvasElement[] {
        return elements.map((el) => {
          const cloned = structuredClone(el) as CanvasElement;
          cloned.id = generateId("el");
          cloned.transform = {
            ...cloned.transform,
            z: (cloned.transform.z ?? 0) + zOffset,
          };
          if ("elements" in cloned && Array.isArray(cloned.elements)) {
            cloned.elements = cloneWithFreshIds(cloned.elements, 0);
          }
          return cloned;
        });
      }

      const placeholderTemplates = cloneWithFreshIds(template.elements, maxZ + 1);

      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === slideId
          ? {
              ...s,
              layoutId,
              elements: [...freeformElements, ...placeholderTemplates],
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        selectedElementIds: [],
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  deleteSelectedElements: () =>
    set((state) => {
      if (state.selectedElementIds.length === 0 || !state.currentSlideId)
        return state;
      const slide = state.presentation.slides.find(
        (s) => s.id === state.currentSlideId
      );
      if (!slide) return state;

      const selectedIds = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      const lockedIds = new Set(
        slide.elements
          .filter((el): el is CanvasElement & { isLocked: true } =>
            "isLocked" in el && el.isLocked === true
          )
          .map((el) => el.id)
      );
      const ids = new Set([...selectedIds].filter((id) => !lockedIds.has(id)));
      if (ids.size === 0) return state;

      const next = { ...state.presentation, slides: state.presentation.slides.map((s) => {
        if (s.id !== state.currentSlideId) return s;
        return {
          ...s,
          elements: s.elements
            .map((el) => {
              if (!ids.has(el.id)) return el;
              if ("placeholderRole" in el && el.placeholderRole != null) {
                if (el.type === "text") {
                  return { ...el, content: "" };
                }
                if (el.type === "smartContainer") {
                  return { ...el, elements: [] };
                }
                return el;
              }
              return el;
            })
            .filter((el) => {
            if (!ids.has(el.id)) return true;
            return ("placeholderRole" in el && el.placeholderRole != null)
              ? true
              : false;
          }),
        };
      }) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        selectedElementIds: state.selectedElementIds.filter((sel) => {
          if (!ids.has(sel.elementId)) return true;
          const el = slide.elements.find((e) => e.id === sel.elementId);
          return el != null && "placeholderRole" in el && el.placeholderRole != null;
        }),
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  toggleElementLock: (slideId, elementId) =>
    set((state) => {
      const next = {
        ...state.presentation,
        slides: state.presentation.slides.map((slide) =>
          slide.id === slideId
            ? {
                ...slide,
                elements: updateElementInTree(slide.elements, elementId, (el) => ({
                  ...el,
                  isLocked: !("isLocked" in el && el.isLocked === true),
                })),
              }
            : slide
        ),
      };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  selectSlide: (id) =>
    set((state) => {
      const exists = state.presentation.slides.some((s) => s.id === id);
      return {
        currentSlideId: exists ? id : state.currentSlideId,
        selectedElementIds:
          state.selectedElementIds[0]?.slideId === id
            ? state.selectedElementIds
            : [],
      };
    }),

  toggleSelectElement: (slideId, elementId, shiftKey) =>
    set((state) => {
      const sel = { slideId, elementId };
      const isSelected = state.selectedElementIds.some(
        (s) => s.slideId === slideId && s.elementId === elementId
      );
      if (shiftKey) {
        if (isSelected) {
          return {
            selectedElementIds: state.selectedElementIds.filter(
              (s) => !(s.slideId === slideId && s.elementId === elementId)
            ),
          };
        }
        return {
          selectedElementIds: [...state.selectedElementIds, sel],
        };
      }
      return { selectedElementIds: isSelected ? state.selectedElementIds : [sel] };
    }),

  clearSelection: () => set({ selectedElementIds: [] }),

  updateElement: (slideId, elementId, newTransform) =>
    set((state) => {
      const next = { ...state.presentation, slides: state.presentation.slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map((el) =>
                el.id === elementId ? { ...el, transform: newTransform } : el
              ),
            }
          : slide
      ) };
      PresentationSchema.parse(next);
      return { presentation: next };
    }),

  updateElementContent: (slideId, elementId, content) =>
    set((state) => {
      const next = { ...state.presentation, slides: state.presentation.slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              elements: slide.elements.map((el) =>
                el.type === "text" && el.id === elementId
                  ? { ...el, content }
                  : el
              ),
            }
          : slide
      ) };
      PresentationSchema.parse(next);
      return { presentation: next };
    }),

  updateChartElementData: (slideId, elementId, data) =>
    set((state) => {
      const next = { ...state.presentation, slides: state.presentation.slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              elements: updateElementInTree(slide.elements, elementId, (el) =>
                el.type === "chart" && el.id === elementId
                  ? { ...el, data }
                  : el
              ),
            }
          : slide
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  addElement: (slideId, element) =>
    set((state) => {
      const maxZ = state.presentation.slides
        .flatMap((s) => s.elements)
        .reduce((m, el) => Math.max(m, el.transform.z ?? 0), -1);
      const el = {
        ...element,
        id: element.id || generateId("el"),
        transform: {
          ...element.transform,
          z: maxZ + 1,
        },
      };
      const next = { ...state.presentation, slides: state.presentation.slides.map((slide) =>
        slide.id === slideId
          ? { ...slide, elements: [...slide.elements, el] }
          : slide
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  bringForward: () =>
    set((state) => {
      if (state.selectedElementIds.length === 0) return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      if (ids.size === 0) return state;
      const next = { ...state.presentation, slides: state.presentation.slides.map((slide) =>
        slide.id === state.currentSlideId
          ? {
              ...slide,
              elements: slide.elements.map((e) =>
                ids.has(e.id)
                  ? {
                      ...e,
                      transform: {
                        ...e.transform,
                        z: (e.transform.z ?? 0) + 1,
                      },
                    }
                  : e
              ),
            }
          : slide
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  sendBackward: () =>
    set((state) => {
      if (state.selectedElementIds.length === 0) return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      if (ids.size === 0) return state;
      const next = { ...state.presentation, slides: state.presentation.slides.map((slide) =>
        slide.id === state.currentSlideId
          ? {
              ...slide,
              elements: slide.elements.map((e) =>
                ids.has(e.id)
                  ? {
                      ...e,
                      transform: {
                        ...e.transform,
                        z: Math.max(0, (e.transform.z ?? 0) - 1),
                      },
                    }
                  : e
              ),
            }
          : slide
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  alignLeft: () =>
    set((state) => {
      if (state.selectedElementIds.length < 2 || !state.currentSlideId)
        return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      const slide = state.presentation.slides.find((s) => s.id === state.currentSlideId);
      const elements = slide?.elements.filter((e) => ids.has(e.id)) ?? [];
      const minX = Math.min(...elements.map((e) => e.transform.x));
      const updates = Object.fromEntries(
        elements.map((e) => [e.id, { ...e.transform, x: minX }])
      );
      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? {
              ...s,
              elements: s.elements.map((e) =>
                e.id in updates ? { ...e, transform: updates[e.id]! } : e
              ),
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  alignCenter: () =>
    set((state) => {
      if (state.selectedElementIds.length < 2 || !state.currentSlideId)
        return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      const slide = state.presentation.slides.find((s) => s.id === state.currentSlideId);
      const elements = slide?.elements.filter((e) => ids.has(e.id)) ?? [];
      const minX = Math.min(...elements.map((e) => e.transform.x));
      const maxRight = Math.max(
        ...elements.map((e) => e.transform.x + e.transform.w)
      );
      const centerX = (minX + maxRight) / 2;
      const updates = Object.fromEntries(
        elements.map((e) => [
          e.id,
          { ...e.transform, x: Math.max(0, centerX - e.transform.w / 2) },
        ])
      );
      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? {
              ...s,
              elements: s.elements.map((e) =>
                e.id in updates ? { ...e, transform: updates[e.id]! } : e
              ),
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  alignRight: () =>
    set((state) => {
      if (state.selectedElementIds.length < 2 || !state.currentSlideId)
        return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      const slide = state.presentation.slides.find((s) => s.id === state.currentSlideId);
      const elements = slide?.elements.filter((e) => ids.has(e.id)) ?? [];
      const maxRight = Math.max(
        ...elements.map((e) => e.transform.x + e.transform.w)
      );
      const updates = Object.fromEntries(
        elements.map((e) => [
          e.id,
          { ...e.transform, x: Math.min(1 - e.transform.w, maxRight - e.transform.w) },
        ])
      );
      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? {
              ...s,
              elements: s.elements.map((e) =>
                e.id in updates ? { ...e, transform: updates[e.id]! } : e
              ),
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  alignTop: () =>
    set((state) => {
      if (state.selectedElementIds.length < 2 || !state.currentSlideId)
        return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      const slide = state.presentation.slides.find((s) => s.id === state.currentSlideId);
      const elements = slide?.elements.filter((e) => ids.has(e.id)) ?? [];
      const minY = Math.min(...elements.map((e) => e.transform.y));
      const updates = Object.fromEntries(
        elements.map((e) => [e.id, { ...e.transform, y: minY }])
      );
      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? {
              ...s,
              elements: s.elements.map((e) =>
                e.id in updates ? { ...e, transform: updates[e.id]! } : e
              ),
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  alignMiddle: () =>
    set((state) => {
      if (state.selectedElementIds.length < 2 || !state.currentSlideId)
        return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      const slide = state.presentation.slides.find((s) => s.id === state.currentSlideId);
      const elements = slide?.elements.filter((e) => ids.has(e.id)) ?? [];
      const minY = Math.min(...elements.map((e) => e.transform.y));
      const maxBottom = Math.max(
        ...elements.map((e) => e.transform.y + e.transform.h)
      );
      const centerY = (minY + maxBottom) / 2;
      const updates = Object.fromEntries(
        elements.map((e) => [
          e.id,
          { ...e.transform, y: Math.max(0, centerY - e.transform.h / 2) },
        ])
      );
      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? {
              ...s,
              elements: s.elements.map((e) =>
                e.id in updates ? { ...e, transform: updates[e.id]! } : e
              ),
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  alignBottom: () =>
    set((state) => {
      if (state.selectedElementIds.length < 2 || !state.currentSlideId)
        return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      const slide = state.presentation.slides.find((s) => s.id === state.currentSlideId);
      const elements = slide?.elements.filter((e) => ids.has(e.id)) ?? [];
      const maxBottom = Math.max(
        ...elements.map((e) => e.transform.y + e.transform.h)
      );
      const updates = Object.fromEntries(
        elements.map((e) => [
          e.id,
          {
            ...e.transform,
            y: Math.min(1 - e.transform.h, maxBottom - e.transform.h),
          },
        ])
      );
      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? {
              ...s,
              elements: s.elements.map((e) =>
                e.id in updates ? { ...e, transform: updates[e.id]! } : e
              ),
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  distributeHorizontally: () =>
    set((state) => {
      if (state.selectedElementIds.length < 3 || !state.currentSlideId)
        return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      const slide = state.presentation.slides.find((s) => s.id === state.currentSlideId);
      const elements = slide?.elements
        .filter((e) => ids.has(e.id))
        .sort((a, b) => a.transform.x - b.transform.x);
      if (!elements || elements.length < 3) return state;
      const leftMost = elements[0]!.transform.x;
      const rightMost =
        elements[elements.length - 1]!.transform.x +
        elements[elements.length - 1]!.transform.w;
      const totalW = elements.reduce((s, e) => s + e.transform.w, 0);
      const totalGap = rightMost - leftMost - totalW;
      const gap = totalGap / (elements.length - 1);
      const updates: Record<string, Transform> = {};
      let x = leftMost;
      for (const e of elements) {
        updates[e.id] = { ...e.transform, x: Math.max(0, Math.min(1 - e.transform.w, x)) };
        x += e.transform.w + gap;
      }
      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? {
              ...s,
              elements: s.elements.map((e) =>
                e.id in updates ? { ...e, transform: updates[e.id]! } : e
              ),
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  distributeVertically: () =>
    set((state) => {
      if (state.selectedElementIds.length < 3 || !state.currentSlideId)
        return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      const slide = state.presentation.slides.find((s) => s.id === state.currentSlideId);
      const elements = slide?.elements
        .filter((e) => ids.has(e.id))
        .sort((a, b) => a.transform.y - b.transform.y);
      if (!elements || elements.length < 3) return state;
      const topMost = elements[0]!.transform.y;
      const bottomMost =
        elements[elements.length - 1]!.transform.y +
        elements[elements.length - 1]!.transform.h;
      const totalH = elements.reduce((s, e) => s + e.transform.h, 0);
      const totalGap = bottomMost - topMost - totalH;
      const gap = totalGap / (elements.length - 1);
      const updates: Record<string, Transform> = {};
      let y = topMost;
      for (const e of elements) {
        updates[e.id] = { ...e.transform, y: Math.max(0, Math.min(1 - e.transform.h, y)) };
        y += e.transform.h + gap;
      }
      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? {
              ...s,
              elements: s.elements.map((e) =>
                e.id in updates ? { ...e, transform: updates[e.id]! } : e
              ),
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  groupElements: () =>
    set((state) => {
      if (state.selectedElementIds.length < 2 || !state.currentSlideId)
        return state;
      const ids = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      const slide = state.presentation.slides.find((s) => s.id === state.currentSlideId);
      const toGroup = slide?.elements.filter((e) => ids.has(e.id)) ?? [];
      if (toGroup.length < 2) return state;

      const minX = Math.min(...toGroup.map((e) => e.transform.x));
      const minY = Math.min(...toGroup.map((e) => e.transform.y));
      const maxRight = Math.max(
        ...toGroup.map((e) => e.transform.x + e.transform.w)
      );
      const maxBottom = Math.max(
        ...toGroup.map((e) => e.transform.y + e.transform.h)
      );
      const gW = maxRight - minX;
      const gH = maxBottom - minY;

      const groupChildren: CanvasElement[] = toGroup.map((el) => {
        const t = el.transform;
        return {
          ...el,
          transform: {
            x: (t.x - minX) / gW,
            y: (t.y - minY) / gH,
            w: t.w / gW,
            h: t.h / gH,
            z: t.z ?? 0,
          },
        };
      });

      const maxZ = Math.max(
        ...toGroup.map((e) => e.transform.z ?? 0)
      );
      const group: CanvasElement = {
        id: generateId("group"),
        type: "group",
        transform: {
          x: minX,
          y: minY,
          w: gW,
          h: gH,
          z: maxZ,
        },
        elements: groupChildren,
      };

      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? {
              ...s,
              elements: [
                ...s.elements.filter((e) => !ids.has(e.id)),
                group,
              ],
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        selectedElementIds: [
          { slideId: state.currentSlideId, elementId: group.id },
        ],
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  ungroupElements: () =>
    set((state) => {
      if (state.selectedElementIds.length !== 1 || !state.currentSlideId)
        return state;
      const elementId = state.selectedElementIds[0]!.elementId;
      const slide = state.presentation.slides.find((s) => s.id === state.currentSlideId);
      const group = slide?.elements.find(
        (e): e is CanvasElement & { type: "group" } =>
          e.id === elementId && e.type === "group"
      );
      if (!group) return state;

      const g = group.transform;
      const ungrouped: CanvasElement[] = group.elements.map((el: CanvasElement) => {
        const t = el.transform;
        return {
          ...el,
          transform: {
            x: g.x + t.x * g.w,
            y: g.y + t.y * g.h,
            w: t.w * g.w,
            h: t.h * g.h,
            z: t.z ?? 0,
          },
        };
      });

      const next = { ...state.presentation, slides: state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? {
              ...s,
              elements: [
                ...s.elements.filter((e) => e.id !== group.id),
                ...ungrouped,
              ],
            }
          : s
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        selectedElementIds: ungrouped.map((el) => ({
          slideId: state.currentSlideId!,
          elementId: el.id,
        })),
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  bakeSmartContainerChildTransforms: (slideId, smartContainerId, updates) =>
    set((state) => {
      const next = { ...state.presentation, slides: state.presentation.slides.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          elements: updateElementInTree(slide.elements, smartContainerId, (el) => {
            if (el.type !== "smartContainer") return el;
            return {
              ...el,
              elements: el.elements.map((child) =>
                child.id in updates
                  ? { ...child, transform: updates[child.id]! }
                  : child
              ),
            };
          }),
        };
      }) };
      PresentationSchema.parse(next);
      return { presentation: next };
    }),

  reorderSmartContainerElements: (slideId, smartContainerId, fromIndex, toIndex) =>
    set((state) => {
      if (fromIndex === toIndex) return state;
      const next = { ...state.presentation, slides: state.presentation.slides.map((slide) => {
        if (slide.id !== slideId) return slide;
        return {
          ...slide,
          elements: updateElementInTree(slide.elements, smartContainerId, (el) => {
            if (el.type !== "smartContainer") return el;
            const arr = [...el.elements];
            const [removed] = arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, removed);
            return { ...el, elements: arr };
          }),
        };
      }) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  updateNestedElementContent: (slideId, elementId, content) =>
    set((state) => {
      const next = { ...state.presentation, slides: state.presentation.slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              elements: updateElementInTree(slide.elements, elementId, (el) =>
                el.type === "text"
                  ? { ...el, content }
                  : el
              ),
            }
          : slide
      ) };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  commitHistory: () =>
    set((state) => ({
      past: pushToPast(state.past, state.presentation),
      future: [],
    })),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1]!;
      const validated = PresentationSchema.parse(clonePresentation(previous));
      const stillExist = state.selectedElementIds.filter((sel) => {
        const slide = validated.slides.find((s: Slide) => s.id === sel.slideId);
        return slide?.elements.some((e: CanvasElement) => e.id === sel.elementId);
      });
      return {
        presentation: validated,
        past: state.past.slice(0, -1),
        future: [clonePresentation(state.presentation), ...state.future],
        selectedElementIds: stillExist,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0]!;
      const validated = PresentationSchema.parse(clonePresentation(next));
      const stillExist = state.selectedElementIds.filter((sel) => {
        const slide = validated.slides.find((s: Slide) => s.id === sel.slideId);
        return slide?.elements.some((e: CanvasElement) => e.id === sel.elementId);
      });
      return {
        presentation: validated,
        past: pushToPast(state.past, state.presentation),
        future: state.future.slice(1),
        selectedElementIds: stillExist,
      };
    }),

  updateThemeColor: (slot, hex) =>
    set((state) => {
      if (state.presentation.isThemeLocked) return state;
      const next = {
        ...state.presentation,
        theme: {
          ...state.presentation.theme,
          colorScheme: {
            ...state.presentation.theme.colorScheme,
            [slot]: hex.startsWith("#") ? hex : `#${hex}`,
          },
        },
      };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  updateThemeFont: (which, font) =>
    set((state) => {
      if (state.presentation.isThemeLocked) return state;
      const next = {
        ...state.presentation,
        theme: {
          ...state.presentation.theme,
          fontScheme: {
            ...state.presentation.theme.fontScheme,
            [which]: font,
          },
        },
      };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  toggleThemeLock: () =>
    set((state) => {
      const next = {
        ...state.presentation,
        isThemeLocked: !(state.presentation.isThemeLocked ?? false),
      };
      PresentationSchema.parse(next);
      return {
        presentation: next,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),

  updatePresentationTitle: (title) =>
    set((state) => {
      const next = { ...state.presentation, title };
      PresentationSchema.parse(next);
      return { presentation: next };
    }),

  duplicateSelectedElements: () =>
    set((state) => {
      if (state.selectedElementIds.length === 0 || !state.currentSlideId)
        return state;
      const slide = state.presentation.slides.find(
        (s) => s.id === state.currentSlideId
      );
      if (!slide) return state;
      const selectedIds = new Set(
        state.selectedElementIds
          .filter((s) => s.slideId === state.currentSlideId)
          .map((s) => s.elementId)
      );
      if (selectedIds.size === 0) return state;

      function cloneWithFreshIds(el: CanvasElement): CanvasElement {
        const id = generateId("el");
        if (el.type === "group" && "elements" in el) {
          return {
            ...el,
            id,
            elements: el.elements.map(cloneWithFreshIds),
          };
        }
        if (el.type === "smartContainer" && "elements" in el) {
          return {
            ...el,
            id,
            elements: el.elements.map(cloneWithFreshIds),
          };
        }
        return { ...el, id };
      }

      const maxZ = slide.elements.reduce(
        (m, el) => Math.max(m, el.transform.z ?? 0),
        -1
      );
      const toAdd = slide.elements
        .filter((e) => selectedIds.has(e.id))
        .map((el) => {
          const cloned = cloneWithFreshIds(el);
          return {
            ...cloned,
            transform: {
              ...cloned.transform,
              z: (cloned.transform.z ?? 0) + maxZ + 1,
            },
          };
        });

      const nextSlides = state.presentation.slides.map((s) =>
        s.id === state.currentSlideId
          ? { ...s, elements: [...s.elements, ...toAdd] }
          : s
      );
      const next = { ...state.presentation, slides: nextSlides };
      PresentationSchema.parse(next);
      const newSelection = toAdd.map((el) => ({
        slideId: state.currentSlideId!,
        elementId: el.id,
      }));
      return {
        presentation: next,
        selectedElementIds: newSelection,
        past: pushToPast(state.past, state.presentation),
        future: [],
      };
    }),
}));
