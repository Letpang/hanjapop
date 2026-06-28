export const setupAnimCjkCanvas = (canvas, strokeStyleRef, isDrawingRef) => {
  const initCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.offsetWidth;
    if (size === 0) return false;
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    }
    return true;
  };

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const onStart = (e) => {
    e.preventDefault();
    if (!initCanvas()) return;
    isDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = strokeStyleRef.current.color;
    ctx.lineWidth = strokeStyleRef.current.width * 0.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const onMove = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onEnd = () => { isDrawingRef.current = false; };

  canvas.addEventListener('mousedown', onStart);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onEnd);
  canvas.addEventListener('mouseleave', onEnd);
  canvas.addEventListener('touchstart', onStart, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onEnd);

  return () => {
    canvas.removeEventListener('mousedown', onStart);
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('mouseup', onEnd);
    canvas.removeEventListener('mouseleave', onEnd);
    canvas.removeEventListener('touchstart', onStart);
    canvas.removeEventListener('touchmove', onMove);
    canvas.removeEventListener('touchend', onEnd);
  };
};

export const fetchStrokeOrderSvg = (hanjaChar, options) =>
  fetch(`/assets/stroke-order/${hanjaChar}.svg`, options).then(r => r.text());

export const renderStrokeOrderSvg = (container, svg) => {
  container.innerHTML = svg;
  const svgEl = container.querySelector('svg');
  if (!svgEl) return;

  svgEl.style.width = '100%';
  svgEl.style.height = '100%';
  svgEl.style.opacity = '0.12';
  svgEl.style.pointerEvents = 'none';
};

export const clearDrawingCanvas = (canvas) => {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(
    0,
    0,
    canvas.width / (window.devicePixelRatio || 1),
    canvas.height / (window.devicePixelRatio || 1)
  );
};

export const drawStrokeNumberOverlay = ({ canvas, charData, isComplete, activeStrokeIndex }) => {
  if (!canvas || !charData || !charData.medians) return;

  const size = canvas.offsetWidth;
  if (size === 0) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  if (isComplete) return;

  const padding = size * 0.08;
  const r = size * 0.035;
  const strokeCount = charData.medians.length;

  for (let i = 0; i < strokeCount; i++) {
    const isActive = i === activeStrokeIndex;
    if (i < activeStrokeIndex) continue;

    const median = charData.medians[i];
    if (!median || median.length === 0) continue;
    const scale = (size - 2 * padding) / 1024;

    const [sx, sy] = median[0];
    const bx = padding + sx * scale;
    const by = padding + (1024 - sy) * scale;

    const next = median[Math.min(1, median.length - 1)];
    const nex = padding + next[0] * scale;
    const ney = padding + (1024 - next[1]) * scale;

    const sdx = nex - bx;
    const sdy = ney - by;
    const len = Math.hypot(sdx, sdy) || 1;
    const ux = sdx / len;
    const uy = sdy / len;

    const offsetDist = r * 1.45;
    let cx = bx - ux * offsetDist;
    let cy = by - uy * offsetDist;

    cx = Math.max(r, Math.min(size - r, cx));
    cy = Math.max(r, Math.min(size - r, cy));

    if (isActive) {
      ctx.save();
      ctx.shadowColor = 'rgba(124, 131, 255, 0.45)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124, 131, 255, 0.95)';
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();

      ctx.font = `bold ${Math.round(r * 1.25)}px sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), cx, cy + 0.5);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(174, 183, 197, 0.12)';
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(174, 183, 197, 0.35)';
      ctx.stroke();

      ctx.font = `bold ${Math.round(r * 1.05)}px sans-serif`;
      ctx.fillStyle = 'rgba(120, 130, 160, 0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), cx, cy + 0.5);
    }
  }
};
