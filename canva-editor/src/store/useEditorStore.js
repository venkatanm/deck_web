import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_CANVAS_SIZE } from '../utils/defaults';
import { getAllImages } from '../utils/imageStorage';

const MAX_HISTORY = 50;

const clonePages = (pages) => JSON.parse(JSON.stringify(pages));

let snapshotTimer = null;
let pendingSnapshot = null;

const useEditorStore = create((set, get) => ({
  pages: [{ id: 'page-1', elements: [] }],
  currentPageId: 'page-1',
  selectedId: null,
  selectedIds: [],
  canvasSize: { ...DEFAULT_CANVAS_SIZE },
  zoom: 1,
  showGrid: false,
  showRulers: false,
  snapEnabled: true,
  showShortcuts: false,
  drawMode: false,
  drawColor: '#1e293b',
  drawSize: 4,
  drawOpacity: 1,
  croppingId: null,
  lastSaved: null,
  title: 'Untitled Design',
  presentMode: false,
  presentPageIndex: 0,
  shareId: uuidv4(),
  history: [],
  future: [],
  clipboardStyle: null,
  clipboardElement: null,

  // ── Selectors ──────────────────────────────
  getCurrentElements: () => {
    const { pages, currentPageId } = get();
    return pages.find(p => p.id === currentPageId)?.elements || [];
  },

  getSelectedElement: () => {
    const { pages, currentPageId, selectedId } = get();
    const elements = pages.find(p => p.id === currentPageId)?.elements || [];
    return elements.find(e => e.id === selectedId) || null;
  },

  // ── History helpers ────────────────────────
  _snapshot: (force = false) => {
    const { pages } = get();
    pendingSnapshot = clonePages(pages);
    if (force) {
      const { history } = get();
      const newHistory = [...history, pendingSnapshot];
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      set({ history: newHistory, future: [] });
      pendingSnapshot = null;
      return;
    }
    clearTimeout(snapshotTimer);
    snapshotTimer = setTimeout(() => {
      if (!pendingSnapshot) return;
      const { history } = get();
      const newHistory = [...history, pendingSnapshot];
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      set({ history: newHistory, future: [] });
      pendingSnapshot = null;
    }, 300);
  },

  // ── Selection ──────────────────────────────
  setSelectedId: (id) => set({
    selectedId: id,
    selectedIds: id ? [id] : [],
  }),
  setSelectedIds: (ids) => set({
    selectedIds: ids,
    selectedId: ids.length === 1 ? ids[0] : null,
  }),
  toggleSelectedId: (id) => {
    const { selectedIds } = get();
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    set({
      selectedIds: newIds,
      selectedId: newIds.length === 1 ? newIds[0] : null,
    });
  },
  clearSelection: () => set({ selectedIds: [], selectedId: null }),
  deleteSelected: () => {
    const { selectedIds } = get();
    if (!selectedIds.length) return;
    get()._snapshot(true);
    const { pages, currentPageId } = get();
    set({
      pages: pages.map(p =>
        p.id === currentPageId
          ? { ...p, elements: p.elements.filter(e => !selectedIds.includes(e.id)) }
          : p
      ),
      selectedIds: [],
      selectedId: null,
    });
  },
  groupSelected: () => {
    const { selectedIds, pages, currentPageId } = get();
    if (selectedIds.length < 2) return;
    get()._snapshot(true);

    const page = pages.find(p => p.id === currentPageId);
    const selected = page.elements.filter(e => selectedIds.includes(e.id));

    const minX = Math.min(...selected.map(e => e.x));
    const minY = Math.min(...selected.map(e => e.y));
    const maxX = Math.max(...selected.map(e => e.x + (e.width || 0)));
    const maxY = Math.max(...selected.map(e => e.y + (e.height || 0)));

    const groupEl = {
      id: uuidv4(),
      type: 'group',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0,
      opacity: 1,
      children: selected.map(el => ({
        ...JSON.parse(JSON.stringify(el)),
        id: uuidv4(),
        x: el.x - minX,
        y: el.y - minY,
      })),
    };

    set({
      pages: pages.map(p =>
        p.id === currentPageId ? {
          ...p,
          elements: [
            ...p.elements.filter(e => !selectedIds.includes(e.id)),
            groupEl,
          ],
        } : p
      ),
      selectedIds: [groupEl.id],
      selectedId: groupEl.id,
    });
  },
  ungroupSelected: () => {
    const { selectedId, pages, currentPageId } = get();
    if (!selectedId) return;
    get()._snapshot();

    const page = pages.find(p => p.id === currentPageId);
    const groupEl = page.elements.find(e => e.id === selectedId);
    if (!groupEl || groupEl.type !== 'group') return;

    const children = groupEl.children.map(child => ({
      ...child,
      id: uuidv4(),
      x: groupEl.x + child.x,
      y: groupEl.y + child.y,
    }));

    const newIds = children.map(c => c.id);

    set({
      pages: pages.map(p =>
        p.id === currentPageId ? {
          ...p,
          elements: [
            ...p.elements.filter(e => e.id !== selectedId),
            ...children,
          ],
        } : p
      ),
      selectedIds: newIds,
      selectedId: null,
    });
  },
  duplicateSelected: () => {
    const { selectedIds, pages, currentPageId } = get();
    if (!selectedIds.length) return;
    get()._snapshot();

    const page = pages.find(p => p.id === currentPageId);
    const selected = page.elements.filter(e => selectedIds.includes(e.id));
    const copies = selected.map(el => ({
      ...JSON.parse(JSON.stringify(el)),
      id: uuidv4(),
      x: el.x + 20,
      y: el.y + 20,
    }));
    const newIds = copies.map(c => c.id);

    set({
      pages: pages.map(p =>
        p.id === currentPageId
          ? { ...p, elements: [...p.elements, ...copies] }
          : p
      ),
      selectedIds: newIds,
      selectedId: newIds.length === 1 ? newIds[0] : null,
    });
  },
  moveSelected: (dx, dy) => {
    const { selectedIds } = get();
    if (!selectedIds.length) return;
    get()._snapshot();
    const { pages, currentPageId } = get();
    set({
      pages: pages.map(p =>
        p.id === currentPageId ? {
          ...p,
          elements: p.elements.map(e =>
            selectedIds.includes(e.id)
              ? { ...e, x: e.x + dx, y: e.y + dy }
              : e
          ),
        } : p
      ),
    });
  },

  // ── Element CRUD ───────────────────────────
  addElement: (elementProps) => {
    get()._snapshot();
    const { pages, currentPageId } = get();
    const newElement = { ...elementProps, id: uuidv4() };
    set({
      pages: pages.map(p =>
        p.id === currentPageId
          ? { ...p, elements: [...p.elements, newElement] }
          : p
      ),
      selectedId: newElement.id,
      selectedIds: [newElement.id],
    });
  },

  updateElement: (id, props) => {
    get()._snapshot();
    const { pages, currentPageId } = get();
    set({
      pages: pages.map(p =>
        p.id === currentPageId
          ? { ...p, elements: p.elements.map(e => e.id === id ? { ...e, ...props } : e) }
          : p
      ),
    });
  },

  deleteElement: (id) => {
    get()._snapshot(true);
    const { pages, currentPageId, selectedIds } = get();
    set({
      pages: pages.map(p =>
        p.id === currentPageId
          ? { ...p, elements: p.elements.filter(e => e.id !== id) }
          : p
      ),
      selectedId: get().selectedId === id ? null : get().selectedId,
      selectedIds: selectedIds.filter(i => i !== id),
    });
  },

  duplicateElement: (id) => {
    const { pages, currentPageId } = get();
    const elements = pages.find(p => p.id === currentPageId)?.elements || [];
    const el = elements.find(e => e.id === id);
    if (!el) return;
    get().addElement({ ...JSON.parse(JSON.stringify(el)), x: el.x + 20, y: el.y + 20 });
  },

  // ── Layer ordering ─────────────────────────
  _reorder: (id, fn) => {
    get()._snapshot();
    const { pages, currentPageId } = get();
    set({
      pages: pages.map(p => {
        if (p.id !== currentPageId) return p;
        const els = [...p.elements];
        const idx = els.findIndex(e => e.id === id);
        if (idx === -1) return p;
        return { ...p, elements: fn(els, idx) };
      }),
    });
  },

  moveElementUp:   (id) => get()._reorder(id, (els, i) => {
    if (i >= els.length - 1) return els;
    [els[i], els[i+1]] = [els[i+1], els[i]]; return els;
  }),
  moveElementDown: (id) => get()._reorder(id, (els, i) => {
    if (i <= 0) return els;
    [els[i], els[i-1]] = [els[i-1], els[i]]; return els;
  }),
  reorderElements: (startIndex, endIndex) => {
    get()._snapshot();
    const { pages, currentPageId } = get();
    set({
      pages: pages.map((p) => {
        if (p.id !== currentPageId) return p;
        const els = [...p.elements];
        const len = els.length;
        const realStart = len - 1 - startIndex;
        const realEnd = len - 1 - endIndex;
        const [removed] = els.splice(realStart, 1);
        els.splice(realEnd, 0, removed);
        return { ...p, elements: els };
      }),
    });
  },
  bringToFront:    (id) => get()._reorder(id, (els, i) => {
    const [el] = els.splice(i, 1); els.push(el); return els;
  }),
  sendToBack:      (id) => get()._reorder(id, (els, i) => {
    const [el] = els.splice(i, 1); els.unshift(el); return els;
  }),

  // ── Clipboard style ────────────────────────
  copyStyle: (id) => {
    const el = get().getSelectedElement();
    if (!el) return;
    const { fill, stroke, strokeWidth, fontSize, fontFamily,
            fontStyle, opacity, cornerRadius } = el;
    set({ clipboardStyle: { fill, stroke, strokeWidth, fontSize,
                            fontFamily, fontStyle, opacity, cornerRadius } });
  },

  pasteStyle: (id) => {
    const { clipboardStyle } = get();
    if (!clipboardStyle || !id) return;
    get().updateElement(id, clipboardStyle);
  },

  // ── Copy/paste element ─────────────────────
  copyElement: (id) => {
    const { pages, currentPageId } = get();
    const elements = pages.find(p => p.id === currentPageId)?.elements || [];
    const el = elements.find(e => e.id === id);
    if (el) set({ clipboardElement: JSON.parse(JSON.stringify(el)) });
  },

  pasteElement: () => {
    const { clipboardElement } = get();
    if (!clipboardElement) return;
    get().addElement({ ...clipboardElement, x: clipboardElement.x + 20, y: clipboardElement.y + 20 });
  },

  // ── Undo / Redo ────────────────────────────
  undo: () => {
    const { history, pages, future } = get();
    if (!history.length) return;
    const prev = history[history.length - 1];
    set({
      pages: prev,
      history: history.slice(0, -1),
      future: [clonePages(pages), ...future],
      selectedId: null,
      selectedIds: [],
    });
  },

  redo: () => {
    const { future, pages, history } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      pages: next,
      history: [...history, clonePages(pages)],
      future: future.slice(1),
      selectedId: null,
      selectedIds: [],
    });
  },

  // ── Canvas ─────────────────────────────────
  setCanvasSize: (size) => set({ canvasSize: { ...get().canvasSize, ...size } }),
  setBackgroundColor: (color) => set({ canvasSize: { ...get().canvasSize, backgroundColor: color } }),
  setZoom: (z) => set({ zoom: Math.min(3, Math.max(0.25, z)) }),
  zoomIn: () => get().setZoom(Math.round((get().zoom + 0.1) * 10) / 10),
  zoomOut: () => get().setZoom(Math.round((get().zoom - 0.1) * 10) / 10),
  fitToScreen: () => {
    const { canvasSize } = get();
    const padding = 80;
    const zoomX = (window.innerWidth - 400) / canvasSize.width;
    const zoomY = (window.innerHeight - 160) / canvasSize.height;
    get().setZoom(Math.min(zoomX, zoomY, 1));
  },
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  setShowShortcuts: (v) => set({ showShortcuts: v }),
  setDrawMode: (val) => set({ drawMode: val }),
  setDrawColor: (c) => set({ drawColor: c }),
  setDrawSize: (s) => set({ drawSize: s }),
  setCroppingId: (id) => set({ croppingId: id }),
  setLastSaved: (ts) => set({ lastSaved: ts }),
  applyCrop: (id, cropRect) => {
    const { pages, currentPageId } = get();
    const page = pages.find(p => p.id === currentPageId);
    const el = page?.elements.find(e => e.id === id);
    if (!el) return;
    get().updateElement(id, {
      cropX: cropRect.x,
      cropY: cropRect.y,
      cropWidth: cropRect.width,
      cropHeight: cropRect.height,
      width: cropRect.width,
      height: cropRect.height,
      originalWidth: el.originalWidth || el.width,
      originalHeight: el.originalHeight || el.height,
    });
    set({ croppingId: null });
  },

  // ── Pages ──────────────────────────────────
  addPage: () => {
    const { pages } = get();
    const newPage = { id: uuidv4(), elements: [] };
    set({ pages: [...pages, newPage], currentPageId: newPage.id, selectedId: null, selectedIds: [] });
  },

  deletePage: (id) => {
    const { pages, currentPageId } = get();
    if (pages.length === 1) return;
    const idx = pages.findIndex(p => p.id === id);
    const newPages = pages.filter(p => p.id !== id);
    const newCurrentId = currentPageId === id
      ? (newPages[Math.min(idx, newPages.length - 1)]?.id ?? newPages[0].id)
      : currentPageId;
    set({ pages: newPages, currentPageId: newCurrentId, selectedId: null, selectedIds: [] });
  },

  setCurrentPage: (id) => set({ currentPageId: id, selectedId: null, selectedIds: [] }),

  setTitle: (title) => set({ title }),

  duplicatePage: (id) => {
    const { pages } = get();
    const page = pages.find(p => p.id === id);
    if (!page) return;
    const newPage = {
      id: uuidv4(),
      elements: JSON.parse(JSON.stringify(page.elements)).map(el => ({
        ...el,
        id: uuidv4(),
      })),
    };
    const idx = pages.findIndex(p => p.id === id);
    const newPages = [...pages];
    newPages.splice(idx + 1, 0, newPage);
    set({ pages: newPages, currentPageId: newPage.id, selectedId: null, selectedIds: [] });
  },

  reorderPages: (startIndex, endIndex) => {
    const { pages } = get();
    const result = Array.from(pages);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    set({ pages: result });
  },

  setPresentMode: (val) => {
    if (val) {
      const { pages, currentPageId } = get();
      const idx = pages.findIndex(p => p.id === currentPageId);
      set({ presentMode: true, presentPageIndex: idx >= 0 ? idx : 0 });
    } else {
      set({ presentMode: false });
    }
  },
  setPresentPageIndex: (i) => set({ presentPageIndex: i }),

  // ── Project save/load ──────────────────────
  saveProject: (name) => {
    const { pages, canvasSize } = get();
    const projects = JSON.parse(localStorage.getItem('canva_projects') || '[]');
    const pagesToSave = clonePages(pages).map(p => ({
      ...p,
      elements: p.elements.map(el =>
        el.type === 'image'
          ? { ...el, src: '' }
          : el
      ),
    }));
    const project = { id: uuidv4(), name, pages: pagesToSave, canvasSize, savedAt: new Date().toISOString() };
    localStorage.setItem('canva_projects', JSON.stringify([...projects, project]));
    return project;
  },

  loadProject: async (project) => {
    const allImages = await getAllImages();
    const imageMap = Object.fromEntries(allImages.map(i => [i.id, i.src]));
    const resolvedPages = project.pages.map(p => ({
      ...p,
      elements: p.elements.map(el =>
        el.type === 'image' && el.imageId
          ? { ...el, src: imageMap[el.imageId] || '' }
          : el
      ),
    }));
    set({ pages: resolvedPages, canvasSize: project.canvasSize, currentPageId: project.pages[0].id, selectedId: null, selectedIds: [], history: [], future: [], title: project.name || 'Untitled Design' });
  },
}));

export default useEditorStore;
