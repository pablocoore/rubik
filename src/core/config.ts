export const LAYER_EPS_RATIO = 0.3; // fraction of step for layer selection tolerance
export const TURN_DURATION_MS = 140; // keyboard move animation duration
export const HIGHLIGHT_HEX = 0xffe066;
export const HIGHLIGHT_BLEND = 0.4; // 0..1 blend toward highlight color
export const DEBUG_FLAG = typeof window !== 'undefined'
  ? (new URLSearchParams(location.search).has('debug') || (window as any).__DEBUG__ === true)
  : false;

