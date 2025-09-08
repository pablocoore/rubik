import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createRenderContext } from './core/renderer';
import { createRubiksCube, regridCubelets } from './scene/cube';
import { mapMoveToAxisLayer, rotateLayer } from './controls/interaction';

const container = document.getElementById('app')!;
const ctx = createRenderContext(container);

// Scene grid/floor
const grid = new THREE.GridHelper(20, 20, 0x444444, 0x2a2a2a);
grid.position.y = -2;
ctx.scene.add(grid);

// Rubik spec
const size = 3;
const cubelet = 0.95;
const gap = 0.05;
const step = cubelet + gap;

// Create cube group
const cube = createRubiksCube({ size, cubelet, gap });
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
function doMove(key: string, prime: boolean) {
  const move = mapMoveToAxisLayer(key, step, size);
  if (!move) return;
  const angle = (prime ? -1 : 1) * Math.PI / 2;
  rotateLayer(cube, move.axis, move.layer, angle, step);
  regridCubelets(cube, step);
}

function scramble(n = 20) {
  const keys = ['U', 'R', 'F'];
  for (let i = 0; i < n; i++) {
    const k = keys[Math.floor(Math.random() * keys.length)];
    const prime = Math.random() < 0.5;
    doMove(k, prime);
  }
}

function resetView() {
  cube.rotation.set(0, 0, 0);
  regridCubelets(cube, step);
  ctx.camera.position.set(4.5, 4.5, 6.5);
  controls.update();
}

window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
  if (e.key.toUpperCase() === 'S') return scramble();
  if (e.key === '0') return resetView();
  if (['U', 'R', 'F', 'M'].includes(e.key.toUpperCase())) {
    doMove(e.key, e.shiftKey);
  }
});

// Clean up if needed (e.g., in SPA environments)
export function dispose() {
  ctx.dispose();
}

