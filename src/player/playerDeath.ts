import * as THREE from 'three';

export class PlayerDeath {
  private camera: THREE.PerspectiveCamera;
  private model: THREE.Group;

  // ==============================
  // DEATH STATE
  // ==============================

  active = false;

  private surfaceY = 30;

  private floatTimer = 0;

  private floatDuration = 5;

  private floatTime = 0;

  private onDeathComplete:
    (() => void) | null = null;

  // ==============================
  // CONSTRUCTOR
  // ==============================

  constructor(
    camera: THREE.PerspectiveCamera,
    model: THREE.Group
  ) {
    this.camera = camera;
    this.model = model;
  }

  // ==============================
  // START DEATH
  // ==============================

  start(
    onDeathComplete: () => void
  ) {
    this.active = true;

    this.floatTimer = 0;

    this.floatTime = 0;

    this.onDeathComplete =
      onDeathComplete;

    // ==============================
    // PLACE PLAYER AT SURFACE
    // ==============================

    this.model.position.set(
      this.camera.position.x,
      this.surfaceY + 0.15,
      this.camera.position.z
    );

    // Make sure the tadpole remains
    // visible during the death sequence.
    this.model.visible = true;
  }

  // ==============================
  // UPDATE
  // ==============================

  update(delta: number) {
    if (!this.active) {
      return;
    }

    this.floatTimer += delta;

    this.floatTime += delta;

    // ==============================
    // SURFACE FLOAT
    // ==============================

    // Keep the tadpole just barely
    // above the surface.
    this.model.position.y =
      this.surfaceY + 0.15;

    // Very subtle floating rotation.
    this.model.rotation.z =
      Math.sin(
        this.floatTime * 1.5
      ) * 0.08;

    // ==============================
    // FINISH DEATH
    // ==============================

    if (
      this.floatTimer >=
      this.floatDuration
    ) {
      this.active = false;

      this.model.visible = false;

      this.onDeathComplete?.();

      this.onDeathComplete = null;
    }
  }

  // ==============================
  // RESET
  // ==============================

  reset() {
    this.active = false;

    this.floatTimer = 0;

    this.floatTime = 0;

    this.onDeathComplete = null;
  }
}