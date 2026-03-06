import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_CANVAS_SIZE } from '../utils/defaults';
import { debounce } from '../utils/debounce';

const MAX_HISTORY = 50;

// Clone pages for undo - strip image src to avoid cloning megabytes
function clonePagesForHistory(pages) {
  if (!pages || !Array.isArray(pages)) return [];
  return pages.map((p) => ({
    ...p,
    elements: (p.elements || []).map((el) => {
      if (el.type === 'image' && el.src) {
        return { ...el, src: null };
      }
      return { ...el };
    }),
  }));
}

const clonePages = (pages) => JSON.parse(JSON.stringify(pages));

const debouncedSaveBrandKit = debounce(async (kit) => {
  try {
    const { saveBrandKit } = await import('../api/brandKit');
    await saveBrandKit({
      colors: kit.colors || [],
      fonts: kit.fonts || [],
      logo_urls: [{ logos: kit.logos || [], brandIcons: kit.brandIcons || [] }],
    });
  } catch (e) {
    console.warn('Brand kit save failed', e);
  }
}, 2000);

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

  // Pipeline stream state
  pipelineStream: {
    status: 'idle',
    slideCount: 0,
    totalSlides: 0,
    title: '',
    error: null,
  },
  setPipelineStream: (updates) =>
    set((s) => ({
      pipelineStream: { ...s.pipelineStream, ...updates },
    })),
  resetPipelineStream: () =>
    set({
      pipelineStream: {
        status: 'idle',
        slideCount: 0,
        totalSlides: 0,
        title: '',
        error: null,
      },
    }),

  clipboardStyle: null,
  clipboardElement: null,
  connectionFromId: null,
  _isTextEditing: false,
  pageThumbnails: {},

  setConnectionFrom: (id) => set({ connectionFromId: id }),
  setTextEditing: (val) => set({ _isTextEditing: val }),
  setPageThumbnail: (pageId, dataUrl) =>
    set((s) => ({
      pageThumbnails: { ...s.pageThumbnails, [pageId]: dataUrl },
    })),
  clearConnectionFrom: () => set({ connectionFromId: null }),

  // ── Selectors ──────────────────────────────
  getCurrentElements: () => {
    const { pages, currentPageId } = get();
    return (pages || []).find(p => p.id === currentPageId)?.elements || [];
  },

  getSelectedElement: () => {
    const { pages, currentPageId, selectedId } = get();
    const elements = (pages || []).find(p => p.id === currentPageId)?.elements || [];
    return elements.find(e => e.id === selectedId) || null;
  },

  // ── History helpers ────────────────────────
  _snapshot: (force = false) => {
    const { _isTextEditing, pages, history } = get();
    if (_isTextEditing && !force) return;
    const snapshot = clonePagesForHistory(pages);
    const newHistory = [...history.slice(-(MAX_HISTORY - 1)), snapshot];
    set({ history: newHistory, future: [] });
  },
  commitTextSnapshot: () => {
    const { pages, history } = get();
    const snapshot = clonePagesForHistory(pages);
    const newHistory = [...history.slice(-(MAX_HISTORY - 1)), snapshot];
    set({ _isTextEditing: false, history: newHistory, future: [] });
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
  clearSelection: () => {
    const { selectedIds, selectedId } = get();
    if (!selectedIds.length && !selectedId) return;
    set({ selectedIds: [], selectedId: null });
  },
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

    const page = (pages || []).find(p => p.id === currentPageId);
    if (!page) return;
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

    const page = (pages || []).find(p => p.id === currentPageId);
    if (!page) return;
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

    const page = (pages || []).find(p => p.id === currentPageId);
    if (!page) return;
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
          ? { ...p, elements: [...(Array.isArray(p.elements) ? p.elements : []), newElement] }
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
    const elements = (pages || []).find(p => p.id === currentPageId)?.elements || [];
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
    const elements = (pages || []).find(p => p.id === currentPageId)?.elements || [];
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
      future: [clonePagesForHistory(pages), ...future],
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
      history: [...history, clonePagesForHistory(pages)],
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
    const page = (pages || []).find(p => p.id === currentPageId);
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
  addPage: (page) => {
    const { pages } = get();
    const pagesList = pages || [];

    // Guard: ignore if called with a non-page
    // argument such as a DOM event object.
    // A valid page must be a plain object with
    // an id string and an elements array.
    const isValidPage = (p) =>
      p &&
      typeof p === 'object' &&
      typeof p.id === 'string' &&
      Array.isArray(p.elements);

    if (isValidPage(page)) {
      // Called with a real page object (e.g. from
      // a programmatic page-insert flow). Add it
      // and switch to it.
      set({
        pages: [...pagesList, page],
        currentPageId: page.id,
        selectedId: null,
        selectedIds: [],
      });
    } else {
      // Called with no argument or an event object.
      // Create a blank page and switch to it.
      const newPage = { id: uuidv4(), elements: [] };
      set({
        pages: [...pagesList, newPage],
        currentPageId: newPage.id,
        selectedId: null,
        selectedIds: [],
      });
    }
  },

  deletePage: (id) => {
    const { pages, currentPageId } = get();
    const pagesList = pages || [];
    if (pagesList.length === 1) return;
    const idx = pagesList.findIndex(p => p.id === id);
    const newPages = pagesList.filter(p => p.id !== id);
    const newCurrentId = currentPageId === id
      ? (newPages[Math.min(idx, newPages.length - 1)]?.id ?? newPages[0].id)
      : currentPageId;
    set({ pages: newPages, currentPageId: newCurrentId, selectedId: null, selectedIds: [] });
  },

  setCurrentPage: (id) => set({ currentPageId: id, selectedId: null, selectedIds: [] }),
  setCurrentPageId: (id) => set({ currentPageId: id, selectedId: null, selectedIds: [] }),
  setPages: (pages) =>
    set({
      pages: Array.isArray(pages) ? pages : [],
      selectedId: null,
      selectedIds: [],
      history: [],
      future: [],
    }),
  // Update all pages without clearing undo history (use after _snapshot)
  patchAllPages: (updaterFn) => {
    const { pages } = get();
    set({ pages: updaterFn(Array.isArray(pages) ? pages : []) });
  },
  updatePage: (pageId, updates) => {
    const { pages } = get();
    const pagesList = pages || [];
    set({
      pages: pagesList.map(p => (p.id === pageId ? { ...p, ...updates } : p)),
    });
  },

  setTitle: (title) => set({ title }),

  // ── New design (reset editor state) ──────────
  newDesign: () => {
    const firstPageId = uuidv4();
    set({
      pages: [{ id: firstPageId, elements: [], backgroundColor: null }],
      currentPageId: firstPageId,
      selectedId: null,
      selectedIds: [],
      canvasSize: { ...DEFAULT_CANVAS_SIZE },
      title: 'Untitled Design',
      history: [],
      future: [],
      projectId: null,
    });
  },

  projectId: null,
  setProjectId: (id) => set({ projectId: id }),

  // ── Brand Kit ─────────────────────────────────
  brandKit: {
    name: 'My Brand',
    colors: [],
    fonts: [],
    logos: [],
    brandIcons: [],
    corporateTemplate: null,
  },

  setBrandKit: (updates) => {
    const newKit = { ...get().brandKit, ...updates };
    set({ brandKit: newKit });
    debouncedSaveBrandKit(newKit);
  },

  loadBrandKit: async () => {
    try {
      const { getBrandKit } = await import('../api/brandKit');
      const saved = await getBrandKit();
      if (saved && (saved.colors?.length || saved.fonts?.length || saved.logo_urls?.length)) {
        const logoData = saved.logo_urls?.[0] || {};
        const parsed = {
          name: 'My Brand',
          colors: saved.colors || [],
          fonts: saved.fonts || [],
          logos: logoData.logos || [],
          brandIcons: logoData.brandIcons || [],
          corporateTemplate: null,
        };
        set({ brandKit: parsed });
        (parsed.fonts || []).forEach((f) => {
          if (f.url) {
            const source =
              typeof f.url === "string" && f.url.startsWith("data:")
                ? `url(${f.url})`
                : f.url;
            const face = new FontFace(f.family, source);
            face.load().then((lf) => document.fonts.add(lf)).catch(() => {});
          }
        });
      }
    } catch (e) {
      console.error('Failed to load brand kit', e);
    }
  },

  addBrandColor: (color) => {
    const kit = get().brandKit;
    get().setBrandKit({
      colors: [...(kit.colors || []), { id: uuidv4(), ...color }],
    });
  },

  removeBrandColor: (id) => {
    const kit = get().brandKit;
    get().setBrandKit({
      colors: (kit.colors || []).filter((c) => c.id !== id),
    });
  },

  addBrandFont: (font) => {
    const kit = get().brandKit;
    get().setBrandKit({
      fonts: [...(kit.fonts || []), { id: uuidv4(), ...font }],
    });
  },

  addBrandLogo: (logo) => {
    const kit = get().brandKit;
    get().setBrandKit({
      logos: [...(kit.logos || []), { id: uuidv4(), ...logo }],
    });
  },

  addBrandIcon: (icon) => {
    const kit = get().brandKit;
    get().setBrandKit({
      brandIcons: [...(kit.brandIcons || []), { id: uuidv4(), ...icon }],
    });
  },

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
  saveProject: async (name) => {
    const { pages, canvasSize } = get();
    const pagesToSave = clonePages(pages).map(p => ({
      ...p,
      elements: p.elements.map(el =>
        el.type === 'image'
          ? { ...el, src: '' }
          : el
      ),
    }));
    const { createProject } = await import('../api/projects');
    const { id } = await createProject({
      name: name || 'Untitled Design',
      canvas_size: canvasSize,
      pages: pagesToSave,
      thumbnail_url: null,
    });
    return { id, name: name || 'Untitled Design', savedAt: new Date().toISOString() };
  },

  loadProject: async (project) => {
    const { listImages } = await import('../api/images');
    const allImages = await listImages();
    const imageMap = Object.fromEntries(allImages.map(i => [i.id, i.url]));
    const pages = project.pages || [];
    const resolvedPages = pages.map(p => ({
      ...p,
      elements: (p.elements || []).map(el =>
        el.type === 'image' && el.imageId
          ? { ...el, src: imageMap[el.imageId] || '' }
          : el
      ),
    }));
    const canvasSize = project.canvas_size || project.canvasSize;
    set({ pages: resolvedPages, canvasSize: canvasSize || get().canvasSize, currentPageId: pages[0]?.id || get().currentPageId, selectedId: null, selectedIds: [], history: [], future: [], title: project.name || 'Untitled Design' });
  },
}));

export default useEditorStore;
