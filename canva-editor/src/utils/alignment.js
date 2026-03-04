export const alignLeft = (el) => ({ x: 0 });

export const alignRight = (el, canvas) => ({
  x: canvas.width - el.width,
});

export const alignTop = (el) => ({ y: 0 });

export const alignBottom = (el, canvas) => ({
  y: canvas.height - el.height,
});

export const alignCenterH = (el, canvas) => ({
  x: (canvas.width - el.width) / 2,
});

export const alignCenterV = (el, canvas) => ({
  y: (canvas.height - el.height) / 2,
});

export const alignMiddle = (el, canvas) => ({
  x: (canvas.width - el.width) / 2,
  y: (canvas.height - el.height) / 2,
});
