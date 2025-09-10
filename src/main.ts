import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createRenderContext, attachContextLossHandlers } from './core/renderer';
import { createRubiksCube, regridCubelets } from './scene/cube';
import { mapMoveToAxisLayer, type Axis } from './controls/interaction';
import { InteractionController } from './controls/interaction-controller';
import { MoveQueue } from './controls/move-queue';
import { DEBUG_FLAG } from './core/config';

const container = document.getElementById('app')!;
const params = new URLSearchParams(location.search);
const DEBUG = DEBUG_FLAG;
let TEST_MODE = false;

function debugLog(...args: any[]) {
  if (DEBUG) console.log('[debug]', ...args);
}
const ctx = createRenderContext(container);

// Scene grid/floor
const grid = new THREE.GridHelper(20, 20, 0x444444, 0x2a2a2a);
grid.position.y = -2;
grid.visible = false; // only visible in Test Mode
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
  grid.visible = on;
  axisIndicator.visible = false;
  if (!on && axisIndicatorTimer) {
    window.clearTimeout(axisIndicatorTimer);
    axisIndicatorTimer = null;
  }
  debugLog('test-mode', on);
}

// Move queue for keyboard moves
const queue = new MoveQueue({ cube, step });

function doMove(key: string, prime: boolean) {
  const move = mapMoveToAxisLayer(key, step, size);
  if (!move) return;
  const angle = (prime ? -1 : 1) * Math.PI / 2;
  queue.enqueue({ axis: move.axis, layer: move.layer, angle });
  debugLog('move:queued', { key, prime, axis: move.axis, layer: move.layer });
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
  // Rewire controllers to new cube
  queue.setCube(cube);
  interactor.setCube(cube);
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
  if (['U', 'D', 'R', 'F', 'M', 'L', 'B'].includes(e.key.toUpperCase())) {
    doMove(e.key, e.shiftKey);
  }
});

// Interaction controller (drag to rotate)
const interactor = new InteractionController({
  camera: ctx.camera,
  dom: ctx.renderer.domElement,
  cube,
  step,
  controls,
  events: {
    onLayerStart: (axis) => showActiveAxis(axis),
    onSnap: () => {
      regridCubelets(cube, step);
      debugLog('drag:snap');
    }
  }
});

// Clean up if needed (e.g., in SPA environments)
// WebGL context loss guard
attachContextLossHandlers(ctx.renderer, () => {
  resetView();
});

// Clean up if needed (e.g., in SPA environments)
export function dispose() {
  interactor.dispose();
  ctx.dispose();
}
