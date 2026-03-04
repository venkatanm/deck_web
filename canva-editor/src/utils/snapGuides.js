// Increase threshold so snapping is easy to trigger
const SNAP_THRESHOLD = 8; // canvas pixels

export function getSnapPosition({
  dragEl,      // { x, y, width, height } — top-left coords in canvas px
  elements,    // other elements on canvas
  canvasSize,  // { width, height }
  enabled,
}) {
  if (!enabled) return { x: dragEl.x, y: dragEl.y, guides: [] };

  let x = dragEl.x;
  let y = dragEl.y;
  const guides = [];

  // ── Snap targets ──────────────────────────────────────
  // Each target is a canvas-space pixel value.
  // We check 3 points on the dragged element against all targets:
  //   left edge, center, right edge (for x)
  //   top edge, center, bottom edge (for y)

  const xTargets = [
    0,                        // canvas left edge
    canvasSize.width / 2,     // canvas center x
    canvasSize.width,         // canvas right edge
  ];
  const yTargets = [
    0,                        // canvas top edge
    canvasSize.height / 2,    // canvas center y
    canvasSize.height,        // canvas bottom edge
  ];

  // Add other elements' edges and centers
  elements.forEach(el => {
    xTargets.push(el.x);
    xTargets.push(el.x + el.width / 2);
    xTargets.push(el.x + el.width);
    yTargets.push(el.y);
    yTargets.push(el.y + el.height / 2);
    yTargets.push(el.y + el.height);
  });

  // ── Check x axis ──────────────────────────────────────
  // The 3 x-points on the dragged element and their offset from x
  const xPoints = [
    { val: x,                      offset: 0               }, // left edge
    { val: x + dragEl.width / 2,   offset: dragEl.width/2  }, // center
    { val: x + dragEl.width,       offset: dragEl.width    }, // right edge
  ];

  let bestXDist = SNAP_THRESHOLD;
  let bestXSnap = null;

  xPoints.forEach(pt => {
    xTargets.forEach(t => {
      const dist = Math.abs(pt.val - t);
      if (dist < bestXDist) {
        bestXDist = dist;
        bestXSnap = { newX: t - pt.offset, guide: t };
      }
    });
  });

  if (bestXSnap) {
    x = bestXSnap.newX;
    guides.push({ type: 'vertical', position: bestXSnap.guide });
  }

  // ── Check y axis ──────────────────────────────────────
  const yPoints = [
    { val: y,                       offset: 0                },
    { val: y + dragEl.height / 2,   offset: dragEl.height/2  },
    { val: y + dragEl.height,       offset: dragEl.height    },
  ];

  let bestYDist = SNAP_THRESHOLD;
  let bestYSnap = null;

  yPoints.forEach(pt => {
    yTargets.forEach(t => {
      const dist = Math.abs(pt.val - t);
      if (dist < bestYDist) {
        bestYDist = dist;
        bestYSnap = { newY: t - pt.offset, guide: t };
      }
    });
  });

  if (bestYSnap) {
    y = bestYSnap.newY;
    guides.push({ type: 'horizontal', position: bestYSnap.guide });
  }

  return { x, y, guides };
}
