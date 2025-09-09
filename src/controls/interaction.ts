import * as THREE from 'three';

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

  const eps = step * 0.5 * 0.1; // 10% of half-step tolerance
  const selected: THREE.Object3D[] = [];
  for (const child of cube.children) {
    const pos = child.position as THREE.Vector3;
    const value = axis === 'x' ? pos.x : axis === 'y' ? pos.y : pos.z;
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

  switch (key.toUpperCase()) {
    case 'U':
      return { axis: 'y', layer: 1*step, dir: 1 };
    case 'R':
      return { axis: 'x', layer: 1, dir: 1 };
    case 'F':
      return { axis: 'z', layer: 1*step, dir: 1 };
    case 'M':
      return { axis: 'x', layer: 0, dir: 1 };
    case 'L':
      return { axis: 'x', layer: -1*step, dir: 1 };
    case 'B':
      return { axis: 'y', layer: -1 * step, dir: 1 };
    default:
      return null;
  }
}
