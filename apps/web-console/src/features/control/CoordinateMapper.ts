export type NormalizedPoint = {
  xNorm: number;
  yNorm: number;
};

export function normalizePointerPoint(
  clientX: number,
  clientY: number,
  bounds: DOMRect,
): NormalizedPoint {
  const xNorm = clamp((clientX - bounds.left) / bounds.width);
  const yNorm = clamp((clientY - bounds.top) / bounds.height);

  return { xNorm, yNorm };
}

export function mapToPhysical(point: NormalizedPoint, width: number, height: number) {
  return {
    x: Math.round(point.xNorm * width),
    y: Math.round(point.yNorm * height),
  };
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}
