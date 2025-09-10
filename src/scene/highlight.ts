import * as THREE from 'three';
import { HIGHLIGHT_HEX, HIGHLIGHT_BLEND } from '../core/config';

// Blended color highlight with per-material restore
const originalColor = new WeakMap<THREE.Material, number>();

export function setHighlighted(objs: THREE.Object3D[], on: boolean) {
  const highlight = new THREE.Color(HIGHLIGHT_HEX);
  const t = HIGHLIGHT_BLEND;
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
        ms.color.copy(base.clone().lerp(highlight, t));
      } else if (originalColor.has(m)) {
        ms.color.setHex(originalColor.get(m)!);
        originalColor.delete(m);
      }
    }
  }
}

