import * as THREE from 'three';

export type RubikSpec = {
  size: number; // layers per edge (3 for 3x3)
  cubelet: number; // cubelet size
  gap: number; // spacing between cubelets
};

export function createRubiksCube(spec: RubikSpec): THREE.Group {
  const { size, cubelet, gap } = spec;
  const group = new THREE.Group();

  const step = cubelet + gap;
  const indices = [...Array(size)].map((_, i) => i - ((size - 1) / 2));

  const up = 0xffffff; // white
  const down = 0xffea00; // yellow
  const front = 0x2ecc71; // green
  const back = 0x3498db; // blue
  const left = 0xe67e22; // orange
  const right = 0xe74c3c; // red
  const inner = 0x151515; // inner faces

  const faceColor = (axis: 'x'|'y'|'z', idx: number): number => {
    if (axis === 'y') return idx > 0 ? up : idx < 0 ? down : inner;
    if (axis === 'z') return idx > 0 ? front : idx < 0 ? back : inner;
    return idx > 0 ? right : idx < 0 ? left : inner;
  };

  const geo = new THREE.BoxGeometry(cubelet, cubelet, cubelet);

  for (const ix of indices) {
    for (const iy of indices) {
      for (const iz of indices) {
        const materials = [
          new THREE.MeshStandardMaterial({ color: faceColor('x', +1) }),
          new THREE.MeshStandardMaterial({ color: faceColor('x', -1) }),
          new THREE.MeshStandardMaterial({ color: faceColor('y', +1) }),
          new THREE.MeshStandardMaterial({ color: faceColor('y', -1) }),
          new THREE.MeshStandardMaterial({ color: faceColor('z', +1) }),
          new THREE.MeshStandardMaterial({ color: faceColor('z', -1) })
        ];
        const mesh = new THREE.Mesh(geo, materials);
        mesh.position.set(ix * step, iy * step, iz * step);
        (mesh as any).grid = { x: ix, y: iy, z: iz };
        group.add(mesh);
      }
    }
  }

  return group;
}

export function regridCubelets(group: THREE.Group, step: number) {
  group.children.forEach((child) => {
    const v = child.position;
    v.set(
      Math.round(v.x / step) * step,
      Math.round(v.y / step) * step,
      Math.round(v.z / step) * step
    );
    child.rotation.x = Math.round(child.rotation.x / (Math.PI / 2)) * (Math.PI / 2);
    child.rotation.y = Math.round(child.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
    child.rotation.z = Math.round(child.rotation.z / (Math.PI / 2)) * (Math.PI / 2);
  });
}

