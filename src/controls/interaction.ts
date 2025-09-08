import * as THREE from 'three';

type Axis = 'x' | 'y' | 'z';

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
      pivot.attach(child);
      selected.push(child);
    }
  }

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
  const top = ((size - 1) / 2) * step;
  const mid = 0;
  const right = top;
  const front = top;

  switch (key.toUpperCase()) {
    case 'U':
      return { axis: 'y', layer: top, dir: 1 };
    case 'R':
      return { axis: 'x', layer: right, dir: 1 };
    case 'F':
      return { axis: 'z', layer: front, dir: 1 };
    case 'M':
      return { axis: 'x', layer: mid, dir: 1 };
    default:
      return null;
  }
}

