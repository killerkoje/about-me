export const CANVAS_GL = {
  antialias: false,
  powerPreference: 'high-performance' as WebGLPowerPreference,
  alpha: true,
}

export function getCanvasDpr() {
  if (typeof window === 'undefined') return 1
  return Math.min(window.devicePixelRatio || 1, 1.5)
}
