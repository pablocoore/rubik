import * as THREE from 'three';
import { setHighlighted } from '../scene/highlight';
import { LAYER_EPS_RATIO } from '../core/config';
import { type Axis } from './interaction';

export type DragEvents = {
  onLayerStart?: (axis: Axis, layerValue: number, selected: THREE.Object3D[]) => void;
  onAngle?: (axis: Axis, angle: number) => void;
  onSnap?: (axis: Axis, layerValue: number, snappedAngle: number, selected: THREE.Object3D[]) => void;
};

export class InteractionController {
  private camera: THREE.Camera;
  private dom: HTMLElement;
  private cube: THREE.Group;
  private step: number;
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private pivot: THREE.Object3D | null = null;
  private selected: THREE.Object3D[] = [];
  private layerAxis: Axis | null = null;
  private layerVal = 0;
  private axisDir = 1;
  private useT1 = true;
  private currentAngle = 0;
  private dragActive = false;
  private controls?: { enabled: boolean };
  private events: DragEvents;

  // drag plane
  private plane = new THREE.Plane();
  private start = new THREE.Vector3();
  private last = new THREE.Vector3();
  private n = new THREE.Vector3();
  private t1 = new THREE.Vector3();
  private t2 = new THREE.Vector3();
  private picked: THREE.Object3D | null = null;

  constructor(params: {
    camera: THREE.Camera;
    dom: HTMLElement;
    cube: THREE.Group;
    step: number;
    controls?: { enabled: boolean };
    events?: DragEvents;
  }) {
    this.camera = params.camera;
    this.dom = params.dom;
    this.cube = params.cube;
    this.step = params.step;
    this.controls = params.controls;
    this.events = params.events || {};

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    this.dom.addEventListener('pointerdown', this.onPointerDown);
    this.dom.addEventListener('pointermove', this.onPointerMove);
    this.dom.addEventListener('pointerup', this.onPointerUp);
  }

  dispose() {
    this.dom.removeEventListener('pointerdown', this.onPointerDown);
    this.dom.removeEventListener('pointermove', this.onPointerMove);
    this.dom.removeEventListener('pointerup', this.onPointerUp);
  }

  private setNDCFromEvent(ev: PointerEvent) {
    const rect = this.dom.getBoundingClientRect();
    this.ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private intersectOnPlane(ev: PointerEvent, plane: THREE.Plane, out: THREE.Vector3): boolean {
    this.setNDCFromEvent(ev);
    this.raycaster.setFromCamera(this.ndc, this.camera as any);
    const p = this.raycaster.ray.intersectPlane(plane, out);
    return !!p;
  }

  private onPointerDown(ev: PointerEvent) {
    if (ev.button !== 0) return; // left only
    this.setNDCFromEvent(ev);
    this.raycaster.setFromCamera(this.ndc, this.camera as any);
    const hits = this.raycaster.intersectObjects(this.cube.children, true);
    const hit = hits[0];
    if (!hit || !hit.face) return;

    // Compute world-space face normal
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
    const p = hit.point.clone();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, p);

    // Stable tangents on the face plane
    const up = new THREE.Vector3(0, 1, 0);
    const alt = Math.abs(n.dot(up)) > 0.9 ? new THREE.Vector3(1, 0, 0) : up;
    const t1 = alt.clone().cross(n).normalize();
    const t2 = n.clone().cross(t1).normalize();

    this.dragActive = true;
    this.plane.copy(plane);
    this.n.copy(n);
    this.t1.copy(t1);
    this.t2.copy(t2);
    this.picked = hit.object;
    this.intersectOnPlane(ev, this.plane, this.start);
    this.last.copy(this.start);
    if (this.controls) this.controls.enabled = false;
    this.dom.setPointerCapture(ev.pointerId);
  }

  private onPointerMove(ev: PointerEvent) {
    if (!this.dragActive) return;
    if (!this.intersectOnPlane(ev, this.plane, this.last)) return;

    const step = this.step;
    const delta = this.last.clone().sub(this.start);
    const d1 = delta.dot(this.t1);
    const d2 = delta.dot(this.t2);
    const magnitude = Math.hypot(d1, d2);
    const startThreshold = step * 0.05;

    if (!this.pivot) {
      if (magnitude < startThreshold || !this.picked) return;

      this.useT1 = Math.abs(d1) >= Math.abs(d2);
      const tangent = this.useT1 ? this.t1 : this.t2;
      const axisVec = this.n.clone().cross(tangent).normalize();
      const axAbs = [Math.abs(axisVec.x), Math.abs(axisVec.y), Math.abs(axisVec.z)];
      const maxI = axAbs[0] > axAbs[1] ? (axAbs[0] > axAbs[2] ? 0 : 2) : (axAbs[1] > axAbs[2] ? 1 : 2);
      this.layerAxis = (['x', 'y', 'z'] as const)[maxI];
      this.axisDir = Math.sign((axisVec as any)[this.layerAxis]) || 1;

      // Determine layer using world coordinates
      const wp = new THREE.Vector3();
      this.picked.getWorldPosition(wp);
      this.layerVal = Math.round(((wp as any)[this.layerAxis]) / step) * step;

      // Build pivot and attach layer cubelets
      this.pivot = new THREE.Object3D();
      this.cube.add(this.pivot);
      const eps = step * LAYER_EPS_RATIO;
      this.selected = [];
      for (const child of [...this.cube.children]) {
        if (child === this.pivot) continue;
        const wpc = new THREE.Vector3();
        child.getWorldPosition(wpc);
        const value = (wpc as any)[this.layerAxis];
        if (Math.abs(value - this.layerVal) < eps) {
          this.pivot.attach(child);
          this.selected.push(child);
        }
      }
      this.currentAngle = 0;
      if (this.events.onLayerStart && this.layerAxis)
        this.events.onLayerStart(this.layerAxis, this.layerVal, this.selected);
      setHighlighted(this.selected, true);
    }

    if (this.pivot && this.layerAxis) {
      const signed = this.useT1 ? d1 : d2;
      const angle = (signed / step) * (Math.PI / 2) * this.axisDir;
      (this.pivot.rotation as any)[this.layerAxis] = angle;
      this.currentAngle = angle;
      if (this.events.onAngle) this.events.onAngle(this.layerAxis, angle);
    }
  }

  private onPointerUp(ev: PointerEvent) {
    if (!this.dragActive) return;
    this.dom.releasePointerCapture(ev.pointerId);
    if (this.controls) this.controls.enabled = true;

    if (!this.pivot || !this.layerAxis) {
      this.dragActive = false;
      return;
    }
    const q = Math.PI / 2;
    const snapped = Math.round(this.currentAngle / q) * q;
    (this.pivot.rotation as any)[this.layerAxis] = snapped;

    setHighlighted(this.selected, false);
    for (const child of this.selected) this.cube.attach(child);
    this.cube.remove(this.pivot);
    const selected = this.selected;
    const axis = this.layerAxis;
    const layer = this.layerVal;

    this.pivot = null;
    this.selected = [];
    this.layerAxis = null;
    this.currentAngle = 0;
    this.dragActive = false;

    if (this.events.onSnap) this.events.onSnap(axis, layer, snapped, selected);
  }
}

