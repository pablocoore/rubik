import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

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
  const inner = 0x0a0a0a; // near-black for internal faces

  // Use rounded box geometry for softer edges/corners
  const CORNER_RADIUS = Math.min(cubelet * 0.1, cubelet * 0.24);
  const SEGMENTS = 4; // small number for gentle rounding
  const geo = new RoundedBoxGeometry(cubelet, cubelet, cubelet, SEGMENTS, CORNER_RADIUS);

  const min = indices[0];
  const max = indices[indices.length - 1];

  for (const ix of indices) {
    for (const iy of indices) {
      for (const iz of indices) {
        // BoxGeometry material order: +x (right), -x (left), +y (top), -y (bottom), +z (front), -z (back)
        const materials = [
          new THREE.MeshStandardMaterial({ color: ix === max ? right : inner }),
          new THREE.MeshStandardMaterial({ color: ix === min ? left : inner }),
          new THREE.MeshStandardMaterial({ color: iy === max ? up : inner }),
          new THREE.MeshStandardMaterial({ color: iy === min ? down : inner }),
          new THREE.MeshStandardMaterial({ color: iz === max ? front : inner }),
          new THREE.MeshStandardMaterial({ color: iz === min ? back : inner })
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
