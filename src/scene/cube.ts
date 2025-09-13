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

  // Rounded sticker geometry (slightly inset square with rounded corners)
  const stickerSize = cubelet * 0.92;
  const stickerRadius = Math.min(stickerSize * 0.14, stickerSize * 0.45);
  const stickerShape = new THREE.Shape();
  {
    const w = stickerSize, h = stickerSize, r = stickerRadius;
    const x = -w / 2, y = -h / 2;
    stickerShape.moveTo(x + r, y);
    stickerShape.lineTo(x + w - r, y);
    stickerShape.quadraticCurveTo(x + w, y, x + w, y + r);
    stickerShape.lineTo(x + w, y + h - r);
    stickerShape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    stickerShape.lineTo(x + r, y + h);
    stickerShape.quadraticCurveTo(x, y + h, x, y + h - r);
    stickerShape.lineTo(x, y + r);
    stickerShape.quadraticCurveTo(x, y, x + r, y);
  }
  const stickerGeo = new THREE.ShapeGeometry(stickerShape, 24);
  const STICKER_EPS = 0.002; // slight offset to prevent z-fighting

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

        // Add rounded sticker overlays for exposed faces (mobile-friendly look)
        const stickerMaterial = (hex: number) =>
          new THREE.MeshBasicMaterial({ color: hex, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });

        if (ix === max) {
          const s = new THREE.Mesh(stickerGeo, stickerMaterial(right));
          s.position.x = cubelet / 2 + STICKER_EPS;
          s.rotation.y = -Math.PI / 2;
          mesh.add(s);
        }
        if (ix === min) {
          const s = new THREE.Mesh(stickerGeo, stickerMaterial(left));
          s.position.x = -cubelet / 2 - STICKER_EPS;
          s.rotation.y = Math.PI / 2;
          mesh.add(s);
        }
        if (iy === max) {
          const s = new THREE.Mesh(stickerGeo, stickerMaterial(up));
          s.position.y = cubelet / 2 + STICKER_EPS;
          s.rotation.x = -Math.PI / 2;
          mesh.add(s);
        }
        if (iy === min) {
          const s = new THREE.Mesh(stickerGeo, stickerMaterial(down));
          s.position.y = -cubelet / 2 - STICKER_EPS;
          s.rotation.x = Math.PI / 2;
          mesh.add(s);
        }
        if (iz === max) {
          const s = new THREE.Mesh(stickerGeo, stickerMaterial(front));
          s.position.z = cubelet / 2 + STICKER_EPS;
          mesh.add(s);
        }
        if (iz === min) {
          const s = new THREE.Mesh(stickerGeo, stickerMaterial(back));
          s.position.z = -cubelet / 2 - STICKER_EPS;
          s.rotation.y = Math.PI;
          mesh.add(s);
        }
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
