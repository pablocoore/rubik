import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createRenderContext } from './core/renderer';
import { createRubiksCube, regridCubelets } from './scene/cube';
import { mapMoveToAxisLayer, rotateLayer, type Axis } from './controls/interaction';

const container = document.getElementById('app')!;
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug') || (window as any).__DEBUG__ === true;
let TEST_MODE = false;

function debugLog(...args: any[]) {
  if (DEBUG) console.log('[debug]', ...args);
}
const ctx = createRenderContext(container);

// Scene grid/floor
const grid = new THREE.GridHelper(20, 20, 0x444444, 0x2a2a2a);
grid.position.y = -2;
ctx.scene.add(grid);

// Rubik spec
const size = 3;
const cubelet = 0.95;
const gap = 0.06;
const step = cubelet + gap;
const spec = { size, cubelet, gap } as const;

// Create cube group
let cube = createRubiksCube(spec);
ctx.scene.add(cube);

// Camera controls
const controls = new OrbitControls(ctx.camera, ctx.renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 20;

// Animation loop
const clock = new THREE.Clock();
function animate() {
  const _dt = clock.getDelta();
  controls.update();
  ctx.renderer.render(ctx.scene, ctx.camera);
  requestAnimationFrame(animate);
}
animate();

// Keyboard interactions
// Test mode visuals
const axesHelper = new THREE.AxesHelper(3);
axesHelper.visible = false;
ctx.scene.add(axesHelper);

const axisIndicator = new THREE.ArrowHelper(
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 0, 0),
  3.2,
  0xffff00
);
axisIndicator.visible = false;
ctx.scene.add(axisIndicator);
let axisIndicatorTimer: number | null = null;

function showActiveAxis(axis: Axis) {
  if (!TEST_MODE) return;
  const dir = axis === 'x' ? new THREE.Vector3(1, 0, 0) : axis === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
  axisIndicator.setDirection(dir);
  axisIndicator.visible = true;
  if (axisIndicatorTimer) window.clearTimeout(axisIndicatorTimer);
  axisIndicatorTimer = window.setTimeout(() => {
    axisIndicator.visible = false;
  }, 600);
}

function setTestMode(on: boolean) {
  TEST_MODE = on;
  axesHelper.visible = on;
  axisIndicator.visible = false;
  debugLog('test-mode', on);
}

function doMove(key: string, prime: boolean) {
  const move = mapMoveToAxisLayer(key, step, size);
  if (!move) return;
  const angle = (prime ? -1 : 1) * Math.PI / 2;
  const t0 = performance.now();
  rotateLayer(cube, move.axis, move.layer, angle, step);
  regridCubelets(cube, step);
  const dt = performance.now() - t0;
  debugLog('move', { key, prime, axis: move.axis, layer: move.layer, ms: Math.round(dt) });
  showActiveAxis(move.axis);
}

function scramble(n = 20) {
  const keys = ['U', 'R', 'F', 'L', 'B', 'M'];
  for (let i = 0; i < n; i++) {
    const k = keys[Math.floor(Math.random() * keys.length)];
    const prime = Math.random() < 0.5;
    doMove(k, prime);
  }
}

function disposeObject3D(root: THREE.Object3D) {
  const geos = new Set<THREE.BufferGeometry>();
  const mats = new Set<THREE.Material>();
  root.traverse((obj) => {
    // @ts-expect-error narrow runtime
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && mesh.geometry instanceof THREE.BufferGeometry) geos.add(mesh.geometry);
    const material: any = (mesh as any).material;
    if (material) {
      if (Array.isArray(material)) material.forEach((m) => m && mats.add(m));
      else mats.add(material);
    }
  });
  geos.forEach((g) => g.dispose());
  mats.forEach((m) => m.dispose());
}

function resetView() {
  debugLog('reset: rebuild cube');
  // Remove and dispose existing cube
  ctx.scene.remove(cube);
  disposeObject3D(cube);
  // Recreate fresh solved cube
  cube = createRubiksCube(spec);
  ctx.scene.add(cube);
  // Reset camera
  ctx.camera.position.set(4.5, 4.5, 6.5);
  ctx.camera.lookAt(0, 0, 0);
  controls.update();
}

window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
  if (e.key.toUpperCase() === 'S') return scramble();
  if (e.key === '0') return resetView();
  if (e.key.toUpperCase() === 'T') return setTestMode(!TEST_MODE);
  if (['U', 'R', 'F', 'M', 'L', 'B'].includes(e.key.toUpperCase())) {
    doMove(e.key, e.shiftKey);
  }
});

// Pointer-based face rotation (drag gesture)
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

type DragState = {
  active: boolean;
  plane: THREE.Plane;
  start: THREE.Vector3;
  last: THREE.Vector3;
  n: THREE.Vector3; // face normal (world)
  t1: THREE.Vector3; // tangent basis 1
  t2: THREE.Vector3; // tangent basis 2
  picked: THREE.Object3D | null;
};

const drag: DragState = {
  active: false,
  plane: new THREE.Plane(),
  start: new THREE.Vector3(),
  last: new THREE.Vector3(),
  n: new THREE.Vector3(),
  t1: new THREE.Vector3(),
  t2: new THREE.Vector3(),
  picked: null
};

let pivot: THREE.Object3D | null = null;
let selected: THREE.Object3D[] = [];
let layerAxis: Axis | null = null;
let layerVal = 0;
let axisDir = 1; // direction of principal axis
let useT1 = true; // chosen tangent basis for sign
let currentAngle = 0;

// Highlighting (blend base color toward a highlight color)
const originalColor = new WeakMap<THREE.Material, number>();
function setHighlighted(objs: THREE.Object3D[], on: boolean) {
  // const highlightHex = 0xffe066; // target highlight color
  const highlightHex = 0xeeeeee; // target highlight color
  const t = 0.4; // blend amount [0..1]
  const highlight = new THREE.Color(highlightHex);
  for (const obj of objs) {
    const mesh = obj as THREE.Mesh;
    const mat = (mesh as any).material as THREE.Material | THREE.Material[] | undefined;
    const mats = Array.isArray(mat) ? mat : mat ? [mat] : [];
    for (const m of mats) {
      const ms = m as any;
      if (!ms || !('color' in ms)) continue;
      if (on) {
        if (!originalColor.has(m)) originalColor.set(m, ms.color.getHex());
        const base = new THREE.Color(originalColor.get(m)!);
        // Blend base -> highlight by t
        const blended = base.clone().lerp(highlight, t);
        ms.color.copy(blended);
      } else if (originalColor.has(m)) {
        ms.color.setHex(originalColor.get(m)!);
        originalColor.delete(m);
      }
    }
  }
}

function setNDCFromEvent(ev: PointerEvent) {
  const rect = ctx.renderer.domElement.getBoundingClientRect();
  ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
}

function intersectOnPlane(ev: PointerEvent, plane: THREE.Plane, out: THREE.Vector3): boolean {
  setNDCFromEvent(ev);
  raycaster.setFromCamera(ndc, ctx.camera);
  const p = raycaster.ray.intersectPlane(plane, out);
  return !!p;
}

function onPointerDown(ev: PointerEvent) {
  if (ev.button !== 0) return; // left only
  setNDCFromEvent(ev);
  raycaster.setFromCamera(ndc, ctx.camera);
  const hits = raycaster.intersectObjects(cube.children, true);
  const hit = hits[0];
  if (!hit || !hit.face) return;

  // Compute world-space face normal
  const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
  const p = hit.point.clone();
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, p);

  // Create stable tangents on the face plane
  const up = new THREE.Vector3(0, 1, 0);
  const alt = Math.abs(n.dot(up)) > 0.9 ? new THREE.Vector3(1, 0, 0) : up;
  const t1 = alt.clone().cross(n).normalize();
  const t2 = n.clone().cross(t1).normalize();

  // Initialize drag state
  drag.active = true;
  drag.plane.copy(plane);
  drag.n.copy(n);
  drag.t1.copy(t1);
  drag.t2.copy(t2);
  drag.picked = hit.object;
  intersectOnPlane(ev, drag.plane, drag.start);
  drag.last.copy(drag.start);
  controls.enabled = false;
  ctx.renderer.domElement.setPointerCapture(ev.pointerId);
  debugLog('drag:start', { n: n.toArray(), p: p.toArray() });
}

function onPointerMove(ev: PointerEvent) {
  if (!drag.active) return;
  if (!intersectOnPlane(ev, drag.plane, drag.last)) return;

  // Determine axis/layer and begin live rotation when movement is enough
  const delta = drag.last.clone().sub(drag.start);
  const d1 = delta.dot(drag.t1);
  const d2 = delta.dot(drag.t2);
  const magnitude = Math.hypot(d1, d2);
  const startThreshold = step * 0.05;

  if (!pivot) {
    if (magnitude < startThreshold || !drag.picked) return;

    useT1 = Math.abs(d1) >= Math.abs(d2);
    const tangent = useT1 ? drag.t1 : drag.t2;
    const axisVec = drag.n.clone().cross(tangent).normalize();
    const axAbs = [Math.abs(axisVec.x), Math.abs(axisVec.y), Math.abs(axisVec.z)];
    const maxI = axAbs[0] > axAbs[1] ? (axAbs[0] > axAbs[2] ? 0 : 2) : (axAbs[1] > axAbs[2] ? 1 : 2);
    layerAxis = (['x', 'y', 'z'] as const)[maxI];
    axisDir = Math.sign((axisVec as any)[layerAxis]) || 1;

    // Determine layer using world coordinates
    const wp = new THREE.Vector3();
    drag.picked.getWorldPosition(wp);
    layerVal = Math.round(((wp as any)[layerAxis]) / step) * step;

    // Build pivot and attach layer cubelets (select in WORLD space)
    pivot = new THREE.Object3D();
    cube.add(pivot);
    const eps = step * 0.3; // tolerant but < step/2 to avoid adjacent layers
    selected = [];
    const children = [...cube.children];
    for (const child of children) {
      if (child === pivot) continue;
      const wpc = new THREE.Vector3();
      child.getWorldPosition(wpc);
      const value = (wpc as any)[layerAxis];
      if (Math.abs(value - layerVal) < eps) {
        pivot.attach(child);
        selected.push(child);
      }
    }
    currentAngle = 0;
    if (layerAxis) showActiveAxis(layerAxis);
    setHighlighted(selected, true);
    debugLog('drag:layer-start', { layerAxis, layerVal, selected: selected.length });
  }

  // If pivot is set, rotate layer continuously
  if (pivot && layerAxis) {
    const signed = (useT1 ? d1 : d2); // world units
    const angle = (signed / step) * (Math.PI / 2) * axisDir;
    (pivot.rotation as any)[layerAxis] = angle;
    currentAngle = angle;
  }
}

function onPointerUp(ev: PointerEvent) {
  if (!drag.active) return;
  ctx.renderer.domElement.releasePointerCapture(ev.pointerId);
  controls.enabled = true;

  if (!pivot || !layerAxis) {
    // Nothing significant moved
    drag.active = false;
    return;
  }

  // Snap to nearest quarter-turn
  const q = Math.PI / 2;
  const snapped = Math.round(currentAngle / q) * q;
  (pivot.rotation as any)[layerAxis] = snapped;

  // Detach children back to cube and cleanup
  setHighlighted(selected, false);
  for (const child of selected) cube.attach(child);
  cube.remove(pivot);
  pivot = null;
  selected = [];
  layerAxis = null;
  currentAngle = 0;
  regridCubelets(cube, step);
  debugLog('drag:snap');

  drag.active = false;
}

ctx.renderer.domElement.addEventListener('pointerdown', onPointerDown);
ctx.renderer.domElement.addEventListener('pointermove', onPointerMove);
ctx.renderer.domElement.addEventListener('pointerup', onPointerUp);

// Clean up if needed (e.g., in SPA environments)
export function dispose() {
  ctx.dispose();
}
