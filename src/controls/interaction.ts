import * as THREE from 'three';
import { LAYER_EPS_RATIO } from '../core/config';

export type Axis = 'x' | 'y' | 'z';

/**
 * Rotates a specific layer of a Rubik's cube along a given axis by a specified angle.
 *
 * This function temporarily creates a pivot object to group and rotate all cubelets
 * (children of the cube) that belong to the specified layer. After rotation, the cubelets
 * are detached from the pivot and reattached to the main cube group.
 *  example usage rotateLayer(cube, 'y', 0, Math.PI / 2, 1);
 *
 * @param cube - The THREE.Group representing the entire Rubik's cube.
 * @param axis - The axis ('x', 'y', or 'z') along which to rotate the layer.
 * @param layerValue - The coordinate value along the axis that identifies the layer to rotate.
 * @param angle - The angle (in radians) by which to rotate the layer.
 * @param step - The distance between layers; used to determine selection tolerance.
 */
export function rotateLayer(
  cube: THREE.Group,
  axis: Axis,
  layerValue: number,
  angle: number,
  step: number
) {
  const pivot = new THREE.Object3D();
  cube.add(pivot);

  const eps = step * LAYER_EPS_RATIO;
  const selected: THREE.Object3D[] = [];
  for (const child of cube.children) {
    const wp = new THREE.Vector3();
    child.getWorldPosition(wp);
    const value = axis === 'x' ? wp.x : axis === 'y' ? wp.y : wp.z;
    if (Math.abs(value - layerValue) < eps) {
      // pivot.attach(child);
      selected.push(child);
    }
  }
  for (const child of selected) pivot.attach(child);

  (pivot.rotation as any)[axis] += angle;

  // Detach back to cube
  for (const child of selected) cube.attach(child);
  cube.remove(pivot);
}

export function mapMoveToAxisLayer(
  key: string,
  step: number,
  size: number
): { axis: Axis; layer: number; dir: 1 | -1 } | null {

  const k = key.toUpperCase();
  switch (k) {
    case 'U':
      return { axis: 'y', layer: +1 * step, dir: 1 };
    case 'D':
      return { axis: 'y', layer: -1 * step, dir: 1 };
    case 'R':
      return { axis: 'x', layer: +1 * step, dir: 1 };
    case 'L':
      return { axis: 'x', layer: -1 * step, dir: 1 };
    case 'F':
      return { axis: 'z', layer: +1 * step, dir: 1 };
    case 'B':
      return { axis: 'z', layer: -1 * step, dir: 1 };
    case 'M':
      return { axis: 'x', layer: 0, dir: 1 };
    default:
      return null;
  }
}

export function selectLayerChildren(
  cube: THREE.Group,
  axis: Axis,
  layerValue: number,
  step: number,
  epsRatio: number = LAYER_EPS_RATIO
): THREE.Object3D[] {
  const eps = step * epsRatio;
  const selected: THREE.Object3D[] = [];
  for (const child of cube.children) {
    const wp = new THREE.Vector3();
    child.getWorldPosition(wp);
    const value = axis === 'x' ? wp.x : axis === 'y' ? wp.y : wp.z;
    if (Math.abs(value - layerValue) < eps) selected.push(child);
  }
  return selected;
}

export function animateLayerRotation(
  cube: THREE.Group,
  axis: Axis,
  layerValue: number,
  angle: number,
  step: number,
  durationMs: number
): Promise<void> {
  return new Promise((resolve) => {
    const pivot = new THREE.Object3D();
    cube.add(pivot);
    const selected = selectLayerChildren(cube, axis, layerValue, step);
    for (const child of selected) pivot.attach(child);

    let start: number | null = null;
    const initial = (pivot.rotation as any)[axis] as number;
    function frame(ts: number) {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / Math.max(1, durationMs));
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOutQuad
      (pivot.rotation as any)[axis] = initial + angle * eased;
      if (t < 1) requestAnimationFrame(frame);
      else {
        (pivot.rotation as any)[axis] = initial + angle;
        for (const child of selected) cube.attach(child);
        cube.remove(pivot);
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}
