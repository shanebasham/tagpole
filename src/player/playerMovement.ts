import * as THREE from 'three';

import type { Controls } from './controls';

import {
  updateMovement,
  getVelocity
} from './movement';

export class PlayerMovement {

  private camera: THREE.PerspectiveCamera;

  private controls: Controls;

  constructor(
    camera: THREE.PerspectiveCamera,
    controls: Controls
  ) {
    this.camera = camera;

    this.controls = controls;
  }

  // ==============================
  // UPDATE MOVEMENT
  // ==============================

  update(
    delta: number
  ) {
    updateMovement(
      this.camera,
      this.controls,
      delta
    );
  }

  // ==============================
  // POSITION
  // ==============================

  get position() {
    return this.camera.position;
  }

  // ==============================
  // ROTATION
  // ==============================

  get rotation() {
    return this.camera.rotation;
  }

  // ==============================
  // VELOCITY
  // ==============================

  get velocity() {
    return getVelocity();
  }
}