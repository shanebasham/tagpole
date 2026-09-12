import * as THREE from 'three';

import type { Controls } from './controls';

import { PlayerMovement } from './playerMovement';
import { PlayerCamera } from './playerCamera';
import { PlayerDeath } from './playerDeath';
import { createPlayerModel } from './playerModel';

import type {
  NetworkPlayer
} from '../multiplayer/gameState';

export class Player {
  camera: THREE.PerspectiveCamera;
  controls: Controls;

  id: string;
  isIt: boolean;
  isFrozen: boolean;

  model: THREE.Group;

  private movement: PlayerMovement;
  private cameraSystem: PlayerCamera;
  private death: PlayerDeath;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    controls: Controls
  ) {
    this.camera = camera;
    this.controls = controls;

    this.id =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    this.isIt = false;
    this.isFrozen = false;

    this.model =
      createPlayerModel();

    this.model.visible =
      false;

    scene.add(
      this.model
    );

    this.movement =
      new PlayerMovement(
        camera,
        controls
      );

    this.cameraSystem =
      new PlayerCamera(
        camera,
        controls
      );

    this.death =
      new PlayerDeath(
        camera,
        this.model
      );
  }

  update(
    delta: number
  ) {
    if (this.death.active) {
      this.death.update(
        delta
      );

      this.cameraSystem.updateDeathCamera(
        this.model.position
      );

      return;
    }

    if (this.isFrozen) {
      this.updateTrappedPlayer();

      this.cameraSystem.updateTrapped();

      return;
    }

    this.cameraSystem.updateFirstPerson();

    this.movement.update(
      delta
    );
  }

  private updateTrappedPlayer() {
    const bubble =
      this.cameraSystem.getTrappedBubble();

    if (!bubble) {
      return;
    }

    this.model.position.copy(
      bubble.position
    );

    this.model.position.y -=
      0.15;

    this.model.rotation.set(
      0,
      this.controls.yaw,
      0
    );
  }

  setTrapped(
    trapped: boolean,
    bubble: THREE.Mesh | null = null
  ) {
    this.isFrozen =
      trapped;

    if (trapped) {
      this.model.visible =
        true;

      this.cameraSystem.setTrapped(
        bubble
      );
    } else {
      this.cameraSystem.clearTrapped();

      this.model.visible =
        false;
    }
  }

  startDeathFloat(
    onReachedSurface: () => void
  ) {
    this.isFrozen = false;

    this.cameraSystem.startDeathCamera();

    this.death.start(
      () => {
        this.cameraSystem.stopDeathCamera();

        onReachedSurface();
      }
    );
  }

  get position() {
    return this.camera.position;
  }

  // ==============================
  // NETWORK STATE
  // ==============================

  getNetworkState(): NetworkPlayer {
    return {
      id: this.id,

      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,

      yaw: this.controls.yaw,
      pitch: this.controls.pitch,

      vx: this.movement.velocity.x,
      vy: this.movement.velocity.y,
      vz: this.movement.velocity.z,

      alive: !this.death.active,

      trapped: this.isFrozen,

      isDrowned: this.isIt,
    };
  }
}