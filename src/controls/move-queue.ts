import * as THREE from 'three';
import { type Axis, animateLayerRotation } from './interaction';
import { TURN_DURATION_MS } from '../core/config';

export type Move = { axis: Axis; layer: number; angle: number };

export class MoveQueue {
  private cube: THREE.Group;
  private step: number;
  private queue: Move[] = [];
  private running = false;

  constructor(params: { cube: THREE.Group; step: number }) {
    this.cube = params.cube;
    this.step = params.step;
  }

  enqueue(move: Move) {
    this.queue.push(move);
    this.kick();
  }

  clear() {
    this.queue = [];
  }

  private async kick() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      const m = this.queue.shift()!;
      await animateLayerRotation(this.cube, m.axis, m.layer, m.angle, this.step, TURN_DURATION_MS);
    }
    this.running = false;
  }

  setCube(cube: THREE.Group) {
    this.cube = cube;
  }
}
