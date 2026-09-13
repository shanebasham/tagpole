import * as THREE from 'three';
import type { Controls } from './controls';

export class PlayerCamera {
  private camera: THREE.PerspectiveCamera;
  private controls: Controls;

  getTrappedBubble() {
    return this.trappedBubble;
    }

  // ==============================
  // TRAPPED CAMERA
  // ==============================

  private trappedBubble:
    THREE.Mesh | null = null;

  private trappedCameraDistance = 5;

  // ==============================
  // DEATH CAMERA
  // ==============================

  private deathCameraDistance = 5;

  // ==============================
  // CONSTRUCTOR
  // ==============================

  constructor(
    camera: THREE.PerspectiveCamera,
    controls: Controls
  ) {
    this.camera = camera;
    this.controls = controls;

    window.addEventListener(
      'wheel',
      (event) => {
        this.handleZoom(event);
      }
    );
  }

  // ==============================
  // ZOOM
  // ==============================

  private handleZoom(
    event: WheelEvent
  ) {
    // Death camera zoom
    if (this.deathActive) {
      this.deathCameraDistance +=
        event.deltaY * 0.01;

      this.deathCameraDistance =
        THREE.MathUtils.clamp(
          this.deathCameraDistance,
          2,
          12
        );

      return;
    }

    // Trapped camera zoom
    if (this.trappedBubble) {
      this.trappedCameraDistance +=
        event.deltaY * 0.01;

      this.trappedCameraDistance =
        THREE.MathUtils.clamp(
          this.trappedCameraDistance,
          2,
          12
        );
    }
  }

  // ==============================
  // FIRST PERSON
  // ==============================

  updateFirstPerson() {
    this.camera.rotation.set(
      this.controls.pitch,
      this.controls.yaw,
      0
    );
  }

  // ==============================
  // TRAPPED CAMERA
  // ==============================

  setTrapped(
    bubble: THREE.Mesh | null
  ) {
    this.trappedBubble =
      bubble;

    this.trappedCameraDistance = 5;
  }

  clearTrapped() {
    this.trappedBubble = null;
  }

  updateTrapped() {
    if (!this.trappedBubble) {
        return;
    }

    const target =
        this.trappedBubble.position;

    const forward =
        new THREE.Vector3(
        0,
        0,
        -1
        );

    forward.applyEuler(
        new THREE.Euler(
        this.controls.pitch,
        this.controls.yaw,
        0,
        'YXZ'
        )
    );

    forward.normalize();

    this.camera.position.copy(
        target
    );

    this.camera.position.addScaledVector(
        forward,
        -this.trappedCameraDistance
    );

    this.camera.lookAt(
        target
    );
    }

  // ==============================
  // DEATH CAMERA
  // ==============================

  private deathActive = false;

  startDeathCamera() {
    this.deathActive = true;

    this.deathCameraDistance = 5;
  }

  stopDeathCamera() {
    this.deathActive = false;
  }

  updateDeathCamera(
    target: THREE.Vector3
  ) {
    if (!this.deathActive) {
      return;
    }

    const lookTarget =
      target.clone();

    lookTarget.y += 0.05;

    // Start at the tadpole.
    this.camera.position.copy(
      lookTarget
    );

    // Calculate the direction the
    // player is looking.
    const forward =
      new THREE.Vector3(
        0,
        0,
        -1
      );

    forward.applyEuler(
      new THREE.Euler(
        this.controls.pitch,
        this.controls.yaw,
        0,
        'YXZ'
      )
    );

    // Move the camera backward
    // from the tadpole.
    this.camera.position.addScaledVector(
      forward,
      -this.deathCameraDistance
    );

    // Keep looking at the tadpole.
    this.camera.lookAt(
      lookTarget
    );
  }

  // ==============================
  // RESET
  // ==============================

  reset() {
    this.trappedBubble = null;

    this.trappedCameraDistance = 5;

    this.deathCameraDistance = 5;

    this.deathActive = false;
  }
}